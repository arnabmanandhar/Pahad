import { Card } from '@/components/ui/Card';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { FlaggedTable } from '@/components/dashboard/FlaggedTable';
import { getDashboardData } from '@/lib/data';
import NepalMap from '@/components/map/NepalMap';

export default async function SupervisorDashboardPage() {
  const { areas, households, visits, profiles } = await getDashboardData();

  const areaRiskData = areas.map((area) => {
    const areaHouseholds = households.filter((household) => household.area_id === area.id);
    const avgScore = areaHouseholds.length ? Math.round(areaHouseholds.reduce((sum, household) => sum + household.latest_risk_score, 0) / areaHouseholds.length) : 0;
    return {
      area,
      avgScore,
      householdCount: areaHouseholds.length,
      highRiskCount: areaHouseholds.filter((household) => ['high', 'critical'].includes(household.latest_risk_level)).length,
    };
  });

  const last24HoursFlags = visits.filter((visit) => ['high', 'critical'].includes(visit.risk_level) && Date.now() - new Date(visit.created_at).getTime() <= 24 * 60 * 60 * 1000).length;

  const summaryItems = [
    { label: 'Total Screenings', value: visits.length, caption: 'this month' },
    { label: 'Flagged Households', value: households.filter((household) => ['high', 'critical'].includes(household.latest_risk_level)).length, caption: 'high or critical' },
    { label: 'Active CHWs', value: profiles.filter((profile) => profile.role === 'chw').length, caption: 'at least one visit' },
    { label: 'Avg Area Risk', value: Math.round(areaRiskData.reduce((sum, area) => sum + area.avgScore, 0) / Math.max(1, areaRiskData.length)), caption: 'across wards' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-slate-950 via-brand-dark to-brand text-white">
        <p className="text-sm uppercase tracking-[0.25em] text-white/60">Live supervisor pulse</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-3xl font-semibold">Risk heatmap command center</h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400 animate-pulse" />
            {last24HoursFlags} new flags in the last 24 hours
          </div>
        </div>
      </Card>
      <SummaryCards items={summaryItems} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <NepalMap areaRiskData={areaRiskData} />
          <Card>
            <h3 className="text-lg font-semibold text-ink dark:text-white">Area risk over the last 4 weeks</h3>
            <div className="mt-6 grid gap-3">
              {areaRiskData.map((item) => (
                <div key={item.area.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{item.area.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{item.avgScore}/100</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" style={{ width: `${item.avgScore}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <FlaggedTable households={households} visits={visits} />
      </div>
    </div>
  );
}
