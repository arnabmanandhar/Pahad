import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskBadge } from '@/components/ui/Badge';
import { TrendSparkline } from '@/components/dashboard/TrendSparkline';
import { HouseholdTrendChart, VisitSignalBars, VisitSignalRadar } from '@/components/dashboard/HouseholdCharts';
import { getHouseholds, getVisits } from '@/lib/data';

export default async function SupervisorHouseholdDetailPage({ params }: { params: { id: string } }) {
  const [households, visits] = await Promise.all([getHouseholds(), getVisits()]);
  const household = households.find((item) => item.id === params.id);
  if (!household) return notFound();
  const householdVisits = visits.filter((visit) => visit.household_id === household.id).sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  const latestVisit = householdVisits[0];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-white to-brand-soft/50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Household detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-white">{household.code} - {household.head_name}</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{household.area?.name} - CHW {household.chw?.full_name}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <RiskBadge level={household.latest_risk_level} score={household.latest_risk_score} size="lg" />
              <TrendSparkline visits={householdVisits} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Mark Reviewed</Button>
            <Button>Mark Referred</Button>
          </div>
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-ink dark:text-white">Risk trend across visits</h2>
          <div className="mt-4">
            <HouseholdTrendChart visits={householdVisits} />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-ink dark:text-white">Signal radar</h2>
          {latestVisit ? <VisitSignalRadar responses={latestVisit.responses} /> : <p className="mt-4 text-slate-500">No visit data.</p>}
        </Card>
      </div>
      <Card>
        <h2 className="text-lg font-semibold text-ink dark:text-white">Latest signal breakdown</h2>
        {latestVisit ? <VisitSignalBars responses={latestVisit.responses} /> : <p className="mt-4 text-slate-500">No visit data.</p>}
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-ink dark:text-white">Visit history</h2>
        <div className="mt-4 space-y-4">
          {householdVisits.map((visit) => (
            <details key={visit.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink dark:text-white">{visit.visit_date}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{visit.explanation_en}</p>
                </div>
                <RiskBadge level={visit.risk_level} score={visit.total_score} />
              </summary>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {Object.entries(visit.responses).map(([key, value]) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-600 dark:text-slate-300">{key.replace('_', ' ')}</span>
                      <span className="font-semibold text-ink dark:text-white">{value}/3</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${(Number(value) / 3) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}