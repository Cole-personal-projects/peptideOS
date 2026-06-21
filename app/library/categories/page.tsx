"use client";

import Link from 'next/link';
import { Boxes, ChevronRight, Flame, Syringe } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { getVisibleLibraryCollectionSummaries } from '@/lib/library-collections';

export default function LibraryCategoriesPage() {
  const { data } = useApp();
  const collections = getVisibleLibraryCollectionSummaries(data.compounds);

  return (
    <AppShell>
      <PageHeader title="Select Collection" backHref="/library" />
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          {collections.map((collection) => {
            const Icon = collection.kind === 'compound-type' ? Syringe : Boxes;

            return (
              <Link
                key={collection.slug}
                href={`/library/categories/${collection.slug}`}
                className="block"
                aria-label={`${collection.label} ${collection.description}`}
              >
                <Card className="border-primary/20 bg-secondary/40 transition-colors hover:bg-secondary/60">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-primary">{collection.label}</h2>
                        <p className="text-sm text-muted-foreground">{collection.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {collection.count} {collection.count === 1 ? 'compound' : 'compounds'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="bg-secondary/25">
          <CardContent className="flex items-start gap-3 p-4">
            <Flame className="mt-0.5 h-5 w-5 text-chart-4" />
            <div>
              <h2 className="text-sm font-semibold">Collection-backed library</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Collections group compounds by canonical app fields so setup previews, inventory intake, calculators, and Peppi approvals stay predictable.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
