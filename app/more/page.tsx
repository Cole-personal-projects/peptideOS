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

const menuSections: MenuSection[] = [
  {
    title: 'Management',
    items: [
      { href: '/more/inventory', label: 'Inventory', icon: FlaskConical, description: 'Manage your vials' },
      { href: '/more/reconstitution', label: 'Reconstitution Calculator', icon: Calculator, description: 'Calculate dosing' },
      { href: '/more/compound-guide', label: 'Compound Guide', icon: BookOpen, description: 'Shared compound workflows' },
    ]
  },
  {
    title: 'Health Data',
    items: [
      { href: '/more/signals', label: 'Signals', icon: Activity, description: 'Capture check-ins' },
      { href: '/more/lab-results', label: 'Lab Results', icon: TestTube, description: 'Track bloodwork' },
      { href: '/more/integrations', label: 'Health Integrations', icon: Heart, description: 'Connect devices', badge: 'Soon' },
    ]
  },
  {
    title: 'Community',
    items: [
      { href: '/more/community', label: 'Community', icon: Users, description: 'Connect with researchers', badge: 'Soon' },
      { href: '/more/ai-assistant', label: 'Peppi', icon: Bot, description: 'AI helper' },
    ]
  },
  {
    title: 'App',
    items: [
      { href: '/more/settings', label: 'Settings', icon: Settings, description: 'Preferences & privacy' },
      { href: '/more/about', label: 'About', icon: Info, description: 'Disclaimers & info' },
    ]
  }
];

export default function MorePage() {
  return (
    <AppShell>
      <PageHeader title="More" />

      <div className="p-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
              {section.title}
            </h2>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{item.label}</p>
                            {item.badge && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
