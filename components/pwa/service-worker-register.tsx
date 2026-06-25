"use client";

import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ServiceWorkerRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return;
    }

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const watchInstallingWorker = (worker: ServiceWorker | null) => {
      if (!worker) return;

      const handleStateChange = () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setIsDismissed(false);
        }
      };

      worker.addEventListener('statechange', handleStateChange);
    };

    const handleRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting);
        setIsDismissed(false);
      }

      registration.addEventListener('updatefound', () => {
        watchInstallingWorker(registration.installing);
      });

      void registration.update();
    };

    const register = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(handleRegistration)
        .catch((error) => {
          console.error('Failed to register PeptideOS service worker', error);
        });
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    if (document.readyState === 'complete') {
      register();
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    window.addEventListener('load', register, { once: true });

    return () => {
      window.removeEventListener('load', register);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const activateUpdate = () => {
    if (!waitingWorker) return;
    setIsActivating(true);
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waitingWorker || isDismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-lg rounded-[14px] border border-primary/30 bg-background/95 p-3 shadow-lg backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/15 text-primary">
          <RefreshCw className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Update available</p>
          <p className="text-xs text-muted-foreground">Reload to use the newest PeptideOS build.</p>
        </div>
        <Button size="sm" onClick={activateUpdate} disabled={isActivating}>
          {isActivating ? 'Reloading...' : 'Reload'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Dismiss update notice"
          onClick={() => setIsDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
