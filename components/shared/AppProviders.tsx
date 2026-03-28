'use client';

import { I18nProvider } from '@/hooks/useI18n';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import { ToastViewport } from '@/components/ui/Toast';
import { OfflineBanner } from './OfflineBanner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <OfflineBanner />
          {children}
          <ToastViewport />
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
