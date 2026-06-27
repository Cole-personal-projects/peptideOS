"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

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
  const { client, config, getAccessToken, signInWithEmail, status, user, verifyEmailCode } = useAuth();
  const [accessState, setAccessState] = useState<BetaAccessState>(enabled ? 'loading' : 'disabled');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const [action, setAction] = useState<'email' | 'code' | 'redeem' | null>(null);

  const signedInEmail = user?.email ?? '';
  const canRedeem = Boolean(user && inviteCode.trim().length >= 4);

  const loadEntitlements = useCallback(async () => {
    if (!enabled) {
      setAccessState('disabled');
      return;
    }

    if (!config.enabled || !client) {
      setAccessState('error');
      setMessage('Beta access is not configured on this device.');
      return;
    }

    if (status === 'loading') {
      setAccessState('loading');
      return;
    }

    if (status !== 'signed-in' || !user) {
      setAccessState('signed-out');
      return;
    }

    setAccessState('loading');
    const { data, error } = await client
      .from('user_entitlements')
      .select('entitlement,active,starts_at,ends_at')
      .eq('entitlement', BETA_ACCESS_ENTITLEMENT)
      .eq('active', true);

    if (error) {
      setAccessState('locked');
      setMessage('Enter your beta invite code to unlock this device.');
      return;
    }

    setAccessState(hasActiveBetaAccess((data ?? []) as BetaEntitlement[]) ? 'granted' : 'locked');
    setMessage('');
  }, [client, config.enabled, enabled, status, user]);

  useEffect(() => {
    void Promise.resolve().then(loadEntitlements);
  }, [loadEntitlements]);

  const handleEmail = async () => {
    setAction('email');
    setMessage('');
    try {
      const result = await signInWithEmail(email);
      setMessage(result.message);
    } finally {
      setAction(null);
    }
  };

  const handleVerification = async () => {
    setAction('code');
    setMessage('');
    try {
      const result = await verifyEmailCode(email || signedInEmail, verificationCode);
      setMessage(result.message);
      if (result.ok) await loadEntitlements();
    } finally {
      setAction(null);
    }
  };

  const handleRedeem = async () => {
    if (!canRedeem) return;
    setAction('redeem');
    setMessage('');
    try {
      const token = await getAccessToken();
      if (!token) {
        setMessage('Your sign-in expired. Sign in again to redeem access.');
        return;
      }

      const response = await fetch('/api/beta/redeem', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: normalizeInviteCode(inviteCode) }),
      });
      const payload = (await response.json()) as BetaRedemptionResult;
      setMessage(payload.message ?? betaRedemptionMessage(payload));
      if (response.ok && payload.ok) {
        setInviteCode('');
        await loadEntitlements();
      }
    } catch {
      setMessage('Could not redeem beta access right now.');
    } finally {
      setAction(null);
    }
  };

  const showSignIn = accessState === 'signed-out';
  const showRedeem = accessState === 'locked';
  const statusLabel = useMemo(() => {
    if (accessState === 'loading') return 'Checking access';
    if (accessState === 'signed-out') return 'Account required';
    if (accessState === 'locked') return 'Invite required';
    if (accessState === 'error') return 'Setup required';
    return 'Access granted';
  }, [accessState]);

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
            {statusLabel}
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10">
          <div className="mb-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Ten-seat beta access
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal">Unlock your beta cockpit.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              PeptideOS is invite-only while the workflow hardens. Sign in, redeem an invite once, and access stays attached to your account.
            </p>
          </div>

          <Card className="rounded-[18px] border-border bg-card/95 shadow-xl">
            <CardContent className="space-y-5 p-5">
              {accessState === 'loading' ? (
                <div className="space-y-4 py-6 text-center">
                  <div className="mx-auto size-10 animate-pulse rounded-full bg-primary/25" />
                  <p className="text-sm text-muted-foreground">Checking account access...</p>
                </div>
              ) : null}

              {accessState === 'error' ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Beta gate is enabled, but auth is not configured.</p>
                  <p className="text-sm text-muted-foreground">Set Supabase public env vars and the server service-role secret before inviting testers.</p>
                </div>
              ) : null}

              {showSignIn ? (
                <div className="space-y-4">
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
                  <Button className="w-full" onClick={handleEmail} disabled={action === 'email'}>
                    <Mail className="size-4" />
                    {action === 'email' ? 'Sending...' : 'Send sign-in code'}
                  </Button>
                  <div className="grid gap-2">
                    <Label htmlFor="beta-code">Verification code</Label>
                    <Input
                      id="beta-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Paste email code"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value)}
                    />
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleVerification} disabled={action === 'code'}>
                    <ArrowRight className="size-4" />
                    {action === 'code' ? 'Verifying...' : 'Verify sign-in'}
                  </Button>
                </div>
              ) : null}

              {showRedeem ? (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-medium">{signedInEmail}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="beta-invite">Invite code</Label>
                    <Input
                      id="beta-invite"
                      autoCapitalize="characters"
                      autoComplete="off"
                      placeholder="PEPTIDEOS-BETA"
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleRedeem} disabled={!canRedeem || action === 'redeem'}>
                    <KeyRound className="size-4" />
                    {action === 'redeem' ? 'Unlocking...' : 'Redeem invite'}
                  </Button>
                </div>
              ) : null}

              {message ? (
                <div role="status" className="rounded-xl border bg-background p-3 text-sm text-muted-foreground">
                  {message}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
            {['Account-bound', 'Audited', 'Paid-ready'].map((item) => (
              <div key={item} className="rounded-xl border bg-card px-2 py-3 font-medium text-muted-foreground">
                <CheckCircle2 className="mx-auto mb-1 size-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
