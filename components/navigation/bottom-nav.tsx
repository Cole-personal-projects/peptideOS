"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutDashboard, Layers, Library, MoreHorizontal, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stacks', label: 'Stacks', icon: Layers },
  { href: '/labs', label: 'Labs', icon: TestTube },
  { href: '/log', label: 'Log', icon: CalendarDays },
  { href: '/library', label: 'Library', icon: Library },
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
              className={cn(
                'flex h-14 w-16 flex-col items-center justify-center rounded-[10px] transition-colors',
                isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
              )}
            >
              <Icon className={cn('mb-1 h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
