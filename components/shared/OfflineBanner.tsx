'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { APP_COPY } from '@/lib/constants';
import { useI18n } from '@/hooks/useI18n';
import { useToast } from '@/hooks/useToast';

export function OfflineBanner() {
  const { lang } = useI18n();
  const { pushToast } = useToast();
  const [online, setOnline] = useState(true);
  const wasOffline = useRef(false);

  useEffect(() => {
    const syncStatus = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (!isOnline && !wasOffline.current) {
        pushToast({
          title: APP_COPY.offline[lang],
          tone: 'warning',
          persistent: true,
        });
      }
      wasOffline.current = !isOnline;
    };

    syncStatus();
    window.addEventListener('online', syncStatus);
    window.addEventListener('offline', syncStatus);
    return () => {
      window.removeEventListener('online', syncStatus);
      window.removeEventListener('offline', syncStatus);
    };
  }, [lang, pushToast]);

  if (online) {
    return null;
  }

  return (
    <div className="border-b border-amber-300 bg-amber-100/90 px-4 py-3 text-sm text-amber-900 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>{APP_COPY.offline[lang]}</span>
        <AlertTriangle className="ml-auto h-4 w-4 text-amber-700" />
      </div>
    </div>
  );
}
