"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, User, FlaskConical } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/context';
import { filterPeptides } from '@/lib/library-filters';
import { cn } from '@/lib/utils';
import type { PeptideCategory } from '@/lib/types';

const categoryColors: Record<PeptideCategory, string> = {
  healing: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  growth: 'bg-primary/20 text-primary border-primary/30',
  cognitive: 'bg-accent/20 text-accent border-accent/30',
  metabolic: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  longevity: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  aesthetic: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
};

const categories: PeptideCategory[] = ['healing', 'growth', 'cognitive', 'metabolic', 'longevity', 'aesthetic'];

function formatCategory(category: PeptideCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function LibraryPage() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PeptideCategory | 'all'>('all');
  const [researcherMode, setResearcherMode] = useState(false);

  const filteredPeptides = useMemo(
    () => filterPeptides(data.peptides, { search, category: selectedCategory }),
    [data.peptides, search, selectedCategory]
  );

  return (
    <AppShell>
      <PageHeader 
        title="Library" 
        rightElement={
          <div className="flex items-center gap-2">
            <User className={cn("w-4 h-4", !researcherMode && "text-primary")} />
            <Switch 
              checked={researcherMode} 
              onCheckedChange={setResearcherMode}
              className="scale-75"
            />
            <FlaskConical className={cn("w-4 h-4", researcherMode && "text-primary")} />
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div role="search" className="relative">
          <Label htmlFor="library-search" className="sr-only">
            Search peptides
          </Label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="library-search"
            type="search"
            aria-label="Search peptides"
            placeholder="Search peptides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Filter by category">
          <Button
            type="button"
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-6 whitespace-nowrap rounded-full px-2.5 text-xs"
            aria-pressed={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant="outline"
              size="sm"
              type="button"
              aria-pressed={selectedCategory === cat}
              className={cn(
                "h-6 whitespace-nowrap rounded-full px-2.5 text-xs",
                selectedCategory === cat && categoryColors[cat]
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {formatCategory(cat)}
            </Button>
          ))}
        </div>

        <Label className="text-xs text-muted-foreground">
          {researcherMode ? 'Researcher Mode: Showing detailed information' : 'Beginner Mode: Showing simplified summaries'}
        </Label>

        {/* Peptide list */}
        <div className="space-y-2">
          {filteredPeptides.length === 0 ? (
            <Card className="bg-secondary/50">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">No peptides found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPeptides.map((peptide) => (
              <Link key={peptide.id} href={`/library/${peptide.id}`}>
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{peptide.name}</h3>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] capitalize", categoryColors[peptide.category])}
                          >
                            {peptide.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {researcherMode ? peptide.researcherDetails : peptide.beginnerSummary}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Route: {peptide.defaultRoute.toUpperCase()}</span>
                          <span>Half-life: {peptide.halfLifeHours}h</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
