import { notFound } from 'next/navigation';
import { getVisits } from '@/lib/data';
import { RiskExplanation } from '@/components/visits/RiskExplanation';
import { Card } from '@/components/ui/Card';

export default async function VisitDetailPage({ params }: { params: { id: string } }) {
  const visits = await getVisits();
  const visit = visits.find((entry) => entry.id === params.id);
  if (!visit) return notFound();

  return (
    <div className="space-y-6">
      <RiskExplanation visit={visit} lang="en" />
      <Card>
        <h2 className="text-lg font-semibold text-ink dark:text-white">Visit notes</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{visit.notes ?? 'No additional notes were recorded for this visit.'}</p>
      </Card>
    </div>
  );
}
