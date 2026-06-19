"use client";

import Link from 'next/link';
import { FlaskConical, MessageCircle, PackageCheck, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  completedOnboarding?: boolean;
}

function WelcomeGraphic() {
  return (
    <div aria-label="Animated Peppi science graphic" className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border bg-secondary/20 p-5 shadow-2xl shadow-primary/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_24%,rgba(124,92,255,0.24),transparent_34%),radial-gradient(circle_at_72%_72%,rgba(20,184,166,0.18),transparent_32%)]" />
      <div className="relative h-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 280" role="presentation" aria-hidden="true">
          <path
            d="M42 144 C68 74 132 50 184 70 C238 92 252 154 220 206 C185 260 102 246 62 196"
            fill="none"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="2"
          />
          <path
            d="M42 144 C68 74 132 50 184 70 C238 92 252 154 220 206 C185 260 102 246 62 196"
            fill="none"
            stroke="rgba(124,92,255,0.82)"
            strokeLinecap="round"
            strokeWidth="3"
            strokeDasharray="44 168"
            className="animate-[pulse_2.8s_ease-in-out_infinite]"
          />
          <path
            d="M66 94 C118 118 99 173 151 178 C190 182 194 128 236 144"
            fill="none"
            stroke="rgba(20,184,166,0.46)"
            strokeLinecap="round"
            strokeWidth="2"
            strokeDasharray="6 12"
          />
        </svg>
        {[
          ['left-[13%] top-[45%] size-4 bg-primary shadow-[0_0_24px_rgba(124,92,255,0.65)]', ''],
          ['left-[31%] top-[20%] size-5 bg-chart-2 shadow-[0_0_24px_rgba(20,184,166,0.55)]', '[animation-delay:220ms]'],
          ['right-[18%] top-[27%] size-4 bg-chart-4 shadow-[0_0_24px_rgba(251,191,36,0.45)]', '[animation-delay:480ms]'],
          ['right-[14%] bottom-[28%] size-5 bg-primary shadow-[0_0_24px_rgba(124,92,255,0.6)]', '[animation-delay:720ms]'],
          ['left-[26%] bottom-[18%] size-4 bg-chart-2 shadow-[0_0_24px_rgba(20,184,166,0.5)]', '[animation-delay:960ms]'],
        ].map(([classes, delay], index) => (
          <div key={index} className={`absolute animate-pulse rounded-full ${classes} ${delay}`} />
        ))}

        <div className="absolute left-1/2 top-[46%] flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/35 bg-background/80 shadow-[0_0_44px_rgba(124,92,255,0.28)] backdrop-blur">
          <div className="flex size-20 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageCircle className="size-7" />
            <span className="mt-1 text-xs font-semibold">Peppi</span>
          </div>
        </div>

        <div className="absolute left-4 top-5 rounded-lg border bg-background/75 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-medium">
            <FlaskConical className="size-4 text-chart-2" />
            Research log
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 gap-2">
          {[
            { label: 'Inventory', icon: PackageCheck },
            { label: 'Dose math', icon: Calculator },
            { label: 'Peppi', icon: MessageCircle },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="rounded-lg border bg-background/80 p-2 text-center backdrop-blur">
              <Icon className="mx-auto mb-1 size-4 text-primary" />
              <p className="text-[11px] font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WelcomeScreen({ onGetStarted, completedOnboarding = false }: WelcomeScreenProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-between px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FlaskConical className="size-5" />
            </div>
            <span className="text-sm font-semibold tracking-wide">PeptideOS</span>
          </div>
          <Link href="/more/settings?entry=signin" className="text-sm font-medium text-primary">
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 md:grid-cols-[1fr_360px] md:py-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">Private research tracking</p>
              <h1 className="max-w-xl text-5xl font-bold leading-none tracking-normal sm:text-6xl">
                PeptideOS
              </h1>
              <p className="max-w-lg text-lg text-muted-foreground">
                Your peptide research operating system.
              </p>
            </div>

            <div className="md:hidden">
              <WelcomeGraphic />
            </div>

            <div className="grid max-w-xl gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="font-medium text-foreground">Inventory</p>
                <p className="mt-1">Track kits, vials, and active containers.</p>
              </div>
              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="font-medium text-foreground">Schedules</p>
                <p className="mt-1">Plan protocols and keep dose history clean.</p>
              </div>
              <div className="rounded-lg border bg-secondary/30 p-3">
                <p className="font-medium text-foreground">Peppi</p>
                <p className="mt-1">Use AI to speed up app workflows.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {completedOnboarding ? (
                <Button asChild size="lg" className="h-12 px-7">
                  <Link href="/">Continue locally</Link>
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-7" onClick={onGetStarted}>
                  Get started
                </Button>
              )}
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <Link href="/library">Browse library</Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:block">
            <WelcomeGraphic />
          </div>
        </section>

        <footer className="border-t py-4 text-xs text-muted-foreground">
          For research tracking only. Not medical advice.
        </footer>
      </div>
    </main>
  );
}
