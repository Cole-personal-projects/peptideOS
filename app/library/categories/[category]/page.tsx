"use client";

import { use } from 'react';
import Link from 'next/link';
import { ChevronRight, Info, Syringe } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';

const categoryLabels: Record<string, string> = {
  'glp-1': 'GLP-1',
};

export default function LibraryCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { data } = useApp();
  const label = categoryLabels[category] ?? category;
  const compounds = data.compounds.filter((compound) => compound.libraryClassification?.categoryGroup === label);

  return (
    <AppShell>
      <PageHeader title={label} backHref="/library/categories" />
      <div className="p-4">
        <Card className="bg-secondary/30">
          <CardContent className="divide-y divide-border p-0">
            {compounds.map((compound) => (
              <div key={compound.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{compound.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground capitalize">{compound.defaultRoute}</span>
                    {compound.protocolTemplates?.length ? (
                      <Badge variant="secondary" className="gap-1 text-[11px]">
                        Protocol
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Button asChild size="icon" variant="ghost" aria-label={`Open ${compound.name} info`}>
                  <Link href={`/library/${compound.id}`}>
                    <Info className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="ghost" aria-label={`Setup ${compound.name} protocol`}>
                  <Link href={`/library/setup/${compound.id}`}>
                    <Syringe className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="ghost" aria-label={`Open ${compound.name}`}>
                  <Link href={`/library/${compound.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
