'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ROUTE_HISTORY_CURRENT_KEY = 'peptideos.routeHistory.currentPath';
export const ROUTE_HISTORY_PREVIOUS_KEY = 'peptideos.routeHistory.previousPath';
export const ROUTE_HISTORY_CHANGED_EVENT = 'peptideos:route-history-changed';

export function RouteHistory() {
  const pathname = usePathname();

  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest('a[href]');
      if (!anchor) return;
      if (anchor.hasAttribute('data-route-history-ignore')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      const targetUrl = new URL(href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;

      updateRouteHistory(targetUrl.pathname);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;

    updateRouteHistory(pathname);
  }, [pathname]);

  return null;
}

function updateRouteHistory(nextPath: string) {
  const currentPath = window.sessionStorage.getItem(ROUTE_HISTORY_CURRENT_KEY) ?? window.location.pathname;
  if (currentPath === nextPath) return;

  if (currentPath) {
    window.sessionStorage.setItem(ROUTE_HISTORY_PREVIOUS_KEY, currentPath);
  }

  window.sessionStorage.setItem(ROUTE_HISTORY_CURRENT_KEY, nextPath);
  window.dispatchEvent(new Event(ROUTE_HISTORY_CHANGED_EVENT));
}
