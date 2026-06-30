"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emitClientDiagnostic } from '@/lib/client-diagnostics';

interface BetaAccessFormProps {
  nextPath: string;
  initialMessage?: string;
}

interface BetaRedeemResponse {
  ok?: boolean;
  message?: string;
  next?: string;
}

interface BetaChoiceGroup {
  id: 'platform' | 'experience' | 'protocolGoal' | 'currentSystem';
  label: string;
  options: string[];
}

const STORAGE_KEY = 'peptideos.betaAccessPassed';
const EMAIL_KEY = 'peptideos.betaEmail';

const betaChoiceGroups: BetaChoiceGroup[] = [
  {
    id: 'platform',
    label: 'Device',
    options: ['iPhone', 'Android', 'iPad', 'Desktop PWA'],
  },
  {
    id: 'experience',
    label: 'Tracking experience',
    options: ['New', 'Some tracking', 'Power user'],
  },
  {
    id: 'protocolGoal',
    label: 'Primary beta focus',
    options: ['Protocol setup', 'Inventory', 'Labs', 'Peppi'],
  },
  {
    id: 'currentSystem',
    label: 'Current system',
    options: ['Notes', 'Spreadsheet', 'Another app', 'None'],
  },
];

export function BetaAccessForm({ nextPath, initialMessage = '' }: BetaAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'confirmed'>('idle');
  const [profile, setProfile] = useState<Record<BetaChoiceGroup['id'], string>>({
    platform: 'iPhone',
    experience: 'Some tracking',
    protocolGoal: 'Protocol setup',
    currentSystem: 'Notes',
  });
  const canSubmit = useMemo(() => email.includes('@') && inviteCode.trim().length >= 4 && status !== 'submitting', [email, inviteCode, status]);
  const destination = nextPath === '/' ? '/welcome' : nextPath;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('submitting');
    setMessage('');
    emitClientDiagnostic('beta_redeem_started', { next: destination, profile });

    try {
      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, inviteCode, next: destination }),
      });
      const payload = await response.json() as BetaRedeemResponse;

      if (!response.ok || !payload.ok) {
        setStatus('idle');
        setMessage(payload.message ?? 'Could not confirm beta access.');
        emitClientDiagnostic('beta_redeem_failed', { status: response.status }, response.status >= 500 ? 'error' : 'warn');
        return;
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      } catch {
        // Cookie remains the source of truth; local storage only helps the client shell avoid flicker.
      }

      setStatus('confirmed');
      setMessage(payload.message ?? 'Access confirmed. Opening PeptideOS.');
      emitClientDiagnostic('beta_redeem_confirmed', { next: payload.next ?? destination, profile });

      window.setTimeout(() => {
        router.replace(payload.next ?? destination);
      }, 550);
    } catch (error) {
      setStatus('idle');
      setMessage('Network error. Check your connection and try again.');
      emitClientDiagnostic('beta_redeem_network_error', { message: error instanceof Error ? error.message : 'unknown' }, 'error');
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Closed beta access</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              We want specific workflow feedback: setup speed, logging friction, inventory clarity, labs, and where PeptideOS should feel more visual.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="beta-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="beta-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 rounded-[16px] pl-10"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={status === 'submitting' || status === 'confirmed'}
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="beta-key">Beta key</Label>
          <Input
            id="beta-key"
            name="inviteCode"
            autoComplete="one-time-code"
            placeholder="POS-XXXX-XXXX-XXXX"
            className="h-12 rounded-[16px] font-mono text-sm uppercase tracking-[0.06em]"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            disabled={status === 'submitting' || status === 'confirmed'}
            required
          />
        </div>
      </div>

      <div className="space-y-4 rounded-[24px] border bg-card p-4">
        <div>
          <p className="text-sm font-bold">Tell us what to watch.</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Optional context. It helps frame feedback, but the beta key is what grants access.</p>
        </div>
        {betaChoiceGroups.map((group) => (
          <div key={group.id} className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = profile[group.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'min-h-9 rounded-full border px-3 py-2 text-xs font-bold transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                    )}
                    aria-pressed={selected}
                    onClick={() => setProfile((current) => ({ ...current, [group.id]: option }))}
                    disabled={status === 'submitting' || status === 'confirmed'}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {message ? (
        <div
          role={status === 'confirmed' ? 'status' : 'alert'}
          className={cn(
            'rounded-[18px] border px-4 py-3 text-sm',
            status === 'confirmed'
              ? 'border-chart-2/30 bg-chart-2/10 text-chart-2'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          <div className="flex items-center gap-2">
            {status === 'confirmed' ? <CheckCircle2 className="size-4" /> : null}
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <Button type="submit" className="h-12 w-full rounded-[16px] text-sm font-extrabold" disabled={!canSubmit || status === 'confirmed'}>
        {status === 'submitting' ? <Loader2 className="size-4 animate-spin" /> : null}
        {status === 'confirmed' ? <CheckCircle2 className="size-4" /> : null}
        {status === 'submitting' ? 'Checking key' : status === 'confirmed' ? 'Access confirmed' : 'Enter PeptideOS'}
        {status === 'idle' ? <ArrowRight className="size-4" /> : null}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Email is used for beta access and follow-up. PeptideOS still starts local-first by default.
      </p>
    </form>
  );
}
