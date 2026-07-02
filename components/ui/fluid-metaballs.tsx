"use client";

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type FluidMetaballsProps = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

const sizeClass = {
  sm: 'h-8 w-8 [--c11-ball:12px] [--c11-travel:11px]',
  md: 'h-14 w-14 [--c11-ball:18px] [--c11-travel:16px]',
  lg: 'h-20 w-20 [--c11-ball:26px] [--c11-travel:24px]',
};

export function FluidMetaballs({ label = 'Loading', className, size = 'md', showLabel = false }: FluidMetaballsProps) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const update = () => setPaused(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status" aria-label={label}>
      <span className={cn('c11-container relative block shrink-0 overflow-visible bg-transparent', sizeClass[size])} data-paused={paused ? 'true' : 'false'}>
        <span className="c11-glow" aria-hidden="true" />
        <span className="c11-ball c11-ball--1" />
        <span className="c11-ball c11-ball--2" />
        <span className="c11-ball c11-ball--3" />
        <style jsx>{`
          .c11-glow,
          .c11-ball {
            position: absolute;
            border-radius: 999px;
            will-change: transform, opacity;
          }

          .c11-glow {
            inset: 20%;
            background: hsl(var(--primary) / 0.18);
            filter: blur(10px);
            animation: c11-pulse 1.35s ease-in-out infinite alternate;
          }

          .c11-ball {
            width: var(--c11-ball);
            height: var(--c11-ball);
            top: calc(50% - (var(--c11-ball) / 2));
            left: calc(50% - (var(--c11-ball) / 2));
            background: hsl(var(--primary));
            box-shadow: 0 0 14px hsl(var(--primary) / 0.48);
            animation: c11-move-a 1.6s cubic-bezier(0.77, 0, 0.175, 1) infinite;
            animation-play-state: running;
            mix-blend-mode: screen;
          }

          .c11-ball--2 {
            background: hsl(var(--chart-3));
            box-shadow: 0 0 14px hsl(var(--chart-3) / 0.48);
            animation-name: c11-move-b;
          }

          .c11-ball--3 {
            width: calc(var(--c11-ball) * 0.72);
            height: calc(var(--c11-ball) * 0.72);
            top: calc(50% - (var(--c11-ball) * 0.36));
            left: calc(50% - (var(--c11-ball) * 0.36));
            background: hsl(var(--chart-4));
            box-shadow: 0 0 14px hsl(var(--chart-4) / 0.48);
            animation-name: c11-move-c;
          }

          .c11-container[data-paused='true'] .c11-ball,
          .c11-container[data-paused='true'] .c11-glow {
            animation-play-state: paused;
          }

          @keyframes c11-move-a {
            0%,
            100% {
              transform: translateX(calc(var(--c11-travel) * -1)) scale(0.92);
            }
            50% {
              transform: translateX(var(--c11-travel)) scale(1.08);
            }
          }

          @keyframes c11-move-b {
            0%,
            100% {
              transform: translateX(var(--c11-travel)) scale(1.04);
            }
            50% {
              transform: translateX(calc(var(--c11-travel) * -1)) scale(0.9);
            }
          }

          @keyframes c11-move-c {
            0%,
            100% {
              transform: translateY(calc(var(--c11-travel) * -1)) scale(0.9);
              opacity: 0.85;
            }
            50% {
              transform: translateY(var(--c11-travel)) scale(1.12);
              opacity: 1;
            }
          }

          @keyframes c11-pulse {
            from {
              opacity: 0.55;
              transform: scale(0.86);
            }
            to {
              opacity: 1;
              transform: scale(1.16);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .c11-ball,
            .c11-glow {
              animation: none;
            }
          }
        `}</style>
      </span>
      {showLabel ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}
