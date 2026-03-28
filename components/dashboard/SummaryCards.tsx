import { Card } from '@/components/ui/Card';

export function SummaryCards({ items }: { items: { label: string; value: string | number; caption: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-gradient-to-br from-white via-white to-brand-soft/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-ink dark:text-white">{item.value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.caption}</p>
        </Card>
      ))}
    </div>
  );
}
