"use client";

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiStackSheet } from '@/components/navigation/ai-stack-sheet';

export default function AIAssistantPage() {
  const [aiStackOpen, setAiStackOpen] = useState(false);

  return (
    <AppShell>
      <PageHeader title="AI Assistant" backHref="/more" />

      <div className="p-4 space-y-3">
        <Card className="bg-secondary/30">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Protocol Assistant</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
              Describe a protocol in plain English and the assistant builds the stack and dosing schedules for you.
            </p>
            <Button onClick={() => setAiStackOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Describe a protocol
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground px-1">
          The assistant only structures what you write — it never gives dosing advice or recommendations. Review every
          schedule before activating it.
        </p>
      </div>

      <AiStackSheet open={aiStackOpen} onOpenChange={setAiStackOpen} />
    </AppShell>
  );
}
