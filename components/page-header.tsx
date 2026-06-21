'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { ROUTE_HISTORY_CHANGED_EVENT, ROUTE_HISTORY_PREVIOUS_KEY } from '@/components/navigation/route-history';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, backHref, rightElement, className }: PageHeaderProps) {
  const router = useRouter();
  const previousPath = useRouteHistoryPreviousPath();

  const targetPath = previousPath ?? backHref;
  const targetLabel = formatRouteLabel(targetPath);
  const backLabel = targetLabel ? `Back to ${targetLabel}` : 'Back';

  const handleBack = () => {
    if (!backHref) return;

    router.push(window.sessionStorage.getItem(ROUTE_HISTORY_PREVIOUS_KEY) ?? previousPath ?? backHref);
  };

  return (
    <header className={cn('sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border', className)}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {backHref && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="-ml-2"
              title={backLabel}
            >
              <Link
                href={targetPath ?? backHref}
                aria-label="Back"
                data-route-history-ignore
                onClick={(event) => {
                  event.preventDefault();
                  handleBack();
                }}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {rightElement && <div>{rightElement}</div>}
      </div>
    </header>
  );
}

function formatRouteLabel(path?: string | null) {
  if (!path) return null;
  if (path === '/') return 'Dashboard';

  const label = path.split('/').filter(Boolean).at(-1);
  if (!label) return null;

  return label.replace(/-/g, ' ');
}

function useRouteHistoryPreviousPath() {
  return useSyncExternalStore(subscribeToRouteHistory, getRouteHistoryPreviousPath, () => null);
}

function subscribeToRouteHistory(callback: () => void) {
  window.addEventListener(ROUTE_HISTORY_CHANGED_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(ROUTE_HISTORY_CHANGED_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getRouteHistoryPreviousPath() {
  return window.sessionStorage.getItem(ROUTE_HISTORY_PREVIOUS_KEY);
}
