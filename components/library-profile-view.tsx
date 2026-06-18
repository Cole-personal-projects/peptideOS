"use client";

import { AlertTriangle, CheckCircle2, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { LibraryProfileSection, LibraryProfileViewModel } from '@/lib/library-profile-view';
import { cn } from '@/lib/utils';

export function LibraryProfileView({ model }: { model: LibraryProfileViewModel }) {
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-secondary/25">
        <CardHeader className="pb-2">
          <h2 className="text-base font-semibold leading-none">At a glance</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{model.summary}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {model.atAGlance.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-lg border border-border bg-background/70 p-3">
                <p className="text-[11px] font-medium uppercase text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {model.sections.map((section) => (
          <LibraryProfileSectionCard key={section.title} section={section} />
        ))}
      </div>
    </div>
  );
}

function LibraryProfileSectionCard({ section }: { section: LibraryProfileSection }) {
  return (
    <Card className={cn(
      section.tone === 'primary' && 'border-primary/20 bg-primary/5',
      section.tone === 'warning' && 'border-chart-4/25 bg-chart-4/5',
    )}>
      <CardHeader className="pb-2">
        <h3 className="flex items-center gap-2 text-base font-semibold leading-none">
          {section.title === 'Peppi prompts' ? <MessageCircle className="h-4 w-4 text-primary" /> : null}
          {section.tone === 'warning' ? <AlertTriangle className="h-4 w-4 text-chart-4" /> : null}
          {section.title}
        </h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {section.items.map((item) => (
            <li key={item} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {section.title === 'Evidence and transparency' ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">Transparent limits</Badge>
            <Badge variant="outline">Not medical advice</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
