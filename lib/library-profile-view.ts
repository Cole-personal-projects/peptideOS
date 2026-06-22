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
  modeLabel: string;
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
  const modeLabel = options.researcherMode ? 'Experienced tracker view' : 'Beginner view';

  return {
    id: compound.id,
    title: compound.name,
    modeLabel,
    summary: options.researcherMode
      ? compound.researcherDetails
      : buildBeginnerSummary(compound, actionableProfile.summary),
    atAGlance: buildAtAGlance(compound, evidence, actionableProfile, options.researcherMode),
    sections: options.researcherMode
      ? buildResearcherSections(compound)
      : buildBeginnerSections(compound),
  };
}

function buildBeginnerSummary(compound: Compound, actionableSummary: string) {
  if (compound.beginnerSummary && compound.beginnerSummary !== compound.researcherDetails) {
    return compound.beginnerSummary;
  }
  return actionableSummary;
}

function buildAtAGlance(
  compound: Compound,
  evidence: ReturnType<typeof getLibraryEvidenceDisplay>,
  actionableProfile: ReturnType<typeof buildActionableLibraryProfile>,
  researcherMode: boolean,
): LibraryProfileStat[] {
  const shared: LibraryProfileStat[] = [
    { label: 'Evidence', value: evidence.tierLabel },
    { label: 'Status', value: evidence.statusLabel },
    { label: 'Route', value: compound.defaultRoute.toUpperCase() },
    { label: 'Form', value: formatForm(compound.concentrationMode) },
  ];

  if (!researcherMode) {
    return [
      ...shared,
      { label: 'Default unit', value: compound.defaultDoseUnit.toUpperCase() },
      { label: 'Track', value: actionableProfile.trackingDomains[0] ?? 'Protocol log' },
    ];
  }

  return [
    ...shared,
    { label: 'Mechanism', value: actionableProfile.mechanismClass },
    { label: 'Source', value: compound.source === 'user' ? 'Custom' : 'Reference' },
  ];
}

function buildBeginnerSections(compound: Compound): LibraryProfileSection[] {
  const actionableProfile = buildActionableLibraryProfile(compound);
  const referenceProfile = compound.referenceProfile;

  return compactSections([
    {
      title: 'Plain-language brief',
      items: [compound.beginnerSummary || actionableProfile.summary],
      tone: 'primary',
    },
    {
      title: 'Start by verifying',
      items: referenceProfile?.biohackerBrief.verifyBeforeUse ?? actionableProfile.verifyBeforeUse,
      tone: 'warning',
    },
    {
      title: 'Track in PeptideOS',
      items: referenceProfile?.biohackerBrief.trackInApp ?? actionableProfile.trackInApp,
    },
    {
      title: 'Useful first actions',
      items: actionableProfile.primaryActions,
    },
    {
      title: 'Inventory and storage',
      items: [
        ...actionableProfile.inventoryGuidance,
        compound.storage,
      ],
    },
    {
      title: 'Safety note',
      items: [
        compound.safety,
        'PeptideOS tracks your records; it does not decide whether a protocol is appropriate.',
      ],
      tone: 'warning',
    },
  ]);
}

function buildResearcherSections(compound: Compound): LibraryProfileSection[] {
  const referenceProfile = compound.referenceProfile;

  return compactSections([
    ...(referenceProfile ? [
      {
        title: 'Field brief',
        items: [referenceProfile.biohackerBrief.headline],
        tone: 'primary' as const,
      },
      {
        title: 'Why people run this',
        items: referenceProfile.biohackerBrief.whyPeopleCare,
      },
    ] : []),
    {
      title: 'Mechanism and targets',
      items: referenceProfile?.mechanismTargets.length
        ? referenceProfile.mechanismTargets
        : [compound.mechanism || compound.researcherDetails],
    },
    {
      title: 'Clinical evidence',
      items: referenceProfile?.clinicalEvidence.map((entry) => [
        entry.design,
        entry.population,
        entry.finding,
        entry.limitations,
      ].filter(Boolean).join(' · ')) ?? [compound.researcherDetails],
    },
    {
      title: 'Evidence transparency',
      items: referenceProfile?.evidenceGaps ?? [
        'Full pro profile is not yet attached; view generated from reviewed reference metadata.',
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
        items: referenceProfile.clinicalEvidence.flatMap((entry) => entry.citationIds),
      },
      {
        title: 'Citations',
        items: compound.citations.map((citation) => `${citation.title} (${citation.source}, ${citation.year})`),
      },
    ] : []),
    {
      title: 'Storage',
      items: [compound.storage],
    },
    {
      title: 'Safety',
      items: [
        compound.safety,
        ...(referenceProfile?.safetySignals ?? []),
      ],
      tone: 'warning',
    },
  ]);
}

function compactSections(sections: LibraryProfileSection[]) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
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
