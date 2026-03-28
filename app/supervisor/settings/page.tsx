import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export default function SupervisorSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold text-ink dark:text-white">Supervisor settings</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Use language and theme controls to adapt the dashboard for review meetings or field follow-up.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Card>
    </div>
  );
}
