"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FlaskConical, Plus, Search, User } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { getEmptyStateContent } from '@/lib/empty-states';
import { filterCompounds } from '@/lib/library-filters';
import { cn } from '@/lib/utils';
import type { CompoundCategory, CompoundType, DoseUnit, Route } from '@/lib/types';

const categoryColors: Partial<Record<CompoundCategory, string>> = {
  healing: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  'growth-hormone': 'bg-primary/20 text-primary border-primary/30',
  cognitive: 'bg-accent/20 text-accent border-accent/30',
  metabolic: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  longevity: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  'skin-hair': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'hormone-endocrine': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  custom: 'bg-secondary text-secondary-foreground border-border',
};

const categories: Array<CompoundCategory | 'all'> = ['all', 'healing', 'growth-hormone', 'metabolic', 'longevity', 'cognitive', 'skin-hair', 'hormone-endocrine', 'custom'];
const compoundTypes: Array<CompoundType | 'all'> = ['all', 'peptide', 'hormone', 'glp-1', 'small-molecule', 'biologic', 'supplement', 'other'];
const routes: Route[] = ['subq', 'im', 'intranasal', 'oral', 'topical'];
const doseUnits: DoseUnit[] = ['mcg', 'mg', 'iu'];

function formatLabel(value: string): string {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-compound';
}

export default function LibraryPage() {
  const { data, addUserCompound } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CompoundCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<CompoundType | 'all'>('all');
  const [researcherMode, setResearcherMode] = useState(data.userMode === 'researcher');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [compoundType, setCompoundType] = useState<CompoundType>('peptide');
  const [category, setCategory] = useState<CompoundCategory>('custom');
  const [defaultRoute, setDefaultRoute] = useState<Route>('subq');
  const [defaultDoseUnit, setDefaultDoseUnit] = useState<DoseUnit>('mg');
  const [summary, setSummary] = useState('');
  const emptyState = getEmptyStateContent('library-no-results');

  const filteredCompounds = useMemo(
    () => filterCompounds(data.compounds, { search, category: selectedCategory, compoundType: selectedType }),
    [data.compounds, search, selectedCategory, selectedType],
  );

  const resetForm = () => {
    setName('');
    setCompoundType('peptide');
    setCategory('custom');
    setDefaultRoute('subq');
    setDefaultDoseUnit('mg');
    setSummary('');
  };

  const handleAddCompound = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    addUserCompound({
      id: `custom-${slugify(trimmedName)}-${Date.now()}`,
      name: trimmedName,
      aliases: [],
      compoundType,
      category,
      defaultRoute,
      supportedRoutes: [defaultRoute],
      defaultDoseUnit,
      concentrationMode: defaultRoute === 'oral' ? 'none' : 'reconstituted',
      dosePresets: [],
      vialPresets: [],
      reconstitutionDefaults: defaultRoute === 'oral' ? undefined : {
        typicalVialAmounts: [{ value: 5, unit: 'mg' }],
        typicalBacWaterMl: [2],
      },
      beginnerSummary: summary.trim() || 'User-created compound.',
      researcherDetails: summary.trim() || 'User-created compound.',
      safety: 'User-entered safety notes.',
      storage: 'User-entered storage notes.',
      citations: [],
    });
    resetForm();
    setAddOpen(false);
  };

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
        <div className="flex items-center gap-2">
          <div role="search" className="relative min-w-0 flex-1">
            <Label htmlFor="library-search" className="sr-only">
              Search compounds
            </Label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="library-search"
              type="search"
              aria-label="Search compounds"
              placeholder="Search compounds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="icon" aria-label="Add compound">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add compound</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-compound-name">Name</Label>
                  <Input id="custom-compound-name" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="custom-compound-type">Type</Label>
                    <select id="custom-compound-type" className="h-9 rounded-md border bg-background px-3 text-sm" value={compoundType} onChange={(event) => setCompoundType(event.target.value as CompoundType)}>
                      {compoundTypes.filter((type) => type !== 'all').map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="custom-compound-category">Category</Label>
                    <select id="custom-compound-category" className="h-9 rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value as CompoundCategory)}>
                      {categories.filter((cat) => cat !== 'all').map((cat) => <option key={cat} value={cat}>{formatLabel(cat)}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="custom-compound-route">Route</Label>
                    <select id="custom-compound-route" className="h-9 rounded-md border bg-background px-3 text-sm" value={defaultRoute} onChange={(event) => setDefaultRoute(event.target.value as Route)}>
                      {routes.map((route) => <option key={route} value={route}>{route.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="custom-compound-unit">Unit</Label>
                    <select id="custom-compound-unit" className="h-9 rounded-md border bg-background px-3 text-sm" value={defaultDoseUnit} onChange={(event) => setDefaultDoseUnit(event.target.value as DoseUnit)}>
                      {doseUnits.map((unit) => <option key={unit} value={unit}>{unit.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="custom-compound-summary">Summary</Label>
                  <Textarea id="custom-compound-summary" value={summary} onChange={(event) => setSummary(event.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddCompound}>Save compound</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Filter by compound type">
          {compoundTypes.map((type) => (
            <Button
              key={type}
              type="button"
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              className="h-6 whitespace-nowrap rounded-full px-2.5 text-xs"
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
            >
              {type === 'all' ? 'All types' : formatLabel(type)}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Filter by category">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              type="button"
              aria-pressed={selectedCategory === cat}
              className={cn(
                "h-6 whitespace-nowrap rounded-full px-2.5 text-xs",
                cat !== 'all' && selectedCategory === cat && categoryColors[cat],
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'All categories' : formatLabel(cat)}
            </Button>
          ))}
        </div>

        <Label className="text-xs text-muted-foreground">
          {researcherMode ? 'Researcher Mode: Showing detailed information' : 'Beginner Mode: Showing simplified summaries'}
        </Label>

        <div className="space-y-2">
          {filteredCompounds.length === 0 ? (
            <Empty className="bg-secondary/40">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search className="w-5 h-5" />
                </EmptyMedia>
                <EmptyTitle>{emptyState.title}</EmptyTitle>
                <EmptyDescription>{emptyState.description}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('all');
                    setSelectedType('all');
                  }}
                >
                  {emptyState.actionLabel}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            filteredCompounds.map((compound) => (
              <Link key={compound.id} href={`/library/${compound.id}`} className="block">
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">{compound.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] capitalize", categoryColors[compound.category])}>
                            {formatLabel(compound.category)}
                          </Badge>
                          <Badge variant={compound.source === 'user' ? 'default' : 'secondary'} className="text-[10px]">
                            {compound.source === 'user' ? 'Custom' : 'Reference'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {researcherMode ? compound.researcherDetails : compound.beginnerSummary}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{formatLabel(compound.compoundType)}</span>
                          <span>Route: {compound.defaultRoute.toUpperCase()}</span>
                          <span>Unit: {compound.defaultDoseUnit.toUpperCase()}</span>
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
