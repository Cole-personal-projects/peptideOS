"use client";

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, FlaskConical, Plus, Search, SlidersHorizontal, User, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { buildActionableLibraryProfile } from '@/lib/actionable-library-profile';
import { formatCompoundDisplayLabel, libraryCategoryOptions, libraryCompoundTypeOptions } from '@/lib/compound-display';
import { getEmptyStateContent } from '@/lib/empty-states';
import {
  formatLibraryEvidenceFilter,
  getLibraryEvidenceDisplay,
  libraryEvidenceOptions,
  type LibraryEvidenceFilter,
} from '@/lib/library-evidence';
import { filterCompounds } from '@/lib/library-filters';
import { cn } from '@/lib/utils';
import type { Compound, CompoundCategory, CompoundType, DoseUnit, Route } from '@/lib/types';

const categoryColors: Partial<Record<CompoundCategory, string>> = {
  healing: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  'growth-hormone': 'bg-primary/20 text-primary border-primary/30',
  cognitive: 'bg-accent/20 text-accent border-accent/30',
  metabolic: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  longevity: 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  'skin-hair': 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  'sexual-reproductive': 'bg-chart-5/20 text-chart-5 border-chart-5/30',
  immune: 'bg-chart-3/20 text-chart-3 border-chart-3/30',
  sleep: 'bg-accent/20 text-accent border-accent/30',
  'hormone-endocrine': 'bg-chart-1/20 text-chart-1 border-chart-1/30',
  custom: 'bg-secondary text-secondary-foreground border-border',
};

function getCompoundCardSummary(compound: Compound, researcherMode: boolean) {
  if (researcherMode) return compound.researcherDetails;
  if (compound.beginnerSummary && compound.beginnerSummary !== compound.researcherDetails) {
    return compound.beginnerSummary;
  }
  return buildActionableLibraryProfile(compound).summary;
}

const categories = libraryCategoryOptions;
const compoundTypes = libraryCompoundTypeOptions;
const evidenceFilters = libraryEvidenceOptions;
const routes: Route[] = ['subq', 'im', 'intranasal', 'oral', 'topical'];
const doseUnits: DoseUnit[] = ['mcg', 'mg', 'iu'];

function formatLabel(value: string): string {
  return formatCompoundDisplayLabel(value);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-compound';
}

interface ActiveFilter {
  key: string;
  label: string;
  clear: () => void;
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </section>
  );
}

