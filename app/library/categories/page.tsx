"use client";

import Link from 'next/link';
import { ChevronRight, Flame, Syringe } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/lib/context';

export default function LibraryCategoriesPage() {
  const { data } = useApp();
  const glp1Count = data.compounds.filter((compound) => compound.libraryClassification?.categoryGroup === 'GLP-1').length;

  return (
    <AppShell>
      <PageHeader title="Select Category" backHref="/library" />
      <div className="space-y-4 p-4">
        <Link href="/library/categories/glp-1" className="block" aria-label="GLP-1 GLP-1 Receptor Agonists">
          <Card className="border-primary/20 bg-secondary/40 transition-colors hover:bg-secondary/60">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Syringe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-primary">GLP-1</h2>
                  <p className="text-sm text-muted-foreground">GLP-1 receptor agonists</p>
                  <p className="mt-1 text-xs text-muted-foreground">{glp1Count} protocol-ready compounds</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-secondary/25">
          <CardContent className="flex items-start gap-3 p-4">
            <Flame className="mt-0.5 h-5 w-5 text-chart-4" />
            <div>
              <h2 className="text-sm font-semibold">Protocol-ready library</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compounds here can feed setup previews, inventory intake, calculators, and Peppi approvals.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
