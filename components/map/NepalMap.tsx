'use client';

import { useEffect, useRef } from 'react';
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

function getScoreColor(score: number) {
  if (score <= 30) return '#10b981';
  if (score <= 45) return '#84cc16';
  if (score <= 60) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

export default function NepalMap({ areaRiskData, onAreaClick }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = await import('leaflet');
      if (!mounted || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [27.85, 85.62],
        zoom: 8,
        minZoom: 7,
        maxZoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        opacity: 0.7,
      }).addTo(map);

      mapInstanceRef.current = { map, L };
      renderMarkers(map, L, areaRiskData, onAreaClick);
    }

    init();
    return () => {
      mounted = false;
      mapInstanceRef.current?.map.remove();
      mapInstanceRef.current = null;
    };
  }, [areaRiskData, onAreaClick]);

  useEffect(() => {
    const current = mapInstanceRef.current;
    if (!current) return;
    const { map, L } = current;
    map.eachLayer((layer: any) => {
      if (!layer._url) map.removeLayer(layer);
    });
    renderMarkers(map, L, areaRiskData, onAreaClick);
  }, [areaRiskData, onAreaClick]);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ minHeight: 480 }}>
      <div ref={mapRef} className="h-[480px] w-full" />
      <div className="absolute left-4 top-4 z-[1000] rounded-2xl border border-white/60 bg-white/85 px-3 py-2 text-xs text-slate-600 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-300">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
          Live screening pulse
        </div>
        <div className="flex items-center gap-2">
          <span>Low</span>
          <div className="h-2 w-28 rounded-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #84cc16 24%, #eab308 50%, #f97316 74%, #ef4444 100%)' }} />
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}

function renderMarkers(map: any, L: any, areaRiskData: AreaRiskData[], onAreaClick?: (area: Area) => void) {
  areaRiskData.forEach((item) => {
    const color = getScoreColor(item.avgScore);
    const radius = Math.max(18, Math.min(42, 20 + item.householdCount * 4));

    if (item.avgScore > 60) {
      L.circle([item.area.center_lat, item.area.center_lng], {
        radius: radius * 140,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.35,
        className: 'risk-pulse-ring',
      }).addTo(map);
    }

    const marker = L.circle([item.area.center_lat, item.area.center_lng], {
      radius: radius * 100,
      color,
      fillColor: color,
      fillOpacity: 0.48,
      weight: 2,
    }).addTo(map);

    marker.bindTooltip(`<div style="min-width:180px;font-family:Inter,system-ui,sans-serif"><strong>${item.area.name}</strong><div style="margin-top:6px;font-size:12px">Avg score: <strong style="color:${color}">${item.avgScore}</strong></div><div style="font-size:12px">Households: ${item.householdCount}</div><div style="font-size:12px">High/Critical: ${item.highRiskCount}</div></div>`, { sticky: true, opacity: 0.96 });

    const label = L.divIcon({
      className: '',
      html: `<div style="background:white;border:2px solid ${color};border-radius:10px;padding:2px 8px;font-size:11px;font-weight:700;color:${color};box-shadow:0 10px 20px rgba(15,23,42,.15)">${item.avgScore || '-'} </div>`,
      iconAnchor: [18, 12],
    });

    L.marker([item.area.center_lat + 0.03, item.area.center_lng], { icon: label }).addTo(map);

    if (onAreaClick) marker.on('click', () => onAreaClick(item.area));
  });
}
