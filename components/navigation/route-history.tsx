'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const ROUTE_HISTORY_CURRENT_KEY = 'peptideos.routeHistory.currentPath';
export const ROUTE_HISTORY_PREVIOUS_KEY = 'peptideos.routeHistory.previousPath';
export const ROUTE_HISTORY_STACK_KEY = 'peptideos.routeHistory.stack';
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

      pushRouteHistory(targetUrl.pathname);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    pushRouteHistory(pathname);
  }, [pathname]);

  return null;
}

export function pushRouteHistory(nextPath: string) {
  if (typeof window === 'undefined') return;

  const currentPath = window.sessionStorage.getItem(ROUTE_HISTORY_CURRENT_KEY) ?? window.location.pathname;
  if (currentPath === nextPath) return;

  const stack = readRouteHistoryStack();
  const lastPath = stack.at(-1);
  const nextStack = lastPath === currentPath || !currentPath ? [...stack, nextPath] : [...stack, currentPath, nextPath];
  const compactStack = compactRouteStack(nextStack);

  if (currentPath) {
    window.sessionStorage.setItem(ROUTE_HISTORY_PREVIOUS_KEY, currentPath);
  }
  window.sessionStorage.setItem(ROUTE_HISTORY_STACK_KEY, JSON.stringify(compactStack));
  window.sessionStorage.setItem(ROUTE_HISTORY_CURRENT_KEY, nextPath);
  window.dispatchEvent(new Event(ROUTE_HISTORY_CHANGED_EVENT));
}

export function popRouteHistory(fallbackPath: string) {
  if (typeof window === 'undefined') return fallbackPath;

  const stack = readRouteHistoryStack();
  const currentPath = window.sessionStorage.getItem(ROUTE_HISTORY_CURRENT_KEY) ?? window.location.pathname;
  const normalizedStack = compactRouteStack(stack.length > 0 ? stack : [currentPath]);
  const lastPath = normalizedStack.at(-1);
  const stackWithoutCurrent = lastPath === currentPath ? normalizedStack.slice(0, -1) : normalizedStack;
  const targetPath = stackWithoutCurrent.at(-1) ?? fallbackPath;
  const nextStack = compactRouteStack(targetPath === fallbackPath && stackWithoutCurrent.length === 0 ? [fallbackPath] : stackWithoutCurrent);

  window.sessionStorage.setItem(ROUTE_HISTORY_STACK_KEY, JSON.stringify(nextStack));
  window.sessionStorage.setItem(ROUTE_HISTORY_PREVIOUS_KEY, nextStack.at(-2) ?? fallbackPath);
  window.sessionStorage.setItem(ROUTE_HISTORY_CURRENT_KEY, targetPath);
  window.dispatchEvent(new Event(ROUTE_HISTORY_CHANGED_EVENT));
  return targetPath;
}

export function getRouteHistoryPreviousPath() {
  if (typeof window === 'undefined') return null;

  const stack = readRouteHistoryStack();
  const currentPath = window.sessionStorage.getItem(ROUTE_HISTORY_CURRENT_KEY) ?? window.location.pathname;
  const stackWithoutCurrent = stack.at(-1) === currentPath ? stack.slice(0, -1) : stack;
  return stackWithoutCurrent.at(-1) ?? window.sessionStorage.getItem(ROUTE_HISTORY_PREVIOUS_KEY);
}

function readRouteHistoryStack() {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ROUTE_HISTORY_STACK_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string' && entry.startsWith('/')) : [];
  } catch {
    return [];
  }
}

function compactRouteStack(stack: string[]) {
  return stack.reduce<string[]>((nextStack, path) => {
    if (nextStack.at(-1) !== path) nextStack.push(path);
    return nextStack;
  }, []).slice(-20);
}
