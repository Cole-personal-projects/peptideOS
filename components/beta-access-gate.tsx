"use client";

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BETA_ACCESS_ENTITLEMENT,
  betaRedemptionMessage,
  hasActiveBetaAccess,
  isBetaGateEnabled,
  normalizeInviteCode,
  type BetaAccessState,
  type BetaEntitlement,
  type BetaRedemptionResult,
} from '@/lib/beta-access';
import { useAuth } from '@/lib/auth-context';

const BETA_ACCESS_LOCAL_KEY = 'peptideos.betaAccessPassed';
const BETA_ACCESS_LOCAL_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180;

interface LocalBetaAccessMarker {
  passed: true;
  expiresAt: number;
}

function hasLocalBetaAccessMarker() {
  if (typeof window === 'undefined') return false;

  try {
    const marker = JSON.parse(window.localStorage.getItem(BETA_ACCESS_LOCAL_KEY) ?? 'null') as Partial<LocalBetaAccessMarker> | null;
    if (marker?.passed === true && typeof marker.expiresAt === 'number' && marker.expiresAt > Date.now()) return true;
  } catch {
    // Fall through and clear malformed legacy marker.
  }

  clearLocalBetaAccessMarker();
  return false;
}

function setLocalBetaAccessMarker() {
  const marker: LocalBetaAccessMarker = {
    passed: true,
    expiresAt: Date.now() + BETA_ACCESS_LOCAL_MAX_AGE_MS,
  };
  window.localStorage.setItem(BETA_ACCESS_LOCAL_KEY, JSON.stringify(marker));
}

function clearLocalBetaAccessMarker() {
  window.localStorage.removeItem(BETA_ACCESS_LOCAL_KEY);
}

export function BetaAccessGate({ children }: { children: ReactNode }) {
  const enabled = isBetaGateEnabled();
  const { client, status, user } = useAuth();
  const [accessState, setAccessState] = useState<BetaAccessState>(() => {
    if (!enabled) return 'disabled';
    return hasLocalBetaAccessMarker() ? 'granted' : 'locked';
  });
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkExistingAccess = useCallback(async () => {
    if (!enabled) {
      setAccessState('disabled');
      return;
    }

    const betaStatus = await fetch('/api/beta/redeem', { method: 'GET' })
      .then((response) => response.json() as Promise<{ ok: boolean }>)
      .catch(() => null);

    if (betaStatus?.ok) {
      setLocalBetaAccessMarker();
      setAccessState('granted');
      return;
    }

    clearLocalBetaAccessMarker();

    if (status === 'signed-in' && user && client) {
      const { data } = await client
        .from('user_entitlements')
        .select('entitlement, active, starts_at, ends_at')
        .eq('user_id', user.id)
        .eq('entitlement', BETA_ACCESS_ENTITLEMENT);

      if (hasActiveBetaAccess((data ?? []) as BetaEntitlement[])) {
        setLocalBetaAccessMarker();
        setAccessState('granted');
      }
    }
  }, [client, enabled, status, user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkExistingAccess();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkExistingAccess]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedInviteCode = normalizeInviteCode(inviteCode);

    if (!trimmedEmail || !normalizedInviteCode) {
      setMessage('Enter your email and beta key.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          inviteCode: normalizedInviteCode,
        }),
      });
      const payload = (await response.json()) as BetaRedemptionResult;
      setMessage(payload.message ?? betaRedemptionMessage(payload));

      if (response.ok && payload.ok) {
        setLocalBetaAccessMarker();
        setInviteCode('');
        setAccessState('granted');
      }
    } catch {
      setMessage('Could not unlock beta access right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enabled || accessState === 'disabled' || accessState === 'granted') return <>{children}</>;

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

          <Card className="rounded-[18px] border-border bg-card/95 shadow-xl">
            <CardContent className="space-y-5 p-5">
              <div className="grid gap-2">
                <Label htmlFor="beta-email">Email</Label>
                <Input
                  id="beta-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beta-invite">Beta key</Label>
                <Input
                  id="beta-invite"
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Paste or type beta key"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleSubmit();
                  }}
                />
              </div>
              <Button className="h-11 w-full" onClick={handleSubmit} disabled={isSubmitting}>
                <KeyRound className="size-4" />
                {isSubmitting ? 'Unlocking...' : 'Enter PeptideOS'}
                <ArrowRight className="size-4" />
              </Button>

              {message ? (
                <div role="status" className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                  {message}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
