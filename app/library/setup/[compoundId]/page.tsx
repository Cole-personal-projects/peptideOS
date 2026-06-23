"use client";

import { use } from 'react';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal, ScrollText } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';

export default function CompoundProtocolSetupPage({ params }: { params: Promise<{ compoundId: string }> }) {
  const { compoundId } = use(params);
  const { getCompound } = useApp();
  const compound = getCompound(compoundId);

  if (!compound) return null;

  return (
    <AppShell>
      <PageHeader title={compound.name} backHref="/library/categories/glp-1" />
      <div className="space-y-4 p-4">
        <h1 className="text-lg font-semibold">Protocol Setup</h1>

        <Card className="bg-secondary/35">
          <CardContent className="divide-y divide-border p-0">
            {compound.protocolTemplates?.map((template) => (
              <Link
                key={template.id}
                href={`/library/protocols/${template.id}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="rounded-full bg-primary/10 p-2">
                  <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-base font-semibold">{template.name}</h2>
<Badge variant="outline" className="text-[11px] capitalize">{template.difficulty}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.summary}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold">Advanced</h2>
        <Link href={`/stacks?compound=${compound.id}&add=protocol`} className="block">
          <Card className="bg-secondary/35">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-secondary p-2">
                <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">Custom Setup</h2>
                <p className="text-sm text-muted-foreground">Use the full stack builder for custom schedules.</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </AppShell>
  );
}
