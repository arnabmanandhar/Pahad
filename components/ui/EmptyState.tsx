import { ReactNode } from 'react';
import { Card } from './Card';

interface Props {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: Props) {
  return (
    <Card className="border-dashed text-center">
      {icon ? <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-ink dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
  );
}
