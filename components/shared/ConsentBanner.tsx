import { AlertTriangle } from 'lucide-react';

export function ConsentBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-100 ${compact ? 'p-3 text-sm' : 'p-4 text-sm md:text-base'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Pahad is a decision-support tool only. Obtain consent, avoid diagnosis language, and escalate urgent safety concerns immediately.</p>
      </div>
    </div>
  );
}
