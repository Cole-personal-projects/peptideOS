import type { Compound, ReferenceEvidenceTier, ReferenceRegulatoryStatus } from './types';

export type LibraryEvidenceFilter =
  | 'all'
  | 'approved-label'
  | 'strong-human'
  | 'active-clinical'
  | 'early-emerging'
  | 'research-only';

export interface LibraryEvidenceDisplay {
  filter: Exclude<LibraryEvidenceFilter, 'all'>;
  tierLabel: string;
  statusLabel: string;
  mechanismClass: string;
}

export const libraryEvidenceOptions: LibraryEvidenceFilter[] = [
  'all',
  'approved-label',
  'strong-human',
  'active-clinical',
  'early-emerging',
  'research-only',
];

export function getLibraryEvidenceDisplay(compound: Compound): LibraryEvidenceDisplay {
  const profile = compound.referenceProfile;

  if (profile) {
    return {
      filter: getEvidenceFilter(profile.evidenceTier),
      tierLabel: getTierLabel(profile.evidenceTier),
      statusLabel: getStatusLabel(profile.regulatoryStatus.status),
      mechanismClass: getMechanismClass(profile.mechanismTargets, compound),
    };
  }

  if (compound.citations.some((citation) => citation.source.toLowerCase().includes('dailymed'))) {
    return {
      filter: 'approved-label',
      tierLabel: 'Approved Label',
      statusLabel: 'Label Backed',
      mechanismClass: getMechanismClass([], compound),
    };
  }

  return {
    filter: 'research-only',
    tierLabel: 'Research Only',
    statusLabel: compound.source === 'user' ? 'User Entered' : 'Research Use',
    mechanismClass: getMechanismClass([], compound),
  };
}

export function formatLibraryEvidenceFilter(value: LibraryEvidenceFilter): string {
  switch (value) {
    case 'all':
      return 'All evidence';
    case 'approved-label':
      return 'Approved Label';
    case 'strong-human':
      return 'Strong Human';
    case 'active-clinical':
      return 'Active Clinical';
    case 'early-emerging':
      return 'Early / Emerging';
    case 'research-only':
      return 'Research Only';
  }
}

function getEvidenceFilter(tier: ReferenceEvidenceTier): Exclude<LibraryEvidenceFilter, 'all'> {
  switch (tier) {
    case 'approved-label':
      return 'approved-label';
    case 'phase-3-topline':
    case 'phase-2-published':
      return 'strong-human';
    case 'phase-3-active':
      return 'active-clinical';
    case 'early-human':
    case 'identity-only':
      return 'early-emerging';
    case 'preclinical':
      return 'research-only';
  }
}

function getTierLabel(tier: ReferenceEvidenceTier): string {
  switch (tier) {
    case 'approved-label':
      return 'Approved Label';
    case 'phase-3-topline':
    case 'phase-2-published':
      return 'Strong Human';
    case 'phase-3-active':
      return 'Active Clinical';
    case 'early-human':
      return 'Early Human';
    case 'identity-only':
      return 'Emerging';
    case 'preclinical':
      return 'Preclinical';
  }
}

function getStatusLabel(status: ReferenceRegulatoryStatus['status']): string {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'investigational':
      return 'Investigational';
    case 'research-use':
      return 'Research Use';
    case 'unknown':
      return 'Unknown Status';
  }
}

function getMechanismClass(targets: string[], compound: Compound): string {
  if (targets.length > 0) {
    return targets
      .map((target) => target.replace(/\s+receptor$/i, ''))
      .map(formatTargetLabel)
      .join(' / ');
  }

  return compound.mechanism?.trim() || compound.category;
}

function formatTargetLabel(value: string): string {
  if (value.toLowerCase() === 'glucagon') return 'Glucagon';
  return value;
}
