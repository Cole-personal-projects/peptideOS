"use client";

import Link from 'next/link';
import { Bot, Boxes, Camera, Calculator, CalendarDays, ChevronRight, ClipboardCheck, GitCompare } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const workflowSections = [
  {
    title: 'Inventory',
    icon: Boxes,
    items: [
      'Capture the exact label name, form, route, amount, lot, expiration, storage, source, and container state.',
      'Use kit entries when a single purchase represents multiple vials, then let inventory group matching vial records.',
      'Keep photos, COA details, and storage notes attached to the entry when available.',
    ],
  },
  {
    title: 'Peppi',
    icon: Bot,
    items: [
      'Ask Peppi to read a product photo, extract likely inventory details, and ask for missing fields.',
      'Require confirmation before Peppi adds inventory, creates schedules, or changes app data.',
      'Use Peppi for math, inventory lookup, schedule drafting, and pattern summaries, not medical advice.',
    ],
  },
  {
    title: 'Scheduling',
    icon: CalendarDays,
    items: [
      'Build schedules from user-confirmed label details, protocol notes, or manually entered plans.',
      'Log completed, skipped, missed, and adjusted entries so adherence and depletion stay tied together.',
      'Keep dose history separate from reference-library evidence so personal logs do not rewrite compound data.',
    ],
  },
  {
    title: 'Reconstitution',
    icon: Calculator,
    items: [
      'Use vial amount and diluent volume to calculate concentration after both values are confirmed.',
      'Store reconstitution date, active vial state, concentration, and remaining inventory together.',
      'Do not infer a compound-specific protocol from calculator math.',
    ],
  },
  {
    title: 'Review',
    icon: ClipboardCheck,
    items: [
      'Check route, form, storage, contraindication flags, negative stack flags, citations, and evidence gaps.',
      'Treat research-use entries as structured tracking references, not prescribing or treatment guidance.',
      'Prefer compound-specific source-backed details over generic peptide assumptions.',
    ],
  },
];

export default function CompoundGuidePage() {
  return (
    <AppShell>
      <PageHeader title="Compound Guide" backHref="/more" />

      <div className="space-y-4 p-4">
        <Card className="border-primary/20 bg-secondary/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workflow reference</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This guide holds the shared app workflows so compound pages can stay focused on compound-specific data.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/more/inventory">
                  <Boxes className="h-4 w-4" />
                  Inventory
                </Link>
              </Button>
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/more/ai-assistant">
                  <Bot className="h-4 w-4" />
                  Ask Peppi
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/more/reconstitution">
                  <Calculator className="h-4 w-4" />
                  Calculator
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/library">
                  <GitCompare className="h-4 w-4" />
                  Compare compounds
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {workflowSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-primary" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary p-2">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Photo intake</p>
                <p className="text-xs text-muted-foreground">Inventory approval flow lives with Peppi.</p>
              </div>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/more/ai-assistant">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
