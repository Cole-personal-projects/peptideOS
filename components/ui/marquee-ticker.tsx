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
  const rowOne = words;
  const rowTwo = [...words].reverse();

  useEffect(() => {
    const update = () => setPaused(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <section
      aria-label={label}
      className={cn('c06-marquee overflow-hidden rounded-[18px] border bg-card py-2 shadow-sm', className)}
      data-paused={paused ? 'true' : 'false'}
    >
      <TickerRow words={rowOne} tone="a" />
      <TickerRow words={rowTwo} tone="b" />
      <style jsx>{`
        .c06-marquee {
          background:
            radial-gradient(circle at 18% 0%, hsl(var(--primary) / 0.2), transparent 38%),
            linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary) / 0.42));
        }

        .c06-row {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
        }

        .c06-track {
          display: inline-block;
          min-width: max-content;
          will-change: transform;
          animation: c06-scroll-left 16s linear infinite;
          animation-play-state: running;
        }

        .c06-track--b {
          animation-name: c06-scroll-right;
          animation-duration: 20s;
        }

        .c06-marquee[data-paused='true'] .c06-track {
          animation-play-state: paused;
        }

        .c06-word {
          display: inline-block;
          padding: 0 0.35em;
          font-size: clamp(1.4rem, 8vw, 3.8rem);
          font-weight: 800;
          letter-spacing: 0;
          line-height: 0.95;
        }

        .c06-track--a .c06-word {
          color: hsl(var(--primary));
        }

        .c06-track--b .c06-word {
          color: hsl(var(--chart-3));
        }

        .c06-dot {
          color: hsl(var(--chart-4));
        }

        @keyframes c06-scroll-left {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        @keyframes c06-scroll-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .c06-track {
            animation: none;
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}

function TickerRow({ words, tone }: { words: string[]; tone: 'a' | 'b' }) {
  const unit = (
    <>
      {words.map((word) => (
        <span key={`${tone}-${word}`} className="c06-word">
          {word}
          <span className="c06-dot" aria-hidden="true">
            {' '}
            &bull;
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div className="c06-row" aria-hidden="true">
      <div className={`c06-track c06-track--${tone}`}>
        {unit}
        {unit}
      </div>
    </div>
  );
}
