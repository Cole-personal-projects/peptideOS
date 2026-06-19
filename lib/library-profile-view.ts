import { buildActionableLibraryProfile } from './actionable-library-profile';
import { getLibraryEvidenceDisplay } from './library-evidence';
import type { Compound } from './types';

export interface LibraryProfileViewOptions {
  researcherMode: boolean;
}

export interface LibraryProfileStat {
  label: string;
  value: string;
}

export interface LibraryProfileSection {
  title: string;
  items: string[];
  tone?: 'default' | 'primary' | 'warning';
}

export interface LibraryProfileViewModel {
  id: string;
  title: string;
  summary: string;
  atAGlance: LibraryProfileStat[];
  sections: LibraryProfileSection[];
}

export function buildLibraryProfileViewModel(
  compound: Compound,
  options: LibraryProfileViewOptions,
): LibraryProfileViewModel {
  const actionableProfile = buildActionableLibraryProfile(compound);
  const evidence = getLibraryEvidenceDisplay(compound);
  const referenceProfile = compound.referenceProfile;
  const sections: LibraryProfileSection[] = [
    ...(referenceProfile ? [
      {
        title: 'Field brief',
        items: [referenceProfile.biohackerBrief.headline],
        tone: 'primary' as const,
      },
      {
        title: 'Why people care',
        items: referenceProfile.biohackerBrief.whyPeopleCare,
      },
    ] : []),
    {
      title: 'Storage',
      items: [compound.storage],
    },
    {
      title: 'Safety',
      items: [compound.safety],
      tone: 'warning',
    },
    {
      title: 'What to verify',
      items: referenceProfile?.biohackerBrief.verifyBeforeUse ?? [
        'Container label, lot, expiration, strength, route, and storage instructions.',
      ],
    },
    {
      title: 'What to track',
      items: referenceProfile?.biohackerBrief.trackInApp ?? [
        'Inventory status, schedule adherence, and user-entered notes.',
      ],
    },
    {
      title: 'Evidence and transparency',
      items: referenceProfile?.evidenceGaps ?? [
        'Full pro profile is not yet attached; this view is generated from reviewed reference metadata.',
      ],
      tone: 'warning',
    },
    ...(referenceProfile ? [
      {
        title: 'Regulatory context',
        items: [
          referenceProfile.regulatoryStatus.summary,
          ...(referenceProfile.regulatoryStatus.limitations ? [referenceProfile.regulatoryStatus.limitations] : []),
        ],
      },
      {
        title: 'Reality check',
        items: [referenceProfile.biohackerBrief.realityCheck],
        tone: 'warning' as const,
      },
      {
        title: 'Evidence details',
        items: [
          referenceProfile.reviewSummary,
          ...referenceProfile.mechanismTargets,
          ...referenceProfile.clinicalEvidence.map((evidenceItem) => (
            [
              evidenceItem.sourceQuality ? formatLabel(evidenceItem.sourceQuality) : undefined,
              `${evidenceItem.design}: ${evidenceItem.finding}`,
              evidenceItem.limitations,
            ].filter(Boolean).join(' - ')
          )),
        ],
      },
      {
        title: 'Safety watch',
        items: referenceProfile.safetySignals,
        tone: 'warning' as const,
      },
    ] : []),
    {
      title: 'Citations',
      items: compound.citations.map((citation) => `${citation.title} (${citation.source}, ${citation.year})`),
    },
  ];

  return {
    id: compound.id,
    title: compound.name,
    summary: options.researcherMode ? compound.researcherDetails : compound.beginnerSummary,
    atAGlance: [
      { label: 'Evidence', value: actionableProfile.evidenceLabel || evidence.tierLabel },
      { label: 'Status', value: actionableProfile.statusLabel || evidence.statusLabel },
      { label: 'Route', value: compound.defaultRoute.toUpperCase() },
      { label: 'Unit', value: compound.defaultDoseUnit.toUpperCase() },
      { label: 'Form', value: formatForm(compound.concentrationMode) },
      { label: 'Mechanism', value: actionableProfile.mechanismClass || evidence.mechanismClass },
    ],
    sections: sections.filter((section) => section.items.length > 0),
  };
}

function formatForm(value: Compound['concentrationMode']): string {
  switch (value) {
    case 'reconstituted':
      return 'Reconstituted';
    case 'concentration':
      return 'Concentration';
    case 'prefilled':
      return 'Prefilled';
    case 'none':
      return 'None';
  }
}

function formatLabel(value: string): string {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
