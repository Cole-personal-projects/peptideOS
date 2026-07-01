"use client";

import Link from 'next/link';
import { motion, type Transition, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Database,
  FlaskConical,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarqueeTicker } from '@/components/ui/marquee-ticker';
import { APP_COPYRIGHT, APP_RELEASE_TARGET, APP_VERSION } from '@/lib/app-metadata';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
  completedOnboarding?: boolean;
}

const cockpitCards = [
  { label: 'Due', value: '10:00 PM', tone: 'bg-primary text-primary-foreground' },
  { label: 'Stock', value: '12 doses', tone: 'bg-chart-2/15 text-chart-2' },
  { label: 'Labs', value: '3 flags', tone: 'bg-chart-3/15 text-chart-3' },
];

const features = [
  {
    title: 'Protocols',
    body: 'See what is due, what changed, and what was logged without digging through screens.',
    icon: Activity,
    stat: 'Daily cockpit',
  },
  {
    title: 'Stock room',
    body: 'Track active containers, remaining coverage, low stock, and expiring inventory.',
    icon: PackageCheck,
    stat: 'Vials + batches',
  },
  {
    title: 'Labs',
    body: 'Import results, review marker trends, compare reports, and keep assay context visible.',
    icon: BarChart3,
    stat: 'Trend view',
  },
  {
    title: 'Estimated remaining',
    body: 'Preview source-backed first-order decay assumptions without dose or safety claims.',
    icon: FlaskConical,
    stat: 'Half-life model',
  },
  {
    title: 'Peppi operations',
    body: 'Turn text into structured drafts and summarize records with explicit confirmation.',
    icon: MessageCircle,
    stat: 'Review first',
  },
  {
    title: 'Data ownership',
    body: 'Local-first records, export/import, and optional cloud sync when you choose it.',
    icon: Database,
    stat: 'No paywall',
  },
];

