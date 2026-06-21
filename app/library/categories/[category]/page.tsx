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
import { formatCompoundDisplayLabel } from '@/lib/compound-display';
import { getLibraryCollection, getLibraryCollectionCompounds } from '@/lib/library-collections';

export default function LibraryCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const { data } = useApp();
  const collection = getLibraryCollection(category);
  const compounds = collection ? getLibraryCollectionCompounds(data.compounds, collection) : [];
  const title = collection?.label ?? 'Collection not found';

  return (
    <AppShell>
      <PageHeader title={title} backHref="/library/categories" />
      <div className="p-4">
        <Card className="bg-secondary/30">
          <CardContent className="divide-y divide-border p-0">
            {compounds.length > 0 ? compounds.map((compound) => (
              <div key={compound.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold">{compound.name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">{compound.defaultRoute.toUpperCase()}</span>
                    <Badge variant="outline" className="text-[11px]">
                      {formatCompoundDisplayLabel(compound.compoundType)}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {formatCompoundDisplayLabel(compound.category)}
                    </Badge>
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
            )) : (
              <div className="p-4">
                <h2 className="text-base font-semibold">No compounds found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This collection is not available in the current library.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
