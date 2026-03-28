'use client';

import Link from 'next/link';
import { ArrowRight, Clipboard } from 'lucide-react';
import { Household, Visit } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Props {
  households: Household[];
  visits: Visit[];
}

export function FlaggedTable({ households, visits }: Props) {
  const flagged = households
    .filter((household) => ['high', 'critical'].includes(household.latest_risk_level))
    .sort((a, b) => b.latest_risk_score - a.latest_risk_score);

  const copySummary = async (household: Household) => {
    const latestVisit = visits.find((visit) => visit.household_id === household.id);
    const summary = [
      `Pahad Alert - ${household.code}`,
      `Area: ${household.area?.name ?? 'Unknown area'}`,
      `Risk: ${household.latest_risk_level} (${household.latest_risk_score}/100)`,
      `CHW: ${household.chw?.full_name ?? 'Unknown worker'}`,
      `Last visit: ${latestVisit?.visit_date ?? 'N/A'}`,
      `Key signals: ${(latestVisit?.key_signals ?? []).join(', ') || 'None recorded'}`,
      `Status: ${household.status}`,
    ].join('\n');
    await navigator.clipboard.writeText(summary);
  };

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink dark:text-white">Flagged households</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Highest-risk cases requiring follow-up.</p>
        </div>
      </div>
      <div className="space-y-3">
        {flagged.map((household) => (
          <div key={household.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink dark:text-white">{household.code}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{household.head_name}</p>
              </div>
              <RiskBadge level={household.latest_risk_level} score={household.latest_risk_score} size="sm" />
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{household.area?.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => copySummary(household)}>
                <Clipboard className="h-3.5 w-3.5" /> Copy summary
              </Button>
              <Link href={`/supervisor/household/${household.id}`} className="inline-flex items-center gap-2 rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-white">
                View details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
