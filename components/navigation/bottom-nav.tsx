"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutDashboard, Layers, MoreHorizontal, TestTube } from 'lucide-react';
import { NAV_INTENT_EVENT, writePendingBottomNav } from '@/components/client-diagnostics';
import { emitClientDiagnostic, sanitizePath } from '@/lib/client-diagnostics';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stacks', label: 'Protocols', icon: Layers },
  { href: '/labs', label: 'Labs', icon: TestTube },
  { href: '/log', label: 'Log', icon: CalendarDays },
  { href: '/more', label: 'More', icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[var(--bg-deep)]/90 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onPointerDown={() => recordBottomNavIntent(tab, pathname, 'pointer_down')}
              onClick={() => recordBottomNavIntent(tab, pathname, 'click')}
              className={cn(
                'flex h-14 w-16 flex-col items-center justify-center rounded-[10px] transition-colors',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )}
            >
              <Icon className={cn('mb-1 h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[11px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function recordBottomNavIntent(tab: (typeof tabs)[number], pathname: string, phase: 'pointer_down' | 'click') {
  const id = crypto.randomUUID();
  const startedAt = performance.now();
  const from = window.location.pathname;
  const active = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href));

  writePendingBottomNav({
    id,
    href: tab.href,
    label: tab.label,
    from,
    startedAt,
  });

  emitClientDiagnostic(`bottom_nav_${phase}`, {
    id,
    label: tab.label,
    href: sanitizePath(tab.href),
    from: sanitizePath(from),
    active,
  });
  window.dispatchEvent(new Event(NAV_INTENT_EVENT));
}
