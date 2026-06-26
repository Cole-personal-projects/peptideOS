"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { emitClientDiagnostic, sanitizePath } from '@/lib/client-diagnostics';

export const NAV_PENDING_KEY = 'peptideos.diagnostics.pendingBottomNav';
export const NAV_INTENT_EVENT = 'peptideos:bottom-nav-intent';

interface PendingBottomNav {
  id: string;
  href: string;
  label: string;
  from: string;
  startedAt: number;
}

export function ClientDiagnostics() {
  const pathname = usePathname();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      emitClientDiagnostic(
        'client_error',
        {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'error',
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      emitClientDiagnostic('client_unhandled_rejection', { reason: stringifyReason(event.reason) }, 'error');
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const startedAt = performance.now();
      const url = getFetchUrl(input);
      try {
        const response = await originalFetch(input, init);
        if (url && isSameOriginApi(url) && !response.ok) {
          emitClientDiagnostic(
            'client_fetch_http_error',
            {
              path: sanitizePath(new URL(url, window.location.href).pathname),
              status: response.status,
              elapsedMs: performance.now() - startedAt,
            },
            response.status >= 500 ? 'error' : 'warn',
          );
        }
        return response;
      } catch (error) {
        if (url && isSameOriginApi(url)) {
          emitClientDiagnostic(
            'client_fetch_network_error',
            {
              path: sanitizePath(new URL(url, window.location.href).pathname),
              elapsedMs: performance.now() - startedAt,
              message: stringifyReason(error),
            },
            'error',
          );
        }
        throw error;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    let longTaskCount = 0;
    let observer: PerformanceObserver | null = null;
    if ('PerformanceObserver' in window) {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration < 500 || longTaskCount >= 6) continue;
            longTaskCount += 1;
            emitClientDiagnostic(
              'client_long_task',
              { durationMs: entry.duration, startTimeMs: entry.startTime },
              entry.duration >= 1500 ? 'error' : 'warn',
            );
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        observer = null;
      }
    }

    emitClientDiagnostic('client_diagnostics_ready', { build: 'runtime' });

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    const pending = readPendingBottomNav();
    if (!pending) return;
    if (sanitizePath(pathname) === sanitizePath(pending.from)) return;

    emitClientDiagnostic('bottom_nav_route_complete', {
      id: pending.id,
      label: pending.label,
      href: sanitizePath(pending.href),
      from: sanitizePath(pending.from),
      to: sanitizePath(pathname),
      elapsedMs: performance.now() - pending.startedAt,
    });
    clearPendingBottomNav(pending.id);
  }, [pathname]);

  useEffect(() => {
    const handleIntent = () => {
      window.setTimeout(() => {
        const pending = readPendingBottomNav();
        if (!pending) return;
        const elapsedMs = performance.now() - pending.startedAt;
        if (elapsedMs < 2500) return;
        if (sanitizePath(window.location.pathname) !== sanitizePath(pending.from)) return;
        emitClientDiagnostic(
          'bottom_nav_route_stalled',
          {
            id: pending.id,
            label: pending.label,
            href: sanitizePath(pending.href),
            from: sanitizePath(pending.from),
            elapsedMs,
            activeElement: document.activeElement?.tagName ?? null,
          },
          'error',
        );
      }, 2600);
    };

    window.addEventListener(NAV_INTENT_EVENT, handleIntent);
    return () => window.removeEventListener(NAV_INTENT_EVENT, handleIntent);
  }, []);

  return null;
}

export function writePendingBottomNav(pending: PendingBottomNav) {
  try {
    window.sessionStorage.setItem(NAV_PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Diagnostics should never block navigation.
  }
}

function readPendingBottomNav(): PendingBottomNav | null {
  try {
    const raw = window.sessionStorage.getItem(NAV_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingBottomNav>;
    if (!parsed.id || !parsed.href || !parsed.label || !parsed.from || typeof parsed.startedAt !== 'number') {
      return null;
    }
    return parsed as PendingBottomNav;
  } catch {
    return null;
  }
}

function clearPendingBottomNav(id: string) {
  try {
    const pending = readPendingBottomNav();
    if (pending?.id === id) window.sessionStorage.removeItem(NAV_PENDING_KEY);
  } catch {
    // Diagnostics should never block navigation.
  }
}

function stringifyReason(reason: unknown) {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

function getFetchUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isSameOriginApi(url: string) {
  const parsed = new URL(url, window.location.href);
  return parsed.origin === window.location.origin && parsed.pathname.startsWith('/api/');
}
