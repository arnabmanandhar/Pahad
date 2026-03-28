'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '@/i18n/en.json';
import ne from '@/i18n/ne.json';

type Lang = 'en' | 'ne';

const dictionaries = { en, ne } as const;

type Dictionary = typeof en;

interface I18nContextValue {
  lang: Lang;
  dictionary: Dictionary;
  setLang: (lang: Lang) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolvePath(obj: Record<string, unknown>, path: string): string {
  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

  return typeof result === 'string' ? result : path;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = window.localStorage.getItem('pahad-lang');
    if (stored === 'en' || stored === 'ne') {
      setLangState(stored);
    }
  }, []);

  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    window.localStorage.setItem('pahad-lang', nextLang);
  };

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    dictionary: dictionaries[lang],
    setLang,
    t: (path) => resolvePath(dictionaries[lang] as unknown as Record<string, unknown>, path),
  }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}
