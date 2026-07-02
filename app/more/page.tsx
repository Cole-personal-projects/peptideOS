"use client";

import Link from 'next/link';
import {
  Activity,
  BookOpen,
  Bot,
  Calculator,
  ChevronRight,
  FlaskConical,
  Heart,
  Info,
  MonitorPlay,
  MessageSquarePlus,
  Settings,
  TestTube,
  Users,
  Waves,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';

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
  { href: '/more/inventory', label: 'Stock Room', icon: FlaskConical, description: 'Vials, containers, coverage' },
  { href: '/more/reconstitution', label: 'Mix', icon: Calculator, description: 'Reconstitution and syringe units' },
  { href: '/labs', label: 'Labs', icon: TestTube, description: 'Markers, trends, comparisons' },
  { href: '/more/ai-assistant', label: 'Peppi', icon: Bot, description: 'Drafts, summaries, actions' },
];

const menuSections: MenuSection[] = [
  {
    title: 'Build',
    items: [
      { href: '/library', label: 'Library', icon: BookOpen, description: 'Compound reference' },
      { href: '/more/compound-guide', label: 'Guide', icon: BookOpen, description: 'Protocol workflows' },
    ],
  },
  {
    title: 'Track',
    items: [
      { href: '/more/half-life', label: 'Half-Life', icon: Waves, description: 'PK curve modeler' },
      { href: '/more/signals', label: 'Signals', icon: Activity, description: 'Check-ins and notes' },
      { href: '/more/integrations', label: 'Integrations', icon: Heart, description: 'Devices', badge: 'Soon' },
    ],
  },
  {
    title: 'Community',
    items: [{ href: '/more/community', label: 'Community', icon: Users, description: 'People', badge: 'Soon' }],
  },
  {
    title: 'App',
    items: [
      { href: '/welcome', label: 'Welcome', icon: MonitorPlay, description: 'Preview banner and install guide' },
      { href: '/more/feedback', label: 'Send Feedback', icon: MessageSquarePlus, description: 'Bug, request, or comment' },
      { href: '/more/settings', label: 'Settings', icon: Settings, description: 'Sync, theme, data' },
      { href: '/more/about', label: 'About', icon: Info, description: 'Version and project info' },
    ],
  },
];

function MoreMenuRow({ item, featured = false }: { item: MenuItem; featured?: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={item.href === '/more/inventory' ? 'Stock Room Inventory' : undefined}
      className={`group flex items-center gap-3 border-border bg-card transition-colors hover:bg-secondary/50 ${
        featured ? 'rounded-[14px] border p-4' : 'border-b px-4 py-3.5 last:border-b-0'
      }`}
    >
      <div
        className={`grid shrink-0 place-items-center rounded-[12px] border border-primary/20 bg-primary/10 text-primary ${
          featured ? 'size-11' : 'size-10'
        }`}
      >
        <Icon className={featured ? 'size-5' : 'size-4'} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className={`truncate font-semibold leading-tight ${featured ? 'text-base' : 'text-sm'}`}>{item.label}</p>
          {item.badge ? (
            <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[11px]">
              {item.badge}
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function MorePage() {
  return (
    <AppShell>
      <PageHeader title="More" />
      <div className="space-y-6 p-4 pb-32">
        <section aria-label="Quick actions" className="space-y-2.5">
          {primaryItems.map((item) => (
            <MoreMenuRow key={item.href} item={item} featured />
          ))}
        </section>

        {menuSections.map((section) => (
          <section key={section.title} aria-labelledby={`more-section-${section.title.toLowerCase()}`} className="space-y-2">
            <h2
              id={`more-section-${section.title.toLowerCase()}`}
              className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              {section.items.map((item) => (
                <MoreMenuRow key={item.href} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
