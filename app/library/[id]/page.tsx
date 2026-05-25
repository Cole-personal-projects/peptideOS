"use client";

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Beaker, BookOpen, ExternalLink, FlaskConical, Pencil, Scale, Shield, Syringe, Thermometer, Trash2, User } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/context';
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
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-4 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="safety">Safety</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {researcherMode ? compound.researcherDetails : compound.beginnerSummary}
                </p>
              </CardContent>
            </Card>

            {researcherMode && compound.mechanism ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Mechanism
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{compound.mechanism}</p>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{compound.storage}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="safety" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safety
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{compound.safety}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citations" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Citations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {compound.citations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No citations attached.</p>
                ) : compound.citations.map((citation) => (
                  <div key={citation.id} className="p-3 rounded-lg bg-secondary">
                    <p className="text-sm font-medium">{citation.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {citation.source}, {citation.year}
                      </p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Legal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Research purposes only. PeptideOS does not provide medical advice, diagnosis, or treatment.</p>
                <p>Reference entries are read-only. Custom entries are local user notes.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
