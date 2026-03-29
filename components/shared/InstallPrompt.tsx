'use client';

import { Download, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISSAL_KEY = 'pahad-install-dismissed';
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  const standard = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return standard || iosStandalone;
}

function isIOSDevice() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

function isDismissedRecently() {
  if (typeof window === 'undefined') return false;
  const dismissed = localStorage.getItem(DISMISSAL_KEY);
  return dismissed ? Date.now() - Number(dismissed) < DISMISSAL_DURATION : false;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const standalone = useMemo(isStandaloneMode, []);
  const isIOS = useMemo(isIOSDevice, []);

  useEffect(() => {
    if (standalone) return;
    const dismissed = isDismissedRecently();

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!dismissed) {
        timeoutRef.current = window.setTimeout(() => setShowPrompt(true), 3500);
      }
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    if (isIOS && !dismissed) {
      timeoutRef.current = window.setTimeout(() => setShowPrompt(true), 3500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isIOS, standalone]);

  const dismiss = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  if (standalone || !showPrompt) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
      <Card className="border border-brand/20 bg-white/95 p-5 shadow-2xl backdrop-blur dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink dark:text-white">Install Pahad</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {isIOS ? 'Add Pahad to the home screen for faster access during field visits.' : 'Install the app for quicker launch and better offline field use.'}
            </p>
          </div>
          <button type="button" onClick={dismiss} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
        {isIOS ? (
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2"><span>1.</span><span>Tap the share button</span><Share2 className="h-4 w-4" /></div>
            <div className="flex items-center gap-2"><span>2.</span><span>Choose <span className="font-semibold">Add to Home Screen</span></span></div>
          </div>
        ) : (
          <div className="mt-4">
            <Button onClick={install} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