function CompoundField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div data-field={id} className="grid min-w-0 gap-1.5">
      <Label htmlFor={`custom-compound-${id}`} className="text-sm font-semibold text-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function LibraryPage() {
  const { data, addUserCompound } = useApp();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CompoundCategory | 'all'>('all');
  const [selectedType, setSelectedType] = useState<CompoundType | 'all'>('all');
  const [selectedEvidence, setSelectedEvidence] = useState<LibraryEvidenceFilter>('all');
  const [researcherMode, setResearcherMode] = useState(data.userMode === 'researcher');
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [compoundType, setCompoundType] = useState<CompoundType>('peptide');
  const [category, setCategory] = useState<CompoundCategory>('custom');
  const [defaultRoute, setDefaultRoute] = useState<Route>('subq');
  const [defaultDoseUnit, setDefaultDoseUnit] = useState<DoseUnit>('mg');
  const [summary, setSummary] = useState('');
  const emptyState = getEmptyStateContent('library-no-results');
  const compareCompound = data.compounds.find((compound) => compound.id === searchParams.get('compare'));

  const filteredCompounds = useMemo(
    () => filterCompounds(data.compounds, {
      search,
      category: selectedCategory,
      compoundType: selectedType,
      evidence: selectedEvidence,
    }),
    [data.compounds, search, selectedCategory, selectedType, selectedEvidence],
  );
  const activeFilters: ActiveFilter[] = [
    selectedType !== 'all'
      ? { key: 'type', label: formatLabel(selectedType), clear: () => setSelectedType('all') }
      : null,
    selectedCategory !== 'all'
      ? { key: 'category', label: formatLabel(selectedCategory), clear: () => setSelectedCategory('all') }
      : null,
    selectedEvidence !== 'all'
      ? { key: 'evidence', label: formatLibraryEvidenceFilter(selectedEvidence), clear: () => setSelectedEvidence('all') }
      : null,
  ].filter((filter): filter is ActiveFilter => Boolean(filter));
  const activeFilterCount = activeFilters.length;
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedEvidence('all');
  };

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

          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="shrink-0 gap-1.5 px-3">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {activeFilterCount > 0 ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[88vh] rounded-t-2xl">
              <SheetHeader className="border-b pb-3">
                <div className="flex items-center justify-between gap-4 pr-8">
                  <SheetTitle>Filters</SheetTitle>
                  {activeFilterCount > 0 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  ) : null}
                </div>
              </SheetHeader>
              <div className="space-y-5 overflow-y-auto px-4 pb-2">
                <FilterSection title="Type">
                  {compoundTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={selectedType === type ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 whitespace-nowrap rounded-full px-3 text-xs"
                      aria-pressed={selectedType === type}
                      onClick={() => setSelectedType(type)}
                    >
                      {type === 'all' ? 'All types' : formatLabel(type)}
                    </Button>
                  ))}
                </FilterSection>

                <FilterSection title="Category">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={selectedCategory === cat}
                      className={cn(
                        "h-8 whitespace-nowrap rounded-full px-3 text-xs",
                        cat !== 'all' && selectedCategory === cat && categoryColors[cat],
                      )}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat === 'all' ? 'All categories' : formatLabel(cat)}
                    </Button>
                  ))}
                </FilterSection>

                <FilterSection title="Evidence">
                  {evidenceFilters.map((evidence) => (
                    <Button
                      key={evidence}
                      type="button"
                      variant={selectedEvidence === evidence ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 whitespace-nowrap rounded-full px-3 text-xs"
                      aria-pressed={selectedEvidence === evidence}
                      onClick={() => setSelectedEvidence(evidence)}
                    >
                      {formatLibraryEvidenceFilter(evidence)}
                    </Button>
                  ))}
                </FilterSection>
              </div>
              <SheetFooter className="border-t bg-background">
                <SheetClose asChild>
                  <Button type="button">
                    Show {filteredCompounds.length} compounds
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button" size="icon" aria-label="Add compound">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[88dvh] flex-col gap-0 overflow-hidden border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-xl">
              <DialogHeader className="border-b bg-card px-6 py-4 text-left">
                <DialogTitle>Add compound</DialogTitle>
              </DialogHeader>
              <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto bg-card px-6 py-5">
                <CompoundField id="name" label="Name">
                  <Input
                    id="custom-compound-name"
                    data-field-control="true"
                    placeholder="e.g., KPV or custom blend"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </CompoundField>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <CompoundField id="type" label="Type">
                    <Select value={compoundType} onValueChange={(value) => setCompoundType(value as CompoundType)}>
                      <SelectTrigger id="custom-compound-type" data-field-control="true" className="w-full bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {compoundTypes.filter((type) => type !== 'all').map((type) => (
                          <SelectItem key={type} value={type}>{formatLabel(type)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompoundField>
                  <CompoundField id="category" label="Category">
                    <Select value={category} onValueChange={(value) => setCategory(value as CompoundCategory)}>
                      <SelectTrigger id="custom-compound-category" data-field-control="true" className="w-full bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter((cat) => cat !== 'all').map((cat) => (
                          <SelectItem key={cat} value={cat}>{formatLabel(cat)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompoundField>
                  <CompoundField id="route" label="Route">
                    <Select value={defaultRoute} onValueChange={(value) => setDefaultRoute(value as Route)}>
                      <SelectTrigger id="custom-compound-route" data-field-control="true" className="w-full bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route} value={route}>{route.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompoundField>
                  <CompoundField id="unit" label="Unit">
                    <Select value={defaultDoseUnit} onValueChange={(value) => setDefaultDoseUnit(value as DoseUnit)}>
                      <SelectTrigger id="custom-compound-unit" data-field-control="true" className="w-full bg-secondary/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {doseUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CompoundField>
                </div>
                <CompoundField id="summary" label="Summary">
                  <Textarea
                    id="custom-compound-summary"
                    data-field-control="true"
                    className="min-h-24 resize-none bg-secondary/40"
                    placeholder="What should PeptideOS show in the library card?"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                  />
                </CompoundField>
              </div>
              <DialogFooter className="shrink-0 flex-col border-t bg-card px-6 py-4 sm:justify-start">
                <Button type="button" className="w-full" onClick={handleAddCompound}>Save compound</Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => setAddOpen(false)}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Link
          href="/library/categories"
          className="flex items-center justify-between rounded-lg border bg-secondary/30 px-4 py-3 text-sm transition-colors hover:bg-secondary/50"
        >
          <span>
            <span className="block font-semibold">Browse collections</span>
            <span className="block text-xs text-muted-foreground">Compound groups and setup flows</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilters.map((filter) => (
              <Button
                key={filter.key}
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 gap-1 rounded-full px-3 text-xs"
                aria-label={`${filter.label}, remove filter`}
                onClick={filter.clear}
              >
                {filter.label}
                <X className="w-3 h-3" />
              </Button>
            ))}
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : null}

        {compareCompound ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3">
              <p className="text-sm font-medium">Comparing compounds related to {compareCompound.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the filters and evidence labels to compare nearby compounds without losing the source profile.
              </p>
            </CardContent>
          </Card>
        ) : null}

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
                    clearFilters();
                  }}
                >
                  {emptyState.actionLabel}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            filteredCompounds.map((compound) => {
              const evidence = getLibraryEvidenceDisplay(compound);

                      return (
                        <Link
                          key={compound.id}
                          href={`/library/${compound.id}`}
                          className="block"
                          aria-label={`${compound.name} ${formatLabel(compound.category)} ${compound.source === 'user' ? 'Custom' : 'Reference'} ${compound.aliases.join(' ')}`}
                        >
<Card className="transition-colors hover:bg-secondary/30">
<CardContent className="p-3.5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-3">
<div className="mb-1.5 flex min-w-0 items-start justify-between gap-3">
<h3 className="min-w-0 truncate text-sm font-semibold">{compound.name}</h3>
<Badge variant="outline" className={cn("shrink-0 text-[11px] capitalize", categoryColors[compound.category])}>
                              {formatLabel(compound.category)}
                            </Badge>
                            </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {getCompoundCardSummary(compound, researcherMode)}
                          </p>
<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
<span>{compound.source === 'user' ? 'Custom' : 'Reference'}</span>
<span>{evidence.tierLabel}</span>
<span>{evidence.statusLabel}</span>
<span>{formatLabel(compound.compoundType)}</span>
                            <span>{evidence.mechanismClass}</span>
                            <span>Route: {compound.defaultRoute.toUpperCase()}</span>
                            <span>Unit: {compound.defaultDoseUnit.toUpperCase()}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
