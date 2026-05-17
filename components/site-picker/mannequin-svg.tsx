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
    <div className={cn('mx-auto w-full max-w-[340px]', compact && 'max-w-[280px]')}>
      <div className="relative aspect-[1/2] w-full overflow-hidden rounded-md bg-slate-950/20">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-55 [&>svg]:h-full [&>svg]:w-full">
          <Body data={[]} gender={sex} side={view} scale={1.7} border="#94a3b8" />
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
      </div>
    </div>
  );
}
