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

      <MannequinSvg
        zones={zones}
        view={view}
        sex={sex}
        selectedSite={selectedSite}
        compact={compact}
        onSelect={onSiteChange}
        onLongPress={(site) => setHistorySite(site)}
      />

      {selectedSummary && (
        <div
          role="status"
          aria-label="Selected site summary"
          className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{selectedSummary.label}</p>
              <p className="text-xs text-muted-foreground">{selectedSummary.lastUsedLabel}</p>
            </div>
            <Badge variant="secondary">{selectedSummary.dosesLast30Days} in 30d</Badge>
          </div>
          {!compact && (
            <Textarea
              className="mt-3 min-h-20"
              placeholder="Site-specific notes"
              value={siteNotes}
              onChange={(event) => setSiteNotes(event.target.value)}
            />
          )}
        </div>
      )}

      {listOpen && (
        <div className="grid gap-2">
          {compatibleSites.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSiteChange(zone.id)}
              className={cn(
                'flex min-h-11 items-center justify-between rounded-md border border-border bg-secondary/35 px-3 text-left text-sm',
                selectedSite === zone.id && 'border-cyan-300 bg-cyan-400/10',
              )}
            >
              <span>{zone.label}</span>
              {zones.find((entry) => entry.id === zone.id)?.suggested && (
                <span className="flex items-center gap-1 text-xs text-emerald-300">
                  <Eye className="h-3 w-3" />
                  Suggested
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showStats && <RotationStatsPanel doses={doses} />}

      <ZoneHistoryModal
        open={Boolean(historySite)}
        onOpenChange={(open) => !open && setHistorySite('')}
        summary={historySummary}
        getPeptide={getPeptide}
      />
    </section>
  );
}
