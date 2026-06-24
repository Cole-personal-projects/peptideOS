"use client";

import Link from 'next/link';
import { 
  FlaskConical, 
  Calculator, 
  TestTube, 
  Activity,
  BookOpen,
  Heart, 
  Users, 
  Bot, 
  Settings, 
  Info,
  ChevronRight
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const primaryItems: MenuItem[] = [
  { href: '/more/inventory', label: 'Stock Room', icon: FlaskConical, description: 'Vials' },
  { href: '/more/reconstitution', label: 'Mix', icon: Calculator, description: 'Draw volume' },
  { href: '/labs', label: 'Labs', icon: TestTube, description: 'Markers' },
  { href: '/more/ai-assistant', label: 'Peppi', icon: Bot, description: 'Actions' },
];

const menuSections: MenuSection[] = [
  {
    title: 'Build',
    items: [
      { href: '/library', label: 'Library', icon: BookOpen, description: 'Compounds' },
      { href: '/more/compound-guide', label: 'Guide', icon: BookOpen, description: 'Workflows' },
    ]
  },
  {
    title: 'Track',
    items: [
      { href: '/more/signals', label: 'Signals', icon: Activity, description: 'Check-ins' },
      { href: '/more/integrations', label: 'Integrations', icon: Heart, description: 'Devices', badge: 'Soon' },
    ]
  },
  {
    title: 'Community',
    items: [
      { href: '/more/community', label: 'Community', icon: Users, description: 'People', badge: 'Soon' },
    ]
  },
  {
    title: 'App',
    items: [
      { href: '/more/settings', label: 'Settings', icon: Settings, description: 'Sync' },
      { href: '/more/about', label: 'About', icon: Info, description: 'Info' },
    ]
  }
];

export default function MorePage() {
  return (
    <AppShell>
      <PageHeader title="More" />

      <div className="space-y-5 p-4 pb-32">
        <div className="grid grid-cols-2 gap-3">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.href === '/more/inventory' ? 'Stock Room Inventory' : undefined}
                className="group min-h-[112px] rounded-[14px] border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-[12px] border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-4 text-base font-bold leading-tight">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </Link>
            );
          })}
        </div>

        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {section.title}
            </h2>
            <Card className="overflow-hidden">
              <CardContent className="grid grid-cols-2 gap-px bg-border p-0">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className="flex min-h-[76px] items-center gap-3 bg-card px-3.5 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-secondary">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{item.label}</p>
                          {item.badge && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
