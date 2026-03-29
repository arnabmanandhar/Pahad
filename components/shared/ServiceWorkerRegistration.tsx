'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldRegister =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_SW_ENABLED === 'true';

    if (!shouldRegister) return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[PWA] New content is available.');
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Service worker registration failed:', error);
      });

    navigator.serviceWorker.ready.then((registration) => {
      const interval = window.setInterval(() => {
        registration.update().catch(console.error);
      }, 60 * 60 * 1000);

      return () => window.clearInterval(interval);
    });
  }, []);

  return null;
}
