"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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

export function BetaAccessGate({ children }: { children: ReactNode }) {
  const enabled = isBetaGateEnabled();
  const { client, status, user } = useAuth();
  const [accessState, setAccessState] = useState<BetaAccessState>(enabled ? 'loading' : 'disabled');
  const [email, setEmail] = useState(() => user?.email ?? '');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAccess = useCallback(async () => {
    if (!enabled) {
      setAccessState('disabled');
      return;
    }

    const betaStatus = await fetch('/api/beta/redeem', { method: 'GET' })
      .then((response) => response.json() as Promise<{ ok: boolean; email?: string | null }>)
      .catch(() => null);

    if (betaStatus?.ok) {
      setAccessState('granted');
      return;
    }

    if (status === 'loading') {
      setAccessState('loading');
      return;
    }

    if (status === 'signed-in' && user && client) {
      const { data } = await client
        .from('user_entitlements')
        .select('entitlement, active, starts_at, ends_at')
        .eq('user_id', user.id)
        .eq('entitlement', BETA_ACCESS_ENTITLEMENT);

      if (hasActiveBetaAccess((data ?? []) as BetaEntitlement[])) {
        setAccessState('granted');
        return;
      }
    }

    setAccessState('locked');
  }, [client, enabled, status, user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAccess();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAccess]);

  const canSubmit = useMemo(
    () => email.trim().includes('@') && normalizeInviteCode(inviteCode).length >= 4 && !isSubmitting,
    [email, inviteCode, isSubmitting],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          inviteCode: normalizeInviteCode(inviteCode),
        }),
      });
      const payload = (await response.json()) as BetaRedemptionResult;
      setMessage(payload.message ?? betaRedemptionMessage(payload));

      if (response.ok && payload.ok) {
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
              {accessState === 'loading' ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="mx-auto size-10 animate-pulse rounded-full bg-primary/25" />
                  <p className="text-sm text-muted-foreground">Checking access...</p>
                </div>
              ) : (
                <>
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
                      placeholder="POS-XXXXX-XXXXX-XXXXX"
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleSubmit();
                      }}
                    />
                  </div>
                  <Button className="h-11 w-full" onClick={handleSubmit} disabled={!canSubmit}>
                    <KeyRound className="size-4" />
                    {isSubmitting ? 'Unlocking...' : 'Enter PeptideOS'}
                    <ArrowRight className="size-4" />
                  </Button>
                </>
              )}

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
