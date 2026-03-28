import Link from 'next/link';
import { CalendarDays, ShieldAlert } from 'lucide-react';
import { getHouseholds, getVisits } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RiskBadge } from '@/components/ui/Badge';

export default async function ChwHomePage() {
  const [households, visits] = await Promise.all([getHouseholds(), getVisits()]);
  const chwHouseholds = households.filter((household) => household.assigned_chw_id === 'chw-1');
  const chwVisits = visits.filter((visit) => visit.chw_id === 'chw-1');

  const stats = [
    { label: 'Visits this month', value: chwVisits.length },
    { label: 'Assigned households', value: chwHouseholds.length },
    { label: 'Pending syncs', value: 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-gradient-to-br from-white to-brand-soft/40 dark:from-slate-900 dark:to-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold text-ink dark:text-white">{stat.value}</p>
          </Card>
        ))}
      </section>
      <Card className="bg-gradient-to-r from-brand to-emerald-500 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/70">Today's priority</p>
            <h2 className="mt-2 text-3xl font-semibold">Start a new household visit</h2>
            <p className="mt-2 text-white/80">Capture observations, score risk, and sync explainable results in one flow.</p>
          </div>
          <Link href="/app/visit/new"><Button variant="secondary" className="bg-white text-brand hover:bg-emerald-50">Start New Visit</Button></Link>
        </div>
      </Card>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink dark:text-white">Recent visits</h3>
          <CalendarDays className="h-5 w-5 text-slate-400" />
        </div>
        <div className="space-y-3">
          {chwVisits.slice(0, 5).map((visit) => (
            <Link key={visit.id} href={`/app/visits/${visit.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-brand/30 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900">
              <div>
                <p className="font-semibold text-ink dark:text-white">{visit.household?.code} - {visit.household?.head_name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{visit.visit_date}</p>
              </div>
              <RiskBadge level={visit.risk_level} score={visit.total_score} />
            </Link>
          ))}
        </div>
      </Card>
      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
        <p className="text-sm text-amber-900 dark:text-amber-100">High or critical risk visits should be escalated to a supervisor the same day, especially when self-harm or hopelessness are present.</p>
      </Card>
    </div>
  );
}