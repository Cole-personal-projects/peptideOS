"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const STORAGE_KEY = 'peptideos.betaAccessPassed';
const EMAIL_KEY = 'peptideos.betaEmail';

export function BetaAccessForm({ nextPath, initialMessage = '' }: BetaAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'confirmed'>('idle');
  const canSubmit = useMemo(() => email.includes('@') && inviteCode.trim().length >= 4 && status !== 'submitting', [email, inviteCode, status]);
  const destination = nextPath === '/' ? '/welcome' : nextPath;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus('submitting');
    setMessage('');
    emitClientDiagnostic('beta_redeem_started', { next: destination });

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
        setMessage(payload.message ?? 'Could not confirm beta access right now.');
        emitClientDiagnostic('beta_redeem_failed', { status: response.status }, response.status >= 500 ? 'error' : 'warn');
        return;
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
        window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
      } catch {
        // Local storage is only a client convenience; the signed cookie is the gate.
      }

      setStatus('confirmed');
      setMessage(payload.message ?? 'Beta access confirmed.');
      emitClientDiagnostic('beta_redeem_confirmed', { next: payload.next ?? destination });
      window.setTimeout(() => router.replace(payload.next ?? destination), 900);
    } catch (error) {
      setStatus('idle');
      setMessage('Network error. Try again.');
      emitClientDiagnostic('beta_redeem_network_error', { message: error instanceof Error ? error.message : 'unknown' }, 'error');
    }
  };

  return (
    <form action="/api/beta/redeem" method="post" onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="next" value={destination} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === 'submitting' || status === 'confirmed'}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inviteCode">Beta key</Label>
        <Input
          id="inviteCode"
          name="inviteCode"
          autoComplete="one-time-code"
          placeholder="Paste or type beta key"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          disabled={status === 'submitting' || status === 'confirmed'}
          required
        />
      </div>
      {message ? (
        <div
          role={status === 'confirmed' ? 'status' : 'alert'}
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status === 'confirmed'
              ? 'border-chart-2/30 bg-chart-2/10 text-chart-2'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {status === 'confirmed' ? <CheckCircle2 className="size-4" /> : null}
            <span>{message}</span>
          </div>
        </div>
      ) : null}
      <Button type="submit" className="h-12 w-full" disabled={!canSubmit || status === 'confirmed'}>
        {status === 'submitting' ? <Loader2 className="size-4 animate-spin" /> : null}
        {status === 'confirmed' ? <CheckCircle2 className="size-4" /> : null}
        {status === 'submitting' ? 'Checking key' : status === 'confirmed' ? 'Access confirmed' : 'Enter PeptideOS'}
        {status === 'idle' ? <ArrowRight className="size-4" /> : null}
      </Button>
    </form>
  );
}
