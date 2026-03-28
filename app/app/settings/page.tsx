import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LanguageToggle } from '@/components/shared/LanguageToggle';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-semibold text-ink dark:text-white">Field settings</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Adjust the language and theme used during household screening.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Card>
    </div>
  );
}
