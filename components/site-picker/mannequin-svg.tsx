"use client";

import Body from '@mjcdev/react-body-highlighter';
import { Zone } from './zone';
import {
  getBodyHitTarget,
  getBodyTemplate,
  getBodyZones,
  type BodyTemplateSex,
} from '@/lib/body-map-reference';
import type { SitePickerZone, SitePickerView } from '@/lib/site-picker';
import type { SiteCode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MannequinSvgProps {
  zones: SitePickerZone[];
  view: SitePickerView;
  sex: BodyTemplateSex;
  selectedSite: SiteCode | '';
  onSelect: (site: SiteCode) => void;
  onLongPress: (site: SiteCode) => void;
  compact?: boolean;
}

export function MannequinSvg({
  zones,
  view,
  sex,
  selectedSite,
  onSelect,
  onLongPress,
  compact,
}: MannequinSvgProps) {
  const template = getBodyTemplate(sex, view);
  const zoneViewModel = new Map(zones.map((zone) => [zone.id, zone]));
  const drawableZones = getBodyZones(template.id)
    .map((bodyZone) => ({
      bodyZone,
      hitTarget: getBodyHitTarget(bodyZone.id),
      state: zoneViewModel.get(bodyZone.siteCode),
    }))
    .filter((entry) => entry.hitTarget && entry.state);

  return (
    <div className={cn('mx-auto w-full max-w-[350px]', compact && 'max-w-[280px]')}>
      <div className="relative aspect-[1/2] w-full overflow-hidden rounded-2xl border border-border bg-[radial-gradient(circle_at_50%_22%,rgba(20,184,166,0.12),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.28),rgba(15,23,42,0.08))] shadow-inner">
        <div className="pointer-events-none absolute inset-x-7 top-4 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-10 bottom-8 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border bg-background/75 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          {view === 'front' ? 'Front' : 'Back'} · {sex === 'male' ? 'Male' : 'Female'}
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-50 [&>svg]:h-full [&>svg]:w-full">
          <Body data={[]} gender={sex} side={view} scale={1.7} border="#64748b" />
        </div>
        <svg
          viewBox={template.viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${sex} ${view} injection site map`}
          className="absolute inset-0 h-full w-full"
        >
          {drawableZones.map(({ bodyZone, hitTarget, state }) => {
            if (!hitTarget || !state) return null;

            return (
              <Zone
                key={bodyZone.id}
                id={state.id}
                label={state.label}
                tone={state.tone}
                selected={selectedSite === state.id}
                suggested={state.suggested}
                compatible={state.compatible}
                pathData={bodyZone.pathData}
                hitTargetPathData={hitTarget.pathData}
                onSelect={() => onSelect(state.id)}
                onLongPress={() => onLongPress(state.id)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full border bg-background/75 px-3 py-1.5 text-[11px] text-muted-foreground backdrop-blur">
          <span>Tap to select</span>
          <span>Long press history</span>
        </div>
      </div>
    </div>
  );
}
