'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
  persistent?: boolean;
}

interface ToastContextValue {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((current) => [...current, { id, ...toast }]);
    if (!toast.persistent) {
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4000);
    }
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toasts, pushToast, dismissToast }), [dismissToast, pushToast, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
