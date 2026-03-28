'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScoreResponse, Visit } from '@/lib/supabase/types';
import { Card } from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/Badge';

export function RiskExplanation({ visit, lang }: { visit: Visit | ScoreResponse; lang: 'en' | 'ne' }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const target = 'total_score' in visit ? visit.total_score : visit.score;

  useEffect(() => {
    let raf = 0;
    const started = performance.now();
    const duration = 1200;
    const step = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      setAnimatedScore(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const explanation = useMemo(() => {
    return lang === 'ne' ? visit.explanation_ne : visit.explanation_en;
  }, [lang, visit]);

  return (
    <Card className="border-2 border-brand/20 bg-gradient-to-br from-white to-brand-soft/40 dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Risk result</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-6xl font-semibold tracking-tight text-brand">{animatedScore}</span>
            <span className="pb-2 text-sm text-slate-400">/100</span>
          </div>
          <div className="mt-4">
            <RiskBadge level={visit.risk_level} size="lg" language={lang} />
          </div>
        </div>
        <div className="rounded-2xl bg-white/70 p-4 dark:bg-slate-950/50">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Confidence</p>
          <p className="mt-1 text-2xl font-semibold text-ink dark:text-white">{visit.confidence}%</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{'scoring_method' in visit && visit.scoring_method === 'llm' ? 'AI-assisted explanation' : 'Standard weighted explanation'}</p>
        </div>
      </div>
      {(visit.key_signals ?? []).length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {(visit.key_signals ?? []).map((signal) => (
            <span key={signal} className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand dark:border-brand/30 dark:bg-brand/20">
              {signal}
            </span>
          ))}
        </div>
      ) : null}
      <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">{explanation}</p>
      <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800">Decision-support only. Does not diagnose mental health conditions.</p>
    </Card>
  );
}
