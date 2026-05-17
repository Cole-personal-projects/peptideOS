"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, User, FlaskConical } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/context';
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

export default function LibraryPage() {
  const { data } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PeptideCategory | 'all'>('all');
  const [researcherMode, setResearcherMode] = useState(false);

  const filteredPeptides = useMemo(() => {
    return data.peptides.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.beginnerSummary.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data.peptides, search, selectedCategory]);

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search peptides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant="outline"
              className={cn(
                "cursor-pointer whitespace-nowrap capitalize",
                selectedCategory === cat && categoryColors[cat]
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Badge>
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
