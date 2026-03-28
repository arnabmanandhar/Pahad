'use client';

import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { Area } from '@/lib/supabase/types';

export interface AreaRiskData {
  area: Area;
  avgScore: number;
  householdCount: number;
  highRiskCount: number;
}

interface Props {
  areaRiskData: AreaRiskData[];
  onAreaClick?: (area: Area) => void;
}

type LayerMode = 'districts' | 'provinces';

type Position = [number, number];
type PolygonCoords = Position[];
type RingCoords = PolygonCoords[];

type GeoFeature = {
  type: 'Feature';
  properties: Record<string, string | number>;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: RingCoords | RingCoords[];
  };
};

type GeoFeatureCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

interface ChoroplethDatum {
  name: string;
  avgScore: number;
  householdCount: number;
  highRiskCount: number;
  areas: AreaRiskData[];
  provinceId?: number;
}

interface NepalGeoData {
  districts: GeoFeatureCollection;
  provinces: GeoFeatureCollection;
}

interface TooltipState {
  x: number;
  y: number;
  title: string;
  provinceLabel?: string;
  avgScore: number;
  householdCount: number;
  highRiskCount: number;
  specificLocations: string[];
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const MAP_WIDTH = 1000;
const MAP_HEIGHT = 640;
const MAP_PADDING = 24;

function toFeatureCollection(input: unknown): GeoFeatureCollection {
  const candidate = input as Partial<GeoFeatureCollection> & Partial<GeoFeature>;

  if (candidate?.type === 'FeatureCollection' && Array.isArray(candidate.features)) {
    return candidate as GeoFeatureCollection;
  }

  if (candidate?.type === 'Feature') {
    return {
      type: 'FeatureCollection',
      features: [candidate as GeoFeature],
    };
  }

  return {
    type: 'FeatureCollection',
    features: [],
  };
}

function getScoreColor(score: number) {
  if (score <= 0) return '#e2e8f0';
  if (score <= 15) return '#dbeafe';
  if (score <= 30) return '#10b981';
  if (score <= 45) return '#84cc16';
  if (score <= 60) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

function normalizeDistrictName(value: string) {
  return value
    .toUpperCase()
    .replace(/DISTRICT/g, '')
    .replace(/NO\./g, 'NO')
    .replace(/\([^)]*\)/g, '')
    .replace(/BARDAGHATSUSTAEAST/g, 'NAWALPARASI4')
    .replace(/BARDAGHATSUSTAWEST/g, 'NAWALPARASI5')
    .replace(/RUKUMEAST/g, 'RUKUM5')
    .replace(/RUKUMWEST/g, 'RUKUM6')
    .replace(/SINDHUPALCHOWK/g, 'SINDHUPALCHOK')
    .replace(/KABHREPALANCHOK/g, 'KAVREPALANCHOWK')
    .replace(/KABHREPALANCHOWK/g, 'KAVREPALANCHOWK')
    .replace(/KAVREPALANCHOK/g, 'KAVREPALANCHOWK')
    .replace(/[^A-Z0-9]/g, '');
}

function getProvinceLabel(id: number, fallback?: string) {
  const labels: Record<number, string> = {
    1: 'Koshi',
    2: 'Madhesh',
    3: 'Bagmati',
    4: 'Gandaki',
    5: 'Lumbini',
    6: 'Karnali',
    7: 'Sudurpashchim',
  };
  return labels[id] ?? fallback ?? `Province ${id}`;
}

function getFeaturePolygons(feature: GeoFeature): RingCoords[] {
  if (feature.geometry.type === 'Polygon') {
    return [feature.geometry.coordinates as RingCoords];
  }
  return feature.geometry.coordinates as RingCoords[];
}

function computeBounds(collection: GeoFeatureCollection): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  collection.features.forEach((feature) => {
    getFeaturePolygons(feature).forEach((polygon) => {
      polygon.forEach((ring) => {
        ring.forEach(([lon, lat]) => {
          if (lon < minX) minX = lon;
          if (lat < minY) minY = lat;
          if (lon > maxX) maxX = lon;
          if (lat > maxY) maxY = lat;
        });
      });
    });
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function projectPoint(lon: number, lat: number, bounds: Bounds) {
  const width = Math.max(bounds.maxX - bounds.minX, 0.0001);
  const height = Math.max(bounds.maxY - bounds.minY, 0.0001);
  const scale = Math.min((MAP_WIDTH - MAP_PADDING * 2) / width, (MAP_HEIGHT - MAP_PADDING * 2) / height);
  const offsetX = (MAP_WIDTH - width * scale) / 2;
  const offsetY = (MAP_HEIGHT - height * scale) / 2;

  return {
    x: (lon - bounds.minX) * scale + offsetX,
    y: (bounds.maxY - lat) * scale + offsetY,
  };
}

function featureToPath(feature: GeoFeature, bounds: Bounds) {
  return getFeaturePolygons(feature)
    .map((polygon) => polygon
      .map((ring) => ring
        .map(([lon, lat], index) => {
          const point = projectPoint(lon, lat, bounds);
          return `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        })
        .join(' ') + ' Z')
      .join(' '))
    .join(' ');
}

function MapToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
    >
      {children}
    </button>
  );
}

export default function NepalMap({ areaRiskData, onAreaClick }: Props) {
  const [mode, setMode] = useState<LayerMode>('districts');
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<NepalGeoData | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const aggregated = useMemo(() => {
    const districts = new Map<string, ChoroplethDatum>();

    areaRiskData.forEach((item) => {
      const key = normalizeDistrictName(item.area.district);
      const current = districts.get(key) ?? {
        name: item.area.district,
        avgScore: 0,
        householdCount: 0,
        highRiskCount: 0,
        areas: [],
      };

      current.avgScore += item.avgScore * Math.max(1, item.householdCount);
      current.householdCount += item.householdCount;
      current.highRiskCount += item.highRiskCount;
      current.areas.push(item);
      districts.set(key, current);
    });

    districts.forEach((value) => {
      value.avgScore = value.householdCount ? Math.round(value.avgScore / value.householdCount) : 0;
    });

    return districts;
  }, [areaRiskData]);

  useEffect(() => {
    let cancelled = false;

    async function loadGeoData() {
      try {
        setIsLoadingGeo(true);
        const [districtsRes, provincesRes] = await Promise.all([
          fetch('/geo/nepal-districts-lite.json', { cache: 'force-cache' }),
          fetch('/geo/nepal-provinces-lite.json', { cache: 'force-cache' }),
        ]);

        if (!districtsRes.ok || !provincesRes.ok) {
          throw new Error('Unable to load Nepal boundary files');
        }

        const [districtsJson, provincesJson] = await Promise.all([districtsRes.json(), provincesRes.json()]);
        if (cancelled) return;

        setGeoData({
          districts: toFeatureCollection(districtsJson),
          provinces: toFeatureCollection(provincesJson),
        });
        setMapError(null);
      } catch (error) {
        if (!cancelled) {
          setMapError(error instanceof Error ? error.message : 'Unable to load map geometry');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingGeo(false);
        }
      }
    }

    loadGeoData();
    return () => {
      cancelled = true;
    };
  }, []);

  const provinceAggregates = useMemo(() => {
    const provinceMap = new Map<number, ChoroplethDatum>();
    if (!geoData) return provinceMap;

    const districtProvinceMap = new Map<string, number>();
    geoData.districts.features.forEach((feature) => {
      districtProvinceMap.set(
        normalizeDistrictName(String(feature.properties.DISTRICT ?? feature.properties.district ?? '')),
        Number(feature.properties.PROVINCE ?? feature.properties.province ?? 0),
      );
    });

    aggregated.forEach((datum, key) => {
      const provinceId = districtProvinceMap.get(key) ?? 0;
      const current = provinceMap.get(provinceId) ?? {
        name: getProvinceLabel(provinceId),
        avgScore: 0,
        householdCount: 0,
        highRiskCount: 0,
        areas: [],
        provinceId,
      };
      current.avgScore += datum.avgScore * Math.max(1, datum.householdCount);
      current.householdCount += datum.householdCount;
      current.highRiskCount += datum.highRiskCount;
      current.areas.push(...datum.areas);
      provinceMap.set(provinceId, current);
    });

    provinceMap.forEach((value) => {
      value.avgScore = value.householdCount ? Math.round(value.avgScore / value.householdCount) : 0;
    });

    return provinceMap;
  }, [aggregated, geoData]);

  const activeCollection = useMemo(() => {
    if (!geoData) return null;
    return mode === 'districts' ? geoData.districts : geoData.provinces;
  }, [geoData, mode]);

  const bounds = useMemo(() => (activeCollection ? computeBounds(activeCollection) : null), [activeCollection]);

  const renderedFeatures = useMemo(() => {
    if (!activeCollection || !bounds) return [];

    return activeCollection.features.map((feature) => {
      const key = mode === 'districts'
        ? normalizeDistrictName(String(feature.properties.DISTRICT ?? feature.properties.district ?? ''))
        : `province-${Number(feature.properties.id ?? feature.properties.Province ?? 0)}`;

      const datum = mode === 'districts'
        ? aggregated.get(key)
        : provinceAggregates.get(Number(feature.properties.id ?? feature.properties.Province ?? 0));

      const title = mode === 'districts'
        ? String(feature.properties.DISTRICT ?? feature.properties.district ?? 'Unknown district')
        : getProvinceLabel(
            Number(feature.properties.id ?? feature.properties.Province ?? 0),
            String(feature.properties.name ?? feature.properties.DISTRICT ?? 'Unknown province'),
          );

      const provinceLabel = mode === 'districts'
        ? getProvinceLabel(Number(feature.properties.PROVINCE ?? feature.properties.province ?? 0))
        : undefined;

      const specificLocations = (datum?.areas ?? [])
        .map(({ area }) => area.name)
        .filter((value, index, arr) => arr.indexOf(value) === index)
        .sort((left, right) => left.localeCompare(right));

      return {
        key,
        title,
        provinceLabel,
        path: featureToPath(feature, bounds),
        avgScore: datum?.avgScore ?? 0,
        householdCount: datum?.householdCount ?? 0,
        highRiskCount: datum?.highRiskCount ?? 0,
        specificLocations,
        areas: datum?.areas ?? [],
      };
    });
  }, [activeCollection, aggregated, bounds, mode, provinceAggregates]);

  function handleMove(event: ReactMouseEvent<SVGPathElement>, item: (typeof renderedFeatures)[number]) {
    const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      x: event.clientX - rect.left + 16,
      y: event.clientY - rect.top + 16,
      title: item.title,
      provinceLabel: item.provinceLabel,
      avgScore: item.avgScore,
      householdCount: item.householdCount,
      highRiskCount: item.highRiskCount,
      specificLocations: item.specificLocations,
    });
  }

  const hasUsableMap = renderedFeatures.length > 0 && bounds;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ minHeight: 560 }}>
      <div className="absolute left-4 top-4 z-20 flex gap-2 rounded-2xl border border-white/60 bg-white/90 p-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <MapToggle active={mode === 'districts'} onClick={() => setMode('districts')}>Districts</MapToggle>
        <MapToggle active={mode === 'provinces'} onClick={() => setMode('provinces')}>Provinces</MapToggle>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
        <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Hover for risk details</p>
        <div className="flex items-center gap-2">
          <span>Low</span>
          <div className="h-2 w-32 rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #84cc16 24%, #eab308 50%, #f97316 74%, #ef4444 100%)' }} />
          <span>Critical</span>
        </div>
      </div>

      <div className="relative h-[560px] w-full bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.10),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_45%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#111827_45%,_#020617_100%)]">
        {hasUsableMap ? (
          <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-full w-full">
            <g>
              {renderedFeatures.map((item) => {
                const isActive = hoveredKey === item.key;
                const fill = getScoreColor(item.avgScore);
                return (
                  <path
                    key={item.key}
                    d={item.path}
                    fill={fill}
                    fillOpacity={item.avgScore > 0 ? (isActive ? 0.95 : 0.78) : 0.38}
                    stroke={isActive ? '#0f172a' : '#ffffff'}
                    strokeWidth={isActive ? 2.4 : mode === 'districts' ? 1.15 : 1.8}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredKey(item.key)}
                    onMouseMove={(event) => handleMove(event, item)}
                    onMouseLeave={() => {
                      setHoveredKey(null);
                      setTooltip(null);
                    }}
                    onClick={() => {
                      if (item.areas[0]) {
                        onAreaClick?.(item.areas[0].area);
                      }
                    }}
                  />
                );
              })}
            </g>
          </svg>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <div className="mx-auto h-28 w-28 rounded-full bg-slate-100 dark:bg-slate-800" />
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Map data is preparing...</p>
            </div>
          </div>
        )}

        {tooltip ? (
          <div
            className="pointer-events-none absolute z-30 min-w-[220px] rounded-2xl border border-slate-200 bg-white/96 px-4 py-3 text-sm shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/96"
            style={{ left: Math.min(tooltip.x, MAP_WIDTH - 260) / MAP_WIDTH * 100 + '%', top: Math.min(tooltip.y, MAP_HEIGHT - 140) / MAP_HEIGHT * 100 + '%' }}
          >
            <div className="font-semibold text-slate-900 dark:text-white">{tooltip.title}</div>
            {tooltip.provinceLabel ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Province: {tooltip.provinceLabel}</div> : null}
            <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div>Average risk: <span className="font-semibold" style={{ color: getScoreColor(tooltip.avgScore) }}>{tooltip.avgScore}/100</span></div>
              <div>Households: <span className="font-semibold">{tooltip.householdCount}</span></div>
              <div>High/Critical: <span className="font-semibold">{tooltip.highRiskCount}</span></div>
            </div>
            {tooltip.specificLocations.length > 0 ? (
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Reported locations</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tooltip.specificLocations.map((location) => (
                    <span key={location} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {isLoadingGeo ? (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/72 backdrop-blur-sm dark:bg-slate-950/72">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
              <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Loading Nepal boundary data...</p>
            </div>
          </div>
        ) : null}

        {mapError ? (
          <div className="absolute inset-x-6 bottom-6 z-20 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/70 dark:text-red-200">
            Map error: {mapError}
          </div>
        ) : null}
      </div>
    </div>
  );
}
