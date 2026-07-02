"use client";

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type MarqueeTickerProps = {
  words?: string[];
  className?: string;
  label?: string;
};

const defaultWords = ['PeptideOS', 'Optimize', 'Grow', 'Live'];

export function MarqueeTicker({ words = defaultWords, className, label = 'PeptideOS welcome banner' }: MarqueeTickerProps) {
  const [paused, setPaused] = useState(false);
  const rowOne = buildTickerWords(words);
  const rowTwo = buildTickerWords([...words].reverse());

  useEffect(() => {
    const update = () => setPaused(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <section
      aria-label={label}
      className={cn('c06-marquee relative isolate overflow-hidden rounded-[18px] border bg-card py-2 shadow-sm', className)}
      data-paused={paused ? 'true' : 'false'}
    >
      <TickerRow words={rowOne} tone="a" />
      <TickerRow words={rowTwo} tone="b" />
      <style jsx>{`
        .c06-marquee {
          background:
            radial-gradient(circle at 18% 0%, hsl(var(--primary) / 0.2), transparent 38%),
            linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary) / 0.55));
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
        }

        .c06-marquee[data-paused='true'] .c06-track {
          animation-play-state: paused;
        }

        @keyframes c06-marquee-left {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-33.333%, 0, 0);
          }
        }

        @keyframes c06-marquee-right {
          from {
            transform: translate3d(-33.333%, 0, 0);
          }
          to {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .c06-track {
            animation: none !important;
            transform: translate3d(-12%, 0, 0);
          }
        }
      `}</style>
    </section>
  );
}

function TickerRow({ words, tone }: { words: string[]; tone: 'a' | 'b' }) {
  return (
    <div className="c06-row overflow-hidden whitespace-nowrap leading-none" aria-hidden="true">
      <div
        className={cn(
          'c06-track inline-flex min-w-max items-center gap-4 py-1 text-[13px] font-semibold tracking-normal will-change-transform',
          tone === 'a' ? 'animate-[c06-marquee-left_16s_linear_infinite] text-foreground' : 'animate-[c06-marquee-right_18s_linear_infinite] text-muted-foreground',
        )}
      >
        <TickerUnit words={words} />
        <TickerUnit words={words} />
        <TickerUnit words={words} />
      </div>
    </div>
  );
}

function TickerUnit({ words }: { words: string[] }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap pr-4">
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap">
          <span>{word}</span>
          <span className="text-primary" aria-hidden="true">
            &bull;
          </span>
        </span>
      ))}
    </span>
  );
}

function buildTickerWords(words: string[]) {
  return words.length > 0 ? words : defaultWords;
}
