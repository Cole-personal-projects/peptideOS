"use client";

import { useState } from 'react';
import { Bot, Check, Send, Sparkles, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AiStackSheet } from '@/components/navigation/ai-stack-sheet';
import { proposeAssistantActionFromMessage, type AssistantAction } from '@/lib/assistant-actions';
import { useApp } from '@/lib/context';

export default function AIAssistantPage() {
  const { addSignalCheckIn } = useApp();
  const [aiStackOpen, setAiStackOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const [assistantMessage, setAssistantMessage] = useState('Tell Haiku what you want to capture or change.');

  const sendMessage = () => {
    const nextAction = proposeAssistantActionFromMessage(message);

    if (!nextAction) {
      setAssistantMessage('I can capture Signal check-ins right now. Include energy and/or sleep so I can draft one for approval.');
      return;
    }

    setPendingAction(nextAction);
    setAssistantMessage('I will add this Signal check-in.');
    setMessage('');
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'add_signal_check_in') {
      addSignalCheckIn(pendingAction.payload);
      setPendingAction(null);
      setAssistantMessage('Signal check-in saved.');
    }
  };

  return (
    <AppShell>
      <PageHeader title="AI Assistant" backHref="/more" />

      <div className="p-4 space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="w-4 h-4 text-primary" />
              Haiku
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-secondary/50 p-3 text-sm">
              {assistantMessage}
            </div>

            {pendingAction?.type === 'add_signal_check_in' && (
              <div className="space-y-3 rounded-md border bg-background p-3">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-md bg-secondary px-2 py-1">Energy {pendingAction.payload.energy}/10</span>
                  <span className="rounded-md bg-secondary px-2 py-1">Sleep {pendingAction.payload.sleepHours} hr</span>
                </div>
                {pendingAction.payload.notes && (
                  <p className="text-sm text-muted-foreground">{pendingAction.payload.notes}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={confirmAction}>
                    <Check className="w-4 h-4" />
                    Confirm Signal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                    <X className="w-4 h-4" />
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                aria-label="Message Haiku"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Energy was 7, slept 6 hours, shoulder calm today."
              />
              <Button className="w-full" onClick={sendMessage} disabled={!message.trim()}>
                <Send className="w-4 h-4" />
                Send message
              </Button>
            </div>
          </CardContent>
        </Card>

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
