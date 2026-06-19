"use client";

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BookOpen, Boxes, Calculator, FlaskConical, GitCompare, MessageCircle, Pencil, Syringe, Trash2, User } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { LibraryProfileView } from '@/components/library-profile-view';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
import { buildLibraryProfileViewModel } from '@/lib/library-profile-view';
import { getConversionById } from '@/lib/peptide-conversions';
import { cn } from '@/lib/utils';
import type { CompoundCategory } from '@/lib/types';

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

function formatLabel(value: string): string {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export default function LibraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, getCompound, getPeptide, updateUserCompound, deleteUserCompound } = useApp();
  const [researcherMode, setResearcherMode] = useState(data.userMode === 'researcher');
  const [editOpen, setEditOpen] = useState(false);
  const compound = getCompound(id);
  const legacyPeptide = compound ? undefined : getPeptide(id);
  const [editName, setEditName] = useState(compound?.name ?? '');
  const [editSummary, setEditSummary] = useState(compound?.beginnerSummary ?? '');

  if (!compound && !legacyPeptide) {
    return null;
  }

  if (legacyPeptide) {
    return (
      <AppShell>
        <PageHeader title={legacyPeptide.name} backHref="/library" />
        <div className="p-4 space-y-4">
          <Alert className="border-chart-4/50 bg-chart-4/5">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            <AlertDescription className="text-xs">
              For research purposes only. This information is not medical advice.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{legacyPeptide.beginnerSummary}</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (!compound) {
    return null;
  }

  const isCustom = compound.source === 'user';
  const libraryProfile = buildLibraryProfileViewModel(compound, { researcherMode });
  const supportsReconstitutionCalculator = Boolean(getConversionById(compound.id));

  const saveEdit = () => {
    if (!editName.trim()) return;
    updateUserCompound(compound.id, {
      name: editName.trim(),
      beginnerSummary: editSummary.trim() || 'User-created compound.',
      researcherDetails: editSummary.trim() || 'User-created compound.',
    });
    setEditOpen(false);
  };

  const deleteCustom = () => {
    deleteUserCompound(compound.id);
    router.push('/library');
  };

  return (
    <AppShell>
      <PageHeader
        title={compound.name}
        backHref="/library"
        rightElement={
          <div className="flex items-center gap-2" aria-label="Detail actions">
            {isCustom ? (
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" aria-label="Edit compound">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit compound</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-compound-name">Name</Label>
                      <Input id="edit-compound-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="edit-compound-summary">Summary</Label>
                      <Textarea id="edit-compound-summary" value={editSummary} onChange={(event) => setEditSummary(event.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="destructive" onClick={deleteCustom}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                    <Button type="button" onClick={saveEdit}>Save changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
            <User className={cn("w-4 h-4", !researcherMode && "text-primary")} />
            <Label htmlFor="library-detail-mode" className="sr-only">
              Researcher mode
            </Label>
            <Switch
              id="library-detail-mode"
              aria-label="Researcher mode"
              checked={researcherMode}
              onCheckedChange={setResearcherMode}
              className="scale-75"
            />
            <FlaskConical className={cn("w-4 h-4", researcherMode && "text-primary")} />
          </div>
        }
      />

      <div className="p-4 space-y-4">
        <Alert className="border-chart-4/50 bg-chart-4/5">
          <AlertTriangle className="h-4 w-4 text-chart-4" />
          <AlertDescription className="text-xs">
            For research purposes only. This information is not medical advice.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={cn("capitalize", categoryColors[compound.category])}>
            {formatLabel(compound.category)}
          </Badge>
          <Badge variant={isCustom ? 'default' : 'secondary'}>
            {isCustom ? 'Custom' : 'Reference'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Syringe className="w-3 h-3" />
            {compound.defaultRoute.toUpperCase()}
          </Badge>
          <Badge variant="outline">{compound.defaultDoseUnit.toUpperCase()}</Badge>
          {compound.referenceProfile ? (
            <>
              <Badge variant="outline">{formatLabel(compound.referenceProfile.evidenceTier)}</Badge>
            </>
          ) : null}
        </div>

        <LibraryProfileView model={libraryProfile}>
          <section aria-label={`${compound.name} app actions`} className="grid gap-2 sm:grid-cols-2">
            {supportsReconstitutionCalculator ? (
              <Button asChild variant="secondary" className="justify-start">
                <Link href={`/more/reconstitution?compound=${compound.id}`} aria-label={`Calculate ${compound.name} reconstitution`}>
                  <Calculator className="w-4 h-4" />
                  Calculate reconstitution
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="secondary" className="justify-start">
              <Link href={`/more/inventory?compound=${compound.id}&add=inventory`} aria-label={`Add ${compound.name} to inventory`}>
                <Boxes className="w-4 h-4" />
                Add to inventory
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href={`/stacks?compound=${compound.id}&add=protocol`} aria-label={`Create ${compound.name} protocol`}>
                <Syringe className="w-4 h-4" />
                Create protocol
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link href={`/more/ai-assistant?compound=${compound.id}`} aria-label={`Ask Peppi about ${compound.name}`}>
                <MessageCircle className="w-4 h-4" />
                Ask Peppi
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/more/compound-guide?compound=${compound.id}`} aria-label={`Open compound guide for ${compound.name}`}>
                <BookOpen className="w-4 h-4" />
                Compound guide
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/library?compare=${compound.id}`} aria-label={`Compare ${compound.name} with related compounds`}>
                <GitCompare className="w-4 h-4" />
                Compare related
              </Link>
            </Button>
          </section>
        </LibraryProfileView>
      </div>
    </AppShell>
  );
}
