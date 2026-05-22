"use client";

import { use } from 'react';
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { Clock, Syringe, AlertTriangle, BookOpen, Beaker, Shield, Thermometer, ExternalLink, User, FlaskConical, Scale } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

export default function PeptideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, getPeptide } = useApp();
  const [researcherMode, setResearcherMode] = useState(data.userMode === 'researcher');
  const peptide = getPeptide(id);

  if (!peptide) {
    notFound();
  }

  return (
    <AppShell>
      <PageHeader
        title={peptide.name}
        backHref="/library"
        rightElement={
          <div className="flex items-center gap-2" aria-label="Detail mode">
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
        {/* Research disclaimer */}
        <Alert className="border-chart-4/50 bg-chart-4/5">
          <AlertTriangle className="h-4 w-4 text-chart-4" />
          <AlertDescription className="text-xs">
            For research purposes only. This information is not medical advice.
          </AlertDescription>
        </Alert>

        {/* Quick stats */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={cn("capitalize", categoryColors[peptide.category])}>
            {peptide.category}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Syringe className="w-3 h-3" />
            {peptide.defaultRoute.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {peptide.halfLifeHours}h half-life
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-5 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="protocols">Protocols</TabsTrigger>
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
                  {researcherMode ? peptide.researcherDetails : peptide.beginnerSummary}
                </p>
              </CardContent>
            </Card>

            {researcherMode ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Mechanism
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{peptide.mechanism}</p>
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
                <p className="text-sm text-muted-foreground">{peptide.storage}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Syringe className="w-4 h-4" />
                  Common Protocols
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {peptide.protocols.map((protocol, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary">
                    <p className="text-sm">{protocol}</p>
                  </div>
                ))}
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
                <p className="text-sm text-muted-foreground">{peptide.safety}</p>
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
                {peptide.citations.map((citation) => (
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
                <p>Protocol examples are research references and should not be treated as dosing instructions.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
