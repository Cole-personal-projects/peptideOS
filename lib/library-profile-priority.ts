import type { Compound } from './types';

export type ProfilePriorityBand = 'profiled' | 'priority' | 'standard' | 'watchlist';

export interface CompoundProfilePriority {
  band: ProfilePriorityBand;
  label: string;
  score: number;
  reasons: string[];
}

export interface ProfileUpgradeQueueItem {
  compound: Compound;
  priority: CompoundProfilePriority;
}

const highUserValueIds = new Set([
  'tirzepatide',
  'semaglutide',
  'bpc-157',
  'tb-500',
  'mots-c',
  'hgh-somatropin',
  'tesamorelin',
  'sermorelin',
  'ipamorelin',
  'thymosin-alpha-1',
  'bremelanotide',
  'cjc-1295',
  'ibutamoren',
  'aod-9604',
  'kpv',
  'ghk-cu',
  'semax',
  'selank',
]);

const protocolInventoryImpactTypes = new Set(['peptide', 'glp-1', 'hormone', 'biologic']);

const preferredQueueOrder = new Map([
  ['tirzepatide', 0],
  ['semaglutide', 1],
  ['bpc-157', 2],
  ['tb-500', 3],
  ['mots-c', 4],
  ['hgh-somatropin', 5],
  ['tesamorelin', 6],
  ['sermorelin', 7],
  ['ipamorelin', 8],
  ['thymosin-alpha-1', 9],
  ['bremelanotide', 10],
  ['cjc-1295', 11],
  ['ibutamoren', 12],
  ['aod-9604', 13],
  ['kpv', 14],
  ['ghk-cu', 15],
  ['semax', 16],
  ['selank', 17],
]);

export function getCompoundProfilePriority(compound: Compound): CompoundProfilePriority {
  if (compound.referenceProfile) {
    return {
      band: 'profiled',
      label: 'Pro profile live',
      score: 0,
      reasons: ['Full reference profile available'],
    };
  }

  const reasons: string[] = [];
  let score = 0;

  if (highUserValueIds.has(compound.id)) {
    score += 40;
    reasons.push('High user value');
  }

  if (protocolInventoryImpactTypes.has(compound.compoundType) || compound.concentrationMode !== 'none') {
    score += 25;
    reasons.push('Protocol and inventory impact');
  }

  if (compound.citations.length > 0) {
    score += 20;
    reasons.push('Source-backed upgrade path');
  }

  if (compound.dosePresets.length > 0 || compound.vialPresets.length > 0) {
    score += 10;
    reasons.push('Preset data ready');
  }

  if (compound.compoundType === 'small-molecule' || compound.compoundType === 'supplement') {
    score -= 5;
  }

  const band: Exclude<ProfilePriorityBand, 'profiled'> = score >= 70
    ? 'priority'
    : score >= 35
      ? 'standard'
      : 'watchlist';

  return {
    band,
    label: band === 'priority' ? 'Pro data priority' : band === 'standard' ? 'Standard upgrade' : 'Watchlist',
    score,
    reasons: reasons.length > 0 ? reasons : ['Needs source review'],
  };
}

export function getProfileUpgradeQueue(compounds: Compound[]): ProfileUpgradeQueueItem[] {
  return compounds
    .filter((compound) => compound.source === 'bundled' && !compound.deletedAt)
    .map((compound) => ({
      compound,
      priority: getCompoundProfilePriority(compound),
    }))
    .filter((item) => item.priority.band !== 'profiled')
    .sort((left, right) => {
      const preferredLeft = preferredQueueOrder.get(left.compound.id) ?? Number.MAX_SAFE_INTEGER;
      const preferredRight = preferredQueueOrder.get(right.compound.id) ?? Number.MAX_SAFE_INTEGER;

      if (left.priority.score !== right.priority.score) {
        return right.priority.score - left.priority.score;
      }

      if (preferredLeft !== preferredRight) {
        return preferredLeft - preferredRight;
      }

      return left.compound.name.localeCompare(right.compound.name);
    });
}
