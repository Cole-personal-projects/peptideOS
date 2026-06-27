"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Flame, List, RotateCcw, VenusAndMars } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MannequinSvg } from './mannequin-svg';
import { RotationStatsPanel } from './rotation-stats-panel';
import { ZoneHistoryModal } from './zone-history-modal';
import type { BodyTemplateSex } from '@/lib/body-map-reference';
import { getCompatibleInjectionZones } from '@/lib/injection-zones';
import { getSelectedZoneSummary, getSitePickerZones, type SitePickerMode, type SitePickerView } from '@/lib/site-picker';
import type { Dose, Peptide, Route, SiteCode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BodyMannequinProps {
  doses: Dose[];
  route: Route;
  selectedSite: SiteCode | '';
  onSiteChange: (site: SiteCode) => void;
  onRouteChange?: (route: Route) => void;
  getPeptide?: (id: string) => Peptide | undefined;
  compact?: boolean;
  showStats?: boolean;
  className?: string;
}

const injectableRoutes: { value: Route; label: string }[] = [
  { value: 'subq', label: 'SubQ' },
  { value: 'im', label: 'IM' },
];

export function BodyMannequin({
  doses,
  route,
  selectedSite,
  onSiteChange,
  onRouteChange,
  getPeptide = () => undefined,
  compact,
  showStats,
  className,
}: BodyMannequinProps) {
  const [view, setView] = useState<SitePickerView>('front');
  const [sex, setSex] = useState<BodyTemplateSex>('male');
  const [mode, setMode] = useState<SitePickerMode>('recency');
  const [listOpen, setListOpen] = useState(false);
  const [historySite, setHistorySite] = useState<SiteCode | ''>('');
  const [siteNotes, setSiteNotes] = useState('');
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    rootRef.current?.setAttribute('data-body-map-ready', 'true');
  }, []);

  const zones = useMemo(
    () => getSitePickerZones({ doses, route, selectedSite, view, mode }),
    [doses, route, selectedSite, view, mode],
  );
  const selectedSummary = useMemo(() => getSelectedZoneSummary(doses, selectedSite), [doses, selectedSite]);
  const historySummary = useMemo(() => getSelectedZoneSummary(doses, historySite), [doses, historySite]);
  const compatibleSites = useMemo(() => getCompatibleInjectionZones(route), [route]);
  const mapModeLabel = mode === 'heatmap' ? 'Heatmap' : 'Rotation';
  const selectedZoneLabel = selectedSummary?.label ?? 'Choose site';

  return (
    <section ref={rootRef} className={cn('space-y-4', className)} data-body-map-ready="false">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={route} onValueChange={(value) => onRouteChange?.(value as Route)}>
          <TabsList className="h-8">
            {injectableRoutes.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="h-6 px-3 text-xs">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setView(view === 'front' ? 'back' : 'front')}
            title={view === 'front' ? 'Show back view' : 'Show front view'}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">{view === 'front' ? 'Show back view' : 'Show front view'}</span>
          </Button>
          <Button
            type="button"
            variant={sex === 'female' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setSex(sex === 'male' ? 'female' : 'male')}
          >
            <VenusAndMars className="h-4 w-4" />
            <span className="sr-only">Toggle body template</span>
          </Button>
          <Button
            type="button"
            variant={mode === 'heatmap' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setMode(mode === 'heatmap' ? 'recency' : 'heatmap')}
          >
            <Flame className="h-4 w-4" />
            <span className="sr-only">Toggle heatmap</span>
          </Button>
          <Button
            type="button"
            variant={listOpen ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-2"
            onClick={() => setListOpen(!listOpen)}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Toggle site list</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StateChip label="Route" value={route === 'subq' ? 'SubQ' : 'IM'} />
        <StateChip label="View" value={view === 'front' ? 'Front' : 'Back'} />
        <StateChip label={mapModeLabel} value={selectedZoneLabel} />
      </div>

      <MannequinSvg
        zones={zones}
        view={view}
        sex={sex}
        selectedSite={selectedSite}
        compact={compact}
        onSelect={onSiteChange}
        onLongPress={(site) => setHistorySite(site)}
      />

      {selectedSummary ? (
        <div role="status" aria-label="Selected site summary" className="rounded-xl border border-primary/30 bg-primary/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{selectedSummary.label}</p>
              <p className="text-xs text-muted-foreground">{selectedSummary.lastUsedLabel}</p>
            </div>
            <Badge variant="secondary">{selectedSummary.dosesLast30Days} in 30d</Badge>
          </div>
          {!compact ? (
            <Textarea
              className="mt-3 min-h-20"
              placeholder="Site-specific notes"
              value={siteNotes}
              onChange={(event) => setSiteNotes(event.target.value)}
            />
          ) : null}
        </div>
      ) : null}

      {listOpen ? (
        <div className="grid gap-2">
          {compatibleSites.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSiteChange(zone.id)}
              className={cn(
                'flex min-h-11 items-center justify-between rounded-xl border border-border bg-secondary/35 px-3 text-left text-sm',
                selectedSite === zone.id && 'border-primary/60 bg-primary/10',
              )}
            >
              <span>{zone.label}</span>
              {zones.find((entry) => entry.id === zone.id)?.suggested ? (
                <span className="flex items-center gap-1 text-xs text-chart-2">
                  <Eye className="h-3 w-3" />
                  Suggested
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {showStats ? <RotationStatsPanel doses={doses} /> : null}

      <ZoneHistoryModal
        open={Boolean(historySite)}
        onOpenChange={(open) => !open && setHistorySite('')}
        summary={historySummary}
        getPeptide={getPeptide}
      />
    </section>
  );
}

function StateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-card px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