function ProtocolCockpitHero() {
  const reduceMotion = useReducedMotion();
  const lineTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.4 };
  const pulseTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' as const };

  return (
    <div
      aria-label="Animated protocol cockpit preview"
      data-testid="protocol-cockpit-hero"
      className="relative mx-auto w-full max-w-[420px]"
    >
      <div className="absolute -inset-3 rounded-[2rem] border border-primary/15 bg-primary/5 blur-xl" />
      <motion.div
        className="relative overflow-hidden rounded-[2rem] border bg-card shadow-2xl shadow-primary/10"
        initial={reduceMotion ? false : { y: 10, opacity: 0 }}
        animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="border-b bg-secondary/35 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Protocol cockpit
              </p>
              <p className="mt-1 text-sm font-semibold">Tonight</p>
            </div>
            <div className="flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              <span className="size-2 rounded-full bg-chart-2" />
              Local
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            {cockpitCards.map((card, index) => (
              <motion.div
                key={card.label}
                className="rounded-xl border bg-background p-3"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index, duration: 0.4 }}
              >
                <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
                <div className={`mt-2 rounded-lg px-2 py-1 text-center text-xs font-semibold ${card.tone}`}>
                  {card.value}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl border bg-background p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Estimated remaining</p>
                <p className="text-xs text-muted-foreground">Model: first-order decay</p>
              </div>
              <Sparkles className="size-4 text-primary" />
            </div>
            <svg viewBox="0 0 320 126" className="h-auto w-full" role="img" aria-label="Estimated remaining curve">
              <defs>
                <linearGradient id="heroCurveFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <g className="text-border">
                <path d="M20 102H300" stroke="currentColor" strokeWidth="1" />
                <path d="M20 74H300" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
                <path d="M20 46H300" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
              </g>
              <path
                d="M20 104 C58 50 78 52 102 76 C130 106 156 26 190 54 C218 78 238 82 300 38 L300 104 Z"
                fill="url(#heroCurveFill)"
                className="text-primary"
              />
              <motion.path
                d="M20 104 C58 50 78 52 102 76 C130 106 156 26 190 54 C218 78 238 82 300 38"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-primary"
                initial={reduceMotion ? false : { pathLength: 0.2 }}
                animate={reduceMotion ? undefined : { pathLength: [0.2, 1, 1] }}
                transition={lineTransition}
              />
              {[56, 148, 226].map((x, index) => (
                <motion.g
                  key={x}
                  animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
                  transition={{ ...pulseTransition, delay: index * 0.28 }}
                >
                  <line x1={x} y1="28" x2={x} y2="108" stroke="currentColor" strokeWidth="1" className="text-chart-3" />
                  <circle cx={x} cy={index === 1 ? 45 : 72} r="5" fill="currentColor" className="text-chart-3" />
                </motion.g>
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
            <div className="rounded-2xl border bg-background p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium">
                <span>Stock rail</span>
                <span className="text-chart-2">covered</span>
              </div>
              <div className="flex items-end gap-2">
                {[72, 56, 34, 18].map((height, index) => (
                  <motion.div
                    key={height}
                    className="flex-1 rounded-t-lg bg-chart-2/70"
                    style={{ height }}
                    initial={reduceMotion ? false : { scaleY: 0.45 }}
                    animate={reduceMotion ? undefined : { scaleY: [0.75, 1, 0.9] }}
                    transition={{ ...pulseTransition, delay: index * 0.18 }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-background p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                <MessageCircle className="size-3.5 text-primary" />
                Peppi
              </div>
              <p className="text-xs leading-snug text-muted-foreground">Draft ready. Review before saving.</p>
              <div className="mt-3 h-1.5 rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={reduceMotion ? false : { width: '42%' }}
                  animate={reduceMotion ? undefined : { width: ['42%', '78%', '58%'] }}
                  transition={pulseTransition}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureRail() {
  return (
    <section aria-labelledby="features-title" className="mx-auto w-full max-w-6xl px-5 py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Operational workspace</p>
          <h2 id="features-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
            Graphic surfaces for daily tracking.
          </h2>
        </div>
        <div className="hidden rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:block">
          Less text. More signal.
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ title, body, icon: Icon, stat }) => (
          <article key={title} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                {stat}
              </span>
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function InstallInstructions() {
  return (
    <section id="install" aria-labelledby="install-title" className="border-y bg-secondary/30">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Install PeptideOS</p>
          <h2 id="install-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
            Add it to your phone like an app.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            PeptideOS works in the browser. Installing the PWA gives you a cleaner full-screen home screen entry.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              <h3 className="font-semibold">iPhone or iPad</h3>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><Share className="mt-0.5 size-4 text-primary" /> Open in Safari and tap Share.</li>
              <li className="flex gap-3"><Upload className="mt-0.5 size-4 text-primary" /> Choose Add to Home Screen.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 text-primary" /> Tap Add.</li>
            </ol>
          </article>
          <article className="rounded-2xl border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              <h3 className="font-semibold">Android</h3>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3"><ChevronDown className="mt-0.5 size-4 text-primary" /> Open in Chrome.</li>
              <li className="flex gap-3"><Upload className="mt-0.5 size-4 text-primary" /> Use the install prompt or menu.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 text-primary" /> Confirm Install app or Add to Home screen.</li>
            </ol>
          </article>
        </div>
      </div>
    </section>
  );
}

export function WelcomeScreen({ onGetStarted, completedOnboarding = false }: WelcomeScreenProps) {
  const ctaLabel = completedOnboarding ? 'Open PeptideOS' : 'Start local setup';

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/welcome" className="flex items-center gap-2" aria-label="PeptideOS welcome">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <FlaskConical className="size-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">PeptideOS</span>
        </Link>
        <div className="flex items-center gap-3">
          <a href="#install" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
            Install
          </a>
          <Link href="/more/settings?entry=signin" className="text-sm font-medium text-primary">
            Sign in
          </Link>
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-14 pt-8 md:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] md:pb-20 md:pt-14">
        <div className="max-w-2xl">
<MarqueeTicker className="mb-5 max-w-xl" />
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Private research tracking. Local-first by default.
          </div>
          <h1 className="text-5xl font-semibold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
            PeptideOS
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            A private protocol cockpit for doses, inventory, labs, and estimated remaining amount.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {completedOnboarding ? (
              <Button asChild size="lg" className="h-12 px-6">
                <Link href="/">
                  {ctaLabel}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" className="h-12 px-6" onClick={onGetStarted}>
                {ctaLabel}
                <ArrowRight className="size-4" />
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="h-12 px-6">
              <a href="#install">Install on device</a>
            </Button>
          </div>
          <div className="mt-7 grid max-w-xl gap-2 sm:grid-cols-3">
            {[
              { icon: LockKeyhole, label: 'Local records' },
              { icon: Cloud, label: 'Optional sync' },
              { icon: ShieldCheck, label: 'No dose advice' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium">
                <Icon className="size-4 text-primary" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <ProtocolCockpitHero />
      </section>

      <FeatureRail />
      <InstallInstructions />

<footer className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
<div className="space-y-1">
<p>Research tracking only. Not medical advice, diagnosis, dosing guidance, or safety guidance.</p>
<p>{APP_COPYRIGHT} - Beta v{APP_VERSION} - Initial release target v{APP_RELEASE_TARGET}</p>
</div>
<Link href="/library" className="font-medium text-primary">
Browse reference library
</Link>
      </footer>
    </main>
  );
}
