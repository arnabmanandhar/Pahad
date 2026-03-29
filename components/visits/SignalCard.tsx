'use client';

import clsx from 'clsx';
import { RESPONSE_OPTIONS, SIGNALS } from '@/lib/constants';
import { SignalResponses } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  signalKey: keyof SignalResponses;
  value: 0 | 1 | 2 | 3;
  onChange: (value: 0 | 1 | 2 | 3) => void;
}

const optionClasses = [
  'border-slate-200 bg-slate-50 text-slate-600',
  'border-amber-300 bg-amber-50 text-amber-800',
  'border-orange-300 bg-orange-50 text-orange-800',
  'border-red-300 bg-red-50 text-red-800',
];

export function SignalCard({ signalKey, value, onChange }: Props) {
  const { lang } = useI18n();
  const signal = SIGNALS.find((item) => item.key === signalKey);
  if (!signal) return null;

  return (
    <Card className={clsx('transition', value >= 2 && 'shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_24px_36px_-28px_rgba(249,115,22,0.85)]')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink dark:text-white">{lang === 'ne' ? signal.question_ne : signal.question_en}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <span>{lang === 'ne' ? signal.label_ne : signal.label_en}</span>
            <span>Weight {signal.weight}</span>
            {(signal.key === 'self_harm' || signal.key === 'wish_to_die') ? (
              <span className="rounded-full bg-red-100 px-2 py-1 font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">Critical override</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {RESPONSE_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx('rounded-2xl border px-3 py-3 text-left text-sm font-medium transition', optionClasses[option.value], value === option.value && 'ring-2 ring-offset-2 ring-brand/30')}
          >
            <span className="mb-1 block text-xs font-semibold uppercase opacity-70">{option.value}</span>
            {lang === 'ne' ? option.label_ne : option.label_en}
          </button>
        ))}
      </div>
    </Card>
  );
}
