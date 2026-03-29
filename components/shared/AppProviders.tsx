'use client';

import { I18nProvider } from '@/hooks/useI18n';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/hooks/useToast';
import { ToastViewport } from '@/components/ui/Toast';
import { InstallPrompt } from './InstallPrompt';
import { OfflineBanner } from './OfflineBanner';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <ServiceWorkerRegistration />
          <OfflineBanner />
          <InstallPrompt />
          {children}
          <ToastViewport />
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
