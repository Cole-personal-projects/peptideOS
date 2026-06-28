import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { BetaAccessForm } from '@/components/beta-access-form';
import { betaRedemptionMessage, type BetaRedemptionReason } from '@/lib/beta-access';
import { getBetaCookieSecret, safeBetaNextPath } from '@/lib/beta-gate';
import { BETA_SESSION_COOKIE, verifyBetaSessionCookie } from '@/lib/beta-session';

interface BetaPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BetaPage({ searchParams }: BetaPageProps) {
  const params = await searchParams;
  const error = readSingleParam(params.error);
  const requestedNext = safeBetaNextPath(readSingleParam(params.next));
  const next = requestedNext === '/' ? '/welcome' : requestedNext;
  const message = error ? betaRedemptionMessage({ ok: false, reason: error as BetaRedemptionReason }) : '';
  const cookieStore = await cookies();
  const secret = getBetaCookieSecret();
  const session = secret
    ? await verifyBetaSessionCookie(cookieStore.get(BETA_SESSION_COOKIE)?.value, secret)
    : null;

  if (session) {
    redirect(next);
  }

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
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Use the email you want tied to this beta and paste your beta key.
            </p>
          </div>

          <div className="rounded-[28px] border bg-card p-5 shadow-xl shadow-primary/5">
            <BetaAccessForm nextPath={next} initialMessage={message} />
          </div>
        </section>
      </div>
    </main>
  );
}

function readSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}
