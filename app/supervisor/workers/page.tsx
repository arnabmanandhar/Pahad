import { Card } from '@/components/ui/Card';
import { demoProfiles, demoVisits } from '@/lib/demo-data';

export default function WorkersPage() {
  const workerRows = demoProfiles.filter((profile) => profile.role === 'chw').map((profile) => ({
    ...profile,
    visitCount: demoVisits.filter((visit) => visit.chw_id === profile.id).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-ink dark:text-white">CHW Activity</h1>
      <Card>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4">Worker</th>
                <th className="py-3 pr-4">Area</th>
                <th className="py-3 pr-4">Visits</th>
              </tr>
            </thead>
            <tbody>
              {workerRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 dark:border-slate-900">
                  <td className="py-4 pr-4 font-medium text-ink dark:text-white">{row.full_name}</td>
                  <td className="py-4 pr-4 text-slate-500 dark:text-slate-400">{row.area_id}</td>
                  <td className="py-4 pr-4">{row.visitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
