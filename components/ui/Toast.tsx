'use client';

import { X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const toneClasses = {
  info: 'border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
};

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto rounded-2xl border p-4 shadow-lg ${toneClasses[toast.tone ?? 'info']}`}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
            </div>
            <button type="button" onClick={() => dismissToast(toast.id)} className="rounded-full p-1 opacity-60 transition hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
