'use client';

import { Globe2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
      <Globe2 className="ml-2 h-4 w-4 text-slate-400" />
      <button type="button" onClick={() => setLang('en')} className={`rounded-full px-3 py-1 text-sm font-medium ${lang === 'en' ? 'bg-brand text-white' : 'text-slate-600 dark:text-slate-300'}`}>
        EN
      </button>
      <button type="button" onClick={() => setLang('ne')} className={`rounded-full px-3 py-1 text-sm font-medium ${lang === 'ne' ? 'bg-brand text-white' : 'text-slate-600 dark:text-slate-300'}`}>
        ने
      </button>
    </div>
  );
}