"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bot, Check, Plus, Send, X } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { QuickConfirmDoseDialog } from '@/components/dashboard/quick-confirm-dose-dialog';
import {
  buildScheduledDoseConfirmationProposal,
  buildAssistantTodaySummary,
  isAssistantAction,
  isTodayStatusRequest,
  PEPPI_PROTOCOL_DRAFT_STORAGE_KEY,
  proposeAssistantActionFromMessage,
  type AssistantAction,
  type AssistantActionProposal,
  type AssistantSummaryCard,
  type ScheduledDoseConfirmationCandidate,
} from '@/lib/assistant-actions';
import { getTrackableCompounds } from '@/lib/compound-workflows';
import { formatDose } from '@/lib/dose-helpers';
import { useApp } from '@/lib/context';
import type { ProtocolCompoundInput } from '@/lib/ai-protocol';
import { buildNewVialBatch, getPhysicalVialCount } from '@/lib/vial-create';

const workflowPrompts = [
  {
    label: 'Today summary',
    prompt: 'Summarize today: due, completed, missed, inventory coverage, and latest Signal.',
  },
  {
    label: 'Add to my schedule',
    prompt: 'Add to my schedule: ',
  },
  {
    label: 'Add inventory',
    prompt: 'Add inventory: ',
  },
  {
    label: 'Log Signal',
    prompt: 'Log Signal: energy was ',
  },
  {
    label: 'Calculate reconstitution',
    prompt: 'Calculate reconstitution: ',
    href: '/more/reconstitution',
  },
];

async function requestAssistantActionProposal(message: string, compounds: ProtocolCompoundInput[]): Promise<AssistantActionProposal | null> {
  try {
    const response = await fetch('/api/ai/propose-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, compounds }),
    });

    if (!response.ok) return null;

    const payload = await response.json() as Partial<AssistantActionProposal>;
    if (typeof payload.message !== 'string') return null;
    if (payload.action !== null && !isAssistantAction(payload.action)) return null;

    return {
      message: payload.message,
      action: payload.action ?? null,
    };
  } catch {
    return null;
  }
}

