// Injection Zone Data and Algorithms

import type { Route, Dose } from './types';

export interface InjectionZone {
  id: string;
  label: string;
  view: 'front' | 'back';
  routes: Route[];
  bodyPart: 'abdomen' | 'thigh' | 'deltoid' | 'glute' | 'back';
}

export const INJECTION_ZONES: InjectionZone[] = [
  // Abdomen (front) - SubQ only
  { id: 'abdomen-upper-left', label: 'Upper Left Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'abdomen-upper-right', label: 'Upper Right Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'abdomen-mid-left', label: 'Mid Left Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'abdomen-mid-right', label: 'Mid Right Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'abdomen-lower-left', label: 'Lower Left Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'abdomen-lower-right', label: 'Lower Right Abdomen', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'flank-left', label: 'Left Flank', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  { id: 'flank-right', label: 'Right Flank', view: 'front', routes: ['subq'], bodyPart: 'abdomen' },
  
  // Thighs (front) - SubQ and IM
  { id: 'thigh-front-upper-left', label: 'Upper Left Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  { id: 'thigh-front-upper-right', label: 'Upper Right Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  { id: 'thigh-front-mid-left', label: 'Mid Left Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  { id: 'thigh-front-mid-right', label: 'Mid Right Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  { id: 'thigh-outer-left', label: 'Outer Left Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  { id: 'thigh-outer-right', label: 'Outer Right Thigh', view: 'front', routes: ['subq', 'im'], bodyPart: 'thigh' },
  
  // Deltoids - SubQ and IM
  { id: 'delt-anterior-left', label: 'Left Anterior Deltoid', view: 'front', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  { id: 'delt-anterior-right', label: 'Right Anterior Deltoid', view: 'front', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  { id: 'delt-lateral-left', label: 'Left Lateral Deltoid', view: 'front', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  { id: 'delt-lateral-right', label: 'Right Lateral Deltoid', view: 'front', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  { id: 'delt-posterior-left', label: 'Left Posterior Deltoid', view: 'back', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  { id: 'delt-posterior-right', label: 'Right Posterior Deltoid', view: 'back', routes: ['subq', 'im'], bodyPart: 'deltoid' },
  
  // Glutes (back) - IM primarily, SubQ acceptable
  { id: 'glute-upper-outer-left', label: 'Left Upper Outer Glute', view: 'back', routes: ['im', 'subq'], bodyPart: 'glute' },
  { id: 'glute-upper-outer-right', label: 'Right Upper Outer Glute', view: 'back', routes: ['im', 'subq'], bodyPart: 'glute' },
  
  // Lower back (back) - SubQ only
  { id: 'lower-back-left', label: 'Left Lower Back', view: 'back', routes: ['subq'], bodyPart: 'back' },
  { id: 'lower-back-right', label: 'Right Lower Back', view: 'back', routes: ['subq'], bodyPart: 'back' },
];

export type RecencyLevel = 'fresh' | 'moderate' | 'recent' | 'avoid' | 'incompatible';

export interface ZoneStats {
  zoneId: string;
  lastUsed: Date | null;
  daysSinceUse: number | null;
  dosesLast30Days: number;
  recencyLevel: RecencyLevel;
}

export function getZoneStats(doses: Dose[], zoneId: string): ZoneStats {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const zoneDoses = doses.filter(d => d.site === zoneId && d.completed);
  const recentDoses = zoneDoses.filter(d => new Date(d.dateTime) >= thirtyDaysAgo);
  
  const sortedDoses = [...zoneDoses].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );
  
  const lastUsed = sortedDoses[0] ? new Date(sortedDoses[0].dateTime) : null;
  const daysSinceUse = lastUsed 
    ? Math.floor((now.getTime() - lastUsed.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  
  let recencyLevel: RecencyLevel = 'fresh';
  if (daysSinceUse !== null) {
    if (daysSinceUse < 1) recencyLevel = 'avoid';
    else if (daysSinceUse <= 2) recencyLevel = 'recent';
    else if (daysSinceUse <= 7) recencyLevel = 'moderate';
    else recencyLevel = 'fresh';
  }
  
  return {
    zoneId,
    lastUsed,
    daysSinceUse,
    dosesLast30Days: recentDoses.length,
    recencyLevel,
  };
}

export function getAllZoneStats(doses: Dose[]): Map<string, ZoneStats> {
  const stats = new Map<string, ZoneStats>();
  for (const zone of INJECTION_ZONES) {
    stats.set(zone.id, getZoneStats(doses, zone.id));
  }
  return stats;
}

export function getRecencyColor(level: RecencyLevel): string {
  switch (level) {
    case 'fresh': return 'var(--zone-fresh)';
    case 'moderate': return 'var(--zone-moderate)';
    case 'recent': return 'var(--zone-recent)';
    case 'avoid': return 'var(--zone-avoid)';
    case 'incompatible': return 'var(--zone-incompatible)';
  }
}

export function getRecencyBgClass(level: RecencyLevel): string {
  switch (level) {
    case 'fresh': return 'fill-emerald-500/30 stroke-emerald-500/50';
    case 'moderate': return 'fill-yellow-500/30 stroke-yellow-500/50';
    case 'recent': return 'fill-orange-500/30 stroke-orange-500/50';
    case 'avoid': return 'fill-red-500/30 stroke-red-500/50';
    case 'incompatible': return 'fill-muted/20 stroke-muted/30';
  }
}

export function getHeatmapColor(dosesLast30Days: number): string {
  if (dosesLast30Days === 0) return 'fill-slate-700/30 stroke-slate-600/40';
  if (dosesLast30Days <= 2) return 'fill-violet-500/20 stroke-violet-500/40';
  if (dosesLast30Days <= 5) return 'fill-violet-500/40 stroke-violet-500/60';
  if (dosesLast30Days <= 10) return 'fill-violet-500/60 stroke-violet-500/80';
  return 'fill-violet-500/80 stroke-violet-400';
}

export function getSuggestedZone(
  doses: Dose[],
  route: Route | null
): string | null {
  const compatibleZones = route 
    ? INJECTION_ZONES.filter(z => z.routes.includes(route))
    : INJECTION_ZONES.filter(z => z.routes.includes('subq') || z.routes.includes('im'));
  
  if (compatibleZones.length === 0) return null;
  
  const stats = getAllZoneStats(doses);
  
  // Score each zone: higher is better (fresher)
  const scored = compatibleZones.map(zone => {
    const zoneStats = stats.get(zone.id)!;
    let score = 0;
    
    // Never used = highest score
    if (zoneStats.daysSinceUse === null) {
      score = 1000;
    } else {
      score = zoneStats.daysSinceUse * 10;
    }
    
    // Penalize heavily used zones
    score -= zoneStats.dosesLast30Days * 5;
    
    return { zone, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.zone.id ?? null;
}

export function calculateRotationScore(doses: Dose[]): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentDoses = doses.filter(d => 
    d.completed && 
    new Date(d.dateTime) >= thirtyDaysAgo &&
    (d.site.length > 0)
  );
  
  if (recentDoses.length === 0) return 100;
  
  // Count doses per zone
  const zoneCounts = new Map<string, number>();
  for (const dose of recentDoses) {
    zoneCounts.set(dose.site, (zoneCounts.get(dose.site) || 0) + 1);
  }
  
  const uniqueZonesUsed = zoneCounts.size;
  const totalDoses = recentDoses.length;
  
  // Ideal distribution: each zone used equally
  const idealPerZone = totalDoses / uniqueZonesUsed;
  
  // Calculate variance from ideal
  let variance = 0;
  for (const count of zoneCounts.values()) {
    variance += Math.pow(count - idealPerZone, 2);
  }
  variance /= uniqueZonesUsed;
  
  // Score based on unique zones used and distribution evenness
  const zoneScore = Math.min(uniqueZonesUsed / 8, 1) * 50; // Up to 50 points for using 8+ zones
  const evenScore = Math.max(0, 50 - variance * 5); // Up to 50 points for even distribution
  
  return Math.round(zoneScore + evenScore);
}

export function getUnderusedZones(doses: Dose[], dayThreshold: number = 10): InjectionZone[] {
  const stats = getAllZoneStats(doses);
  
  return INJECTION_ZONES.filter(zone => {
    const zoneStats = stats.get(zone.id)!;
    return zoneStats.daysSinceUse === null || zoneStats.daysSinceUse > dayThreshold;
  });
}

export function getMostUsedZone(doses: Dose[]): { zone: InjectionZone; count: number } | null {
  const stats = getAllZoneStats(doses);
  
  let maxZone: InjectionZone | null = null;
  let maxCount = 0;
  
  for (const zone of INJECTION_ZONES) {
    const zoneStats = stats.get(zone.id)!;
    if (zoneStats.dosesLast30Days > maxCount) {
      maxCount = zoneStats.dosesLast30Days;
      maxZone = zone;
    }
  }
  
  return maxZone ? { zone: maxZone, count: maxCount } : null;
}

export function getZoneDoseHistory(doses: Dose[], zoneId: string): Dose[] {
  return doses
    .filter(d => d.site === zoneId && d.completed)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}
