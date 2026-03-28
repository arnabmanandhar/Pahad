import Link from 'next/link';
import { getVisits } from '@/lib/data';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/Badge';

export default async function VisitsPage() {
  const visits = (await getVisits()).filter((visit) => visit.chw_id === 'chw-1');

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold text-ink dark:text-white">Visit history</h1>
      {visits.map((visit) => (
        <Link key={visit.id} href={`/app/visits/${visit.id}`}>
          <Card className="transition hover:border-brand/30 hover:shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-ink dark:text-white">{visit.household?.code} - {visit.household?.head_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{visit.visit_date}</p>
              </div>
              <RiskBadge level={visit.risk_level} score={visit.total_score} />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