export default function AIAssistantPage() {
  const { data, addSignalCheckIn, addStack, addVials } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trackableCompounds = useMemo(() => getTrackableCompounds(data), [data]);
  const initialCompoundId = searchParams.get('compound');
  const initialCompound = trackableCompounds.find((candidate) => candidate.id === initialCompoundId);
  const [promptMenuOpen, setPromptMenuOpen] = useState(false);
  const [message, setMessage] = useState(
    initialCompound ? `Help me understand ${initialCompound.name} and what I can track in PeptideOS.` : '',
  );
  const [isSending, setIsSending] = useState(false);
  const [pendingAction, setPendingAction] = useState<AssistantAction | null>(null);
  const [confirmLogId, setConfirmLogId] = useState<string | null>(null);
  const [summaryCards, setSummaryCards] = useState<AssistantSummaryCard[]>([]);
  const [assistantMessage, setAssistantMessage] = useState('Tell Peppi what you want to capture or change.');
  const proposalCompounds = trackableCompounds.map((compound) => ({
    id: compound.id,
    name: compound.name,
    defaultRoute: compound.defaultRoute,
    supportedRoutes: compound.supportedRoutes,
    defaultDoseUnit: compound.defaultDoseUnit,
  }));

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    if (isTodayStatusRequest(trimmedMessage)) {
      const localSummary = buildAssistantTodaySummary(data);
      setPendingAction(null);
      setSummaryCards(localSummary.summaryCards ?? []);
      setAssistantMessage(localSummary.message);
      setMessage('');
      return;
    }

    const scheduledDoseProposal = buildScheduledDoseConfirmationProposal(data, trimmedMessage);
    if (scheduledDoseProposal) {
      setPendingAction(scheduledDoseProposal.action);
      setSummaryCards(scheduledDoseProposal.summaryCards ?? []);
      setAssistantMessage(scheduledDoseProposal.message);
      setMessage('');
      return;
    }

    setIsSending(true);
    const peppiProposal = await requestAssistantActionProposal(trimmedMessage, proposalCompounds);
    setIsSending(false);

    if (peppiProposal) {
      setPendingAction(peppiProposal.action);
      setSummaryCards([]);
      setAssistantMessage(peppiProposal.message);
      setMessage('');
      return;
    }

    const nextAction = proposeAssistantActionFromMessage(trimmedMessage);

    if (!nextAction) {
      setSummaryCards([]);
      setAssistantMessage('I can capture Signal check-ins right now. Include energy and/or sleep so I can draft one for approval.');
      return;
    }

    setPendingAction(nextAction);
    setSummaryCards([]);
    setAssistantMessage('I will add this Signal check-in.');
    setMessage('');
  };

  const applyWorkflowPrompt = (workflowPrompt: typeof workflowPrompts[number]) => {
    if (workflowPrompt.href) {
      router.push(workflowPrompt.href);
      return;
    }

    const { prompt } = workflowPrompt;
    setMessage(prompt);
    setPromptMenuOpen(false);
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'add_signal_check_in') {
      addSignalCheckIn(pendingAction.payload);
      setPendingAction(null);
      setAssistantMessage('Signal check-in saved.');
    }

    if (pendingAction.type === 'create_stack_from_protocol') {
      addStack(pendingAction.payload);
      setPendingAction(null);
      setAssistantMessage('Schedule saved.');
    }

    if (pendingAction.type === 'create_inventory_vials') {
      const vials = buildNewVialBatch(pendingAction.payload);
      if (vials.length < 1) {
        setAssistantMessage('I could not create inventory from that draft.');
        return;
      }

      addVials(vials, {
        createdFrom: 'assistant',
        packageUnit: pendingAction.payload.packageUnit,
        packageQuantity: pendingAction.payload.packageQuantity,
      });
      setPendingAction(null);
      setAssistantMessage('Inventory saved.');
    }
  };

  const getCompoundName = (compoundId: string) => (
    data.peptides.find((peptide) => peptide.id === compoundId)?.name
    ?? data.compounds.find((compound) => compound.id === compoundId)?.name
    ?? compoundId
  );

  return (
    <AppShell>
      <PageHeader title="Peppi" backHref="/more" />

      <div className="p-4 space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="w-4 h-4 text-primary" />
              Peppi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <PeppiMessage content={assistantMessage} />

          {summaryCards.length > 0 && (
            <div className="grid gap-2" aria-label="Peppi today summary cards">
              {summaryCards.map((card) => (
                <div key={card.id} className="rounded-md border bg-background p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      {card.eyebrow && <p className="text-xs text-muted-foreground">{card.eyebrow}</p>}
                      <p className="font-medium">{card.title}</p>
                      <p className="text-muted-foreground">{card.body}</p>
                    </div>
                    {card.href && card.actionLabel && (
                      <Button asChild size="sm" variant="outline" className="shrink-0">
                        <Link href={card.href}>{card.actionLabel}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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

{pendingAction?.type === 'create_stack_from_protocol' && (
<ProtocolDraftCard
action={pendingAction}
getCompoundName={getCompoundName}
onConfirm={confirmAction}
onDismiss={() => setPendingAction(null)}
/>
)}

          {pendingAction?.type === 'create_inventory_vials' && (
            <div className="space-y-3 rounded-md border bg-background p-3">
                <div>
                  <p className="font-medium">{pendingAction.payload.name}</p>
                  <p className="text-sm text-muted-foreground">{getCompoundName(pendingAction.payload.peptideId)}</p>
                </div>
                <div className="rounded-md bg-secondary px-3 py-2 text-sm">
                  <p className="font-medium">
                    {pendingAction.payload.totalAmountValue && pendingAction.payload.totalAmountUnit
                      ? `${formatDose(pendingAction.payload.totalAmountValue, pendingAction.payload.totalAmountUnit)} each`
                      : 'Amount not set'}
                    {' · '}
                    {getPhysicalVialCount(pendingAction.payload)} sealed vials
                  </p>
                  <p className="text-muted-foreground">
                    {pendingAction.payload.packageUnit === 'kit' ? `${pendingAction.payload.packageQuantity ?? 1} kit` : `${pendingAction.payload.packageQuantity ?? 1} vial`}
                    {pendingAction.payload.containerType ? ` · ${pendingAction.payload.containerType.replaceAll('-', ' ')}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={confirmAction}>
                    <Check className="w-4 h-4" />
                    Confirm Inventory
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingAction(null)}>
                    <X className="w-4 h-4" />
                    Dismiss
                  </Button>
              </div>
            </div>
          )}

          {pendingAction?.type === 'confirm_scheduled_dose' && (
            <ScheduledDoseConfirmationCard
              candidates={pendingAction.payload.candidates}
              onReview={(logId) => setConfirmLogId(logId)}
              onDismiss={() => setPendingAction(null)}
            />
          )}

          <div className="space-y-2">
              <Textarea
                aria-label="Message Peppi"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask Peppi to add inventory, build a schedule, log a Signal, or run app math."
              />
              {promptMenuOpen && (
                <div className="grid grid-cols-2 gap-2" aria-label="Peppi workflow prompts">
                  {workflowPrompts.map((workflowPrompt) => (
                    <Button
                      key={workflowPrompt.label}
                      type="button"
                      variant="secondary"
                      className="justify-start text-left"
                      onClick={() => applyWorkflowPrompt(workflowPrompt)}
                    >
                      {workflowPrompt.label}
                    </Button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-[44px_1fr] gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Open Peppi workflow prompts"
                  aria-expanded={promptMenuOpen}
                  onClick={() => setPromptMenuOpen((open) => !open)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button onClick={sendMessage} disabled={!message.trim() || isSending}>
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send message'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground px-1">
          The assistant only structures what you write — it never gives dosing advice or recommendations. Review every
          schedule before activating it.
 </p>
 </div>
 <QuickConfirmDoseDialog
 logId={confirmLogId}
 open={Boolean(confirmLogId)}
 onOpenChange={(open) => !open && setConfirmLogId(null)}
 title="Review scheduled dose"
 description="Choose vial, site, and notes before confirming this scheduled dose."
 confirmLabel="Confirm dose"
 onConfirmed={() => {
 setConfirmLogId(null);
 setPendingAction(null);
 setAssistantMessage('Dose confirmed from your reviewed scheduled log.');
 }}
 />
 </AppShell>
 );
}

function formatCandidateTime(value: string) {
 return new Date(value).toLocaleString(undefined, {
 weekday: 'short',
 hour: 'numeric',
 minute: '2-digit',
 });
}

function ScheduledDoseConfirmationCard({
 candidates,
 onReview,
 onDismiss,
}: {
 candidates: ScheduledDoseConfirmationCandidate[];
 onReview: (logId: string) => void;
 onDismiss: () => void;
}) {
 return (
 <div className="space-y-3 rounded-md border bg-background p-3" aria-label="Peppi scheduled dose review">
 <div className="space-y-1">
 <p className="text-xs font-medium uppercase text-muted-foreground">Scheduled dose review</p>
 <p className="font-medium">
 {candidates.length === 1 ? 'Review pending scheduled dose' : 'Choose scheduled dose'}
 </p>
 <p className="text-sm text-muted-foreground">
 Peppi will open the app confirmation flow. It will not log anything until you confirm.
 </p>
 </div>
 <div className="space-y-2">
 {candidates.map((candidate) => (
 <div key={candidate.logId} className="rounded-md border px-3 py-2 text-sm">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <p className="font-medium">{candidate.compoundName}</p>
 <p className="text-muted-foreground">{candidate.doseLabel} · {candidate.route.toUpperCase()}</p>
 <p className="text-xs text-muted-foreground">{candidate.stackName} · {formatCandidateTime(candidate.scheduledAt)}</p>
 </div>
 <Button size="sm" onClick={() => onReview(candidate.logId)}>
 Review confirmation
 </Button>
 </div>
 </div>
 ))}
 </div>
 <div className="flex gap-2">
 <Button size="sm" variant="outline" asChild>
 <Link href="/log">Full log</Link>
 </Button>
 <Button size="sm" variant="outline" onClick={onDismiss}>
 <X className="w-4 h-4" />
 Dismiss
 </Button>
 </div>
 </div>
 );
}

function ProtocolDraftCard({
  action,
  getCompoundName,
  onConfirm,
  onDismiss,
}: {
  action: Extract<AssistantAction, { type: 'create_stack_from_protocol' }>;
  getCompoundName: (compoundId: string) => string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const firstCompoundId = action.payload.peptides[0]?.peptideId;
  const editHref = firstCompoundId ? `/stacks?compound=${encodeURIComponent(firstCompoundId)}&add=protocol&draft=peppi` : '/stacks?add=protocol&draft=peppi';
  const storeDraftForBuilder = () => {
    window.sessionStorage.setItem(PEPPI_PROTOCOL_DRAFT_STORAGE_KEY, JSON.stringify(action.payload));
  };

  return (
    <div className="space-y-3 rounded-md border bg-background p-3" aria-label="Peppi protocol draft">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase text-muted-foreground">Protocol draft</p>
        <p className="font-medium">{action.payload.name}</p>
        {action.payload.description && (
          <p className="text-sm text-muted-foreground">{action.payload.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">Duration</p>
          <p className="font-medium">{action.payload.durationDays} days</p>
        </div>
        <div className="rounded-md bg-secondary px-3 py-2">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-medium">Draft for review</p>
        </div>
      </div>

      <div className="space-y-2" aria-label="Protocol draft compounds">
        {action.payload.peptides.map((stackPeptide) => (
          <div key={`${stackPeptide.peptideId}-${stackPeptide.timing}`} className="rounded-md border px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">{getCompoundName(stackPeptide.peptideId)}</p>
                <p className="text-muted-foreground">
                  {formatDose(stackPeptide.doseValue, stackPeptide.doseUnit)}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{stackPeptide.route.toUpperCase()}</p>
                <p>{stackPeptide.timing}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{stackPeptide.frequency}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Review before saving. Nothing changes until you confirm.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button size="sm" onClick={onConfirm}>
          <Check className="w-4 h-4" />
          Confirm Schedule
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={editHref} onClick={storeDraftForBuilder}>Edit in builder</Link>
        </Button>
        <Button size="sm" variant="outline" onClick={onDismiss}>
          <X className="w-4 h-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function PeppiMessage({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="space-y-3 rounded-md bg-secondary/50 p-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const listItems = lines
          .map((line) => line.match(/^\d+\.\s+(.+)$/)?.[1])
          .filter((line): line is string => Boolean(line));

        if (listItems.length === lines.length) {
          return (
            <ol key={`block-${blockIndex}`} className="list-decimal space-y-1 pl-5">
              {listItems.map((item, itemIndex) => (
                <li key={`item-${blockIndex}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`block-${blockIndex}`}>
            {lines.map((line, lineIndex) => (
              <span key={`line-${blockIndex}-${lineIndex}`}>
                {lineIndex > 0 && <br />}
                {renderInlineMarkdown(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineMarkdown(value: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}
