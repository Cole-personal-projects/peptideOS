"use client";

import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { betaRedemptionMessage, isBetaGateEnabled, normalizeInviteCode, type BetaRedemptionResult } from '@/lib/beta-access';

const BETA_ACCESS_LOCAL_KEY = 'peptideos.betaAccessPassed';
const BETA_ACCESS_LOCAL_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180;

interface LocalBetaAccessMarker {
  passed: true;
  expiresAt: number;
}

function getLocalBetaAccessMarker() {
  if (typeof window === 'undefined') return false;

  try {
    const marker = JSON.parse(window.localStorage.getItem(BETA_ACCESS_LOCAL_KEY) ?? 'null') as Partial<LocalBetaAccessMarker> | null;
    if (marker?.passed === true && typeof marker.expiresAt === 'number' && marker.expiresAt > Date.now()) return true;
  } catch {
    // Ignore malformed marker and clear below.
  }

  window.localStorage.removeItem(BETA_ACCESS_LOCAL_KEY);
  return false;
}

function setLocalBetaAccessMarker() {
  const marker: LocalBetaAccessMarker = {
    passed: true,
    expiresAt: Date.now() + BETA_ACCESS_LOCAL_MAX_AGE_MS,
  };
  window.localStorage.setItem(BETA_ACCESS_LOCAL_KEY, JSON.stringify(marker));
}

export function BetaAccessGate({ children }: { children: ReactNode }) {
  const enabled = isBetaGateEnabled();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(() => !enabled || getLocalBetaAccessMarker());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!enabled || isUnlocked) return;

    let active = true;
    void fetch('/api/beta/redeem', { method: 'GET', cache: 'no-store' })
      .then((response) => response.json() as Promise<{ ok: boolean }>)
      .then((payload) => {
        if (!active || !payload.ok) return;
        setLocalBetaAccessMarker();
        setIsUnlocked(true);
      })
      .catch(() => {
        // Stay on the beta screen; entering the key remains the recovery path.
      });

    return () => {
      active = false;
    };
  }, [enabled, isUnlocked]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const email = emailRef.current?.value.trim().toLowerCase() ?? '';
    const inviteCode = normalizeInviteCode(codeRef.current?.value ?? '');

    if (!email || !inviteCode) {
      setMessage('Enter your email and beta key.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, inviteCode }),
      });
      const payload = (await response.json()) as BetaRedemptionResult;

      if (!response.ok || !payload.ok) {
        setMessage(payload.message ?? betaRedemptionMessage(payload));
        return;
      }

      setLocalBetaAccessMarker();
      setIsUnlocked(true);
    } catch {
      setMessage('Could not unlock beta access right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUnlocked) return <>{children}</>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">PeptideOS</p>
              <p className="text-xs text-muted-foreground">Private beta</p>
            </div>
          </div>
          <div className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Invite only
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Ten-seat beta
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal">Enter beta access.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Use your email and beta key. That is all testers need to open PeptideOS.
            </p>
          </div>

          <form className="space-y-5 rounded-[18px] border border-border bg-card/95 p-5 shadow-xl" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="beta-email">Email</Label>
              <Input
                ref={emailRef}
                id="beta-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beta-invite">Beta key</Label>
              <Input
                ref={codeRef}
                id="beta-invite"
                name="betaKey"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Paste or type beta key"
              />
            </div>

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Unlocking...' : 'Enter PeptideOS'}
              <ArrowRight className="size-4" />
            </Button>

            {message ? (
              <div role="status" className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                {message}
              </div>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
