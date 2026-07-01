"use client";

import { useEffect, useId, useState } from 'react';

import { cn } from '@/lib/utils';

type FluidMetaballsProps = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
};

const sizeClass = {
  sm: 'h-8 w-8 [--c11-ball:12px] [--c11-travel:11px] [--c11-blur:5px]',
  md: 'h-14 w-14 [--c11-ball:18px] [--c11-travel:16px] [--c11-blur:7px]',
  lg: 'h-20 w-20 [--c11-ball:26px] [--c11-travel:24px] [--c11-blur:9px]',
};

export function FluidMetaballs({ label = 'Loading', className, size = 'md', showLabel = false }: FluidMetaballsProps) {
  const id = useId().replaceAll(':', '');
  const [paused, setPaused] = useState(false);
  const filterId = `c11-filter-${id}`;

  useEffect(() => {
    const update = () => setPaused(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status" aria-label={label}>
      <span className={cn('c11-container relative block shrink-0 bg-transparent', sizeClass[size])} data-paused={paused ? 'true' : 'false'}>
        <span className="c11-ball c11-ball--1" />
        <span className="c11-ball c11-ball--2" />
        <span className="c11-ball c11-ball--3" />
        <svg className="pointer-events-none absolute size-0" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="var(--c11-blur)" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="gooey" />
              <feBlend in="SourceGraphic" in2="gooey" />
            </filter>
          </defs>
        </svg>
        <style jsx>{`
          .c11-container {
            filter: url(#${filterId});
          }

          .c11-ball {
            position: absolute;
            width: var(--c11-ball);
            height: var(--c11-ball);
            border-radius: 999px;
            top: calc(50% - (var(--c11-ball) / 2));
            left: calc(50% - (var(--c11-ball) / 2));
            background: hsl(var(--primary));
            box-shadow: 0 0 10px hsl(var(--primary) / 0.45);
            animation: c11-move-a 3s cubic-bezier(0.77, 0, 0.175, 1) infinite;
            animation-play-state: running;
          }

          .c11-ball--2 {
            background: hsl(var(--chart-3));
            box-shadow: 0 0 10px hsl(var(--chart-3) / 0.45);
            animation-name: c11-move-b;
          }

          .c11-ball--3 {
            width: calc(var(--c11-ball) * 0.68);
            height: calc(var(--c11-ball) * 0.68);
            top: calc(50% - (var(--c11-ball) * 0.34));
            left: calc(50% - (var(--c11-ball) * 0.34));
            background: hsl(var(--chart-4));
            box-shadow: 0 0 10px hsl(var(--chart-4) / 0.45);
            animation-name: c11-move-c;
          }

          .c11-container[data-paused='true'] .c11-ball {
            animation-play-state: paused;
          }

          @keyframes c11-move-a {
            0%,
            100% {
              transform: translateX(calc(var(--c11-travel) * -1));
            }
            50% {
              transform: translateX(var(--c11-travel));
            }
          }

          @keyframes c11-move-b {
            0%,
            100% {
              transform: translateX(var(--c11-travel));
            }
            50% {
              transform: translateX(calc(var(--c11-travel) * -1));
            }
          }

          @keyframes c11-move-c {
            0%,
            100% {
              transform: translateY(calc(var(--c11-travel) * -1));
            }
            50% {
              transform: translateY(var(--c11-travel));
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .c11-ball {
              animation: none;
            }
          }
        `}</style>
      </span>
      {showLabel ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : <span className="sr-only">{label}</span>}
    </div>
  );
}
