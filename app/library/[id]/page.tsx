"use client";

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Beaker, BookOpen, CheckCircle2, ExternalLink, FlaskConical, ListChecks, MessageCircle, Pencil, Scale, Shield, Sparkles, Syringe, Thermometer, Trash2, User } from 'lucide-react';
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
import { getLibraryEvidenceDisplay } from '@/lib/library-evidence';
import { getCompoundProfilePriority } from '@/lib/library-profile-priority';
import { cn } from '@/lib/utils';
import type { CompoundCategory, CompoundReferenceProfile } from '@/lib/types';

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

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FieldBrief({ profile }: { profile: CompoundReferenceProfile }) {
  const brief = profile.biohackerBrief;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Field Brief
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base font-medium leading-relaxed text-foreground">{brief.headline}</p>

        <div className="grid gap-3">
          <div className="rounded-lg border border-border bg-background/70 p-3">
            <p className="mb-2 text-sm font-medium">Why people care</p>
            <BulletList items={brief.whyPeopleCare} />
          </div>
          <div className="rounded-lg border border-chart-4/30 bg-chart-4/5 p-3">
            <p className="mb-2 text-sm font-medium">Verify before use</p>
            <BulletList items={brief.verifyBeforeUse} />
          </div>
          <div className="rounded-lg border border-border bg-background/70 p-3">
            <p className="mb-2 text-sm font-medium">Track in PeptideOS</p>
            <BulletList items={brief.trackInApp} />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-primary" />
              Ask Peppi
            </p>
            <BulletList items={profile.peptideOSActions} />
          </div>
        </div>

        <Alert className="border-chart-4/40 bg-chart-4/5">
          <AlertTriangle className="h-4 w-4 text-chart-4" />
          <AlertDescription className="text-xs">
            <span className="mb-1 block font-medium text-foreground">Reality check</span>
            {brief.realityCheck}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  researcherMode,
  beginnerSummary,
  researcherDetails,
}: {
  researcherMode: boolean;
  beginnerSummary: string;
  researcherDetails: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {researcherMode ? researcherDetails : beginnerSummary}
        </p>
      </CardContent>
    </Card>
  );
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
  const referenceProfile = compound.referenceProfile;
  const evidenceDisplay = getLibraryEvidenceDisplay(compound);
  const profilePriority = getCompoundProfilePriority(compound);

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

        <Card className="border-primary/20 bg-secondary/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Reference Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                {evidenceDisplay.tierLabel}
              </Badge>
              <Badge variant="outline">{evidenceDisplay.statusLabel}</Badge>
              <Badge variant={profilePriority.band === 'priority' ? 'default' : 'secondary'}>
                {profilePriority.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{evidenceDisplay.mechanismClass}</p>
            <div className="flex flex-wrap gap-2">
              {profilePriority.reasons.map((reason) => (
                <Badge key={reason} variant="outline" className="text-[10px]">
                  {reason}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={referenceProfile ? 'field-brief' : 'overview'} className="w-full">
          <TabsList className={cn(
            "w-full overflow-x-auto",
            referenceProfile ? "justify-start" : "grid grid-cols-4",
          )}>
            {referenceProfile ? (
              <>
                <TabsTrigger value="field-brief" className="min-w-fit px-3">Field Brief</TabsTrigger>
                <TabsTrigger value="evidence" className="min-w-fit px-3">Evidence</TabsTrigger>
                <TabsTrigger value="tracking" className="min-w-fit px-3">Tracking</TabsTrigger>
                <TabsTrigger value="safety" className="min-w-fit px-3">Safety Watch</TabsTrigger>
                <TabsTrigger value="status" className="min-w-fit px-3">Status</TabsTrigger>
                <TabsTrigger value="citations" className="min-w-fit px-3">Citations</TabsTrigger>
                <TabsTrigger value="legal" className="min-w-fit px-3">Legal</TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="safety">Safety</TabsTrigger>
                <TabsTrigger value="citations">Citations</TabsTrigger>
                <TabsTrigger value="legal">Legal</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value={referenceProfile ? 'field-brief' : 'overview'} className="mt-4 space-y-4">
            {referenceProfile ? <FieldBrief profile={referenceProfile} /> : null}

            <SummaryCard
              researcherMode={researcherMode}
              beginnerSummary={compound.beginnerSummary}
              researcherDetails={compound.researcherDetails}
            />

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

          {referenceProfile ? (
            <>
              <TabsContent value="evidence" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListChecks className="w-4 h-4" />
                      Evidence Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{referenceProfile.reviewSummary}</p>
                    <div className="flex flex-wrap gap-2">
                      {referenceProfile.mechanismTargets.map((target) => (
                        <Badge key={target} variant="secondary">{target}</Badge>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {referenceProfile.clinicalEvidence.map((evidence) => (
                        <div key={`${evidence.design}-${evidence.population}`} className="rounded-lg border border-border bg-secondary/40 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{evidence.design}</p>
                            {evidence.sourceQuality ? (
                              <Badge variant="outline">{formatLabel(evidence.sourceQuality)}</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{evidence.population}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{evidence.finding}</p>
                          {evidence.limitations ? (
                            <p className="mt-2 rounded-md border border-chart-4/20 bg-chart-4/5 p-2 text-xs text-muted-foreground">
                              {evidence.limitations}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tracking" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Beaker className="w-4 h-4" />
                      Practical Tracking Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <BulletList items={referenceProfile.practicalNotes} />
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="mb-2 text-sm font-medium">Peppi can help</p>
                      <BulletList items={referenceProfile.peptideOSActions} />
                    </div>
                    <div className="rounded-lg border border-chart-4/20 bg-chart-4/5 p-3">
                      <p className="mb-2 text-sm font-medium">Evidence gaps</p>
                      <BulletList items={referenceProfile.evidenceGaps} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          ) : null}

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
            {referenceProfile ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Safety Signals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BulletList items={referenceProfile.safetySignals} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Evidence Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BulletList items={referenceProfile.evidenceGaps} />
                  </CardContent>
                </Card>
              </>
            ) : null}
          </TabsContent>

          {referenceProfile ? (
            <TabsContent value="status" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Regulatory Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{formatLabel(referenceProfile.regulatoryStatus.status)} in {referenceProfile.regulatoryStatus.region}</Badge>
                    {referenceProfile.regulatoryStatus.sourceQuality ? (
                      <Badge variant="secondary">{formatLabel(referenceProfile.regulatoryStatus.sourceQuality)}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{referenceProfile.regulatoryStatus.summary}</p>
                  {referenceProfile.regulatoryStatus.limitations ? (
                    <p className="rounded-md border border-chart-4/20 bg-chart-4/5 p-2 text-xs text-muted-foreground">
                      {referenceProfile.regulatoryStatus.limitations}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          ) : null}

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
                {compound.referenceProfile ? (
                  <div className="rounded-lg border border-border bg-secondary/40 p-3">
                    <p className="font-medium text-foreground">{formatLabel(compound.referenceProfile.regulatoryStatus.status)} in {compound.referenceProfile.regulatoryStatus.region}</p>
                    <p className="mt-1">{compound.referenceProfile.regulatoryStatus.summary}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
