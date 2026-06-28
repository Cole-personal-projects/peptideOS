import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { betaRedemptionMessage, type BetaRedemptionReason } from '@/lib/beta-access';
import { safeBetaNextPath } from '@/lib/beta-gate';

interface BetaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BetaPage({ searchParams }: BetaPageProps) {
  const params = await searchParams;
  const error = readSingleParam(params.error);
  const next = safeBetaNextPath(readSingleParam(params.next));
  const message = error
    ? betaRedemptionMessage({ ok: false, reason: error as BetaRedemptionReason })
    : '';

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
              Closed beta
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal">Enter beta access.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Enter your email and beta key once. PeptideOS opens directly on this device after access is confirmed.
            </p>
          </div>

          <form
            action="/api/beta/redeem"
            method="post"
            className="space-y-5 rounded-[18px] border border-border bg-card/95 p-5 shadow-xl"
          >
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-2">
              <Label htmlFor="beta-email">Email</Label>
              <Input
                id="beta-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="beta-invite">Beta key</Label>
              <Input
                id="beta-invite"
                name="inviteCode"
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Paste or type beta key"
                required
              />
            </div>

            <Button type="submit" className="h-11 w-full transition-transform active:scale-[0.98]">
              Enter PeptideOS
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

function readSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
