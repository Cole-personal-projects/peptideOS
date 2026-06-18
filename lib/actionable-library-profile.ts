import { getLibraryEvidenceDisplay } from './library-evidence';
import type { Compound, CompoundActionableProfile } from './types';

export interface ActionableLibraryProfile extends CompoundActionableProfile {
  compoundId: string;
}

export function buildActionableLibraryProfile(compound: Compound): ActionableLibraryProfile {
  if (compound.actionableProfile) {
    return {
      compoundId: compound.id,
      ...compound.actionableProfile,
    };
  }

  const evidence = getLibraryEvidenceDisplay(compound);
  const profile = compound.referenceProfile;

  return {
    compoundId: compound.id,
    headline: profile?.biohackerBrief.headline ?? compound.beginnerSummary,
    summary: profile?.reviewSummary ?? compound.beginnerSummary,
    evidenceLabel: evidence.tierLabel,
    statusLabel: evidence.statusLabel,
    mechanismClass: evidence.mechanismClass,
    primaryActions: unique([
      ...getCoreActions(compound),
      ...(profile?.peptideOSActions ?? []),
    ]),
    verifyBeforeUse: unique([
      ...getVerificationChecklist(compound),
      ...(profile?.biohackerBrief.verifyBeforeUse ?? []),
    ]),
    trackInApp: unique([
      ...getTrackingChecklist(compound),
      ...(profile?.biohackerBrief.trackInApp ?? []),
      ...(profile?.practicalNotes ?? []),
    ]),
    inventoryGuidance: unique(getInventoryGuidance(compound)),
    transparencyFlags: unique([
      ...getTransparencyFlags(compound),
      ...(profile?.evidenceGaps ?? []),
    ]),
    trackingDomains: unique(getTrackingDomains(compound)),
    peppiPrompts: unique(getPeppiPrompts(compound)),
  };
}

function getCoreActions(compound: Compound): string[] {
  const actions = [
    getInventoryAction(compound),
    'Build a schedule from user-confirmed label details',
    'Log administrations, missed doses, notes, and inventory depletion',
  ];

  if (compound.reconstitutionDefaults) {
    actions.push('Calculate reconstitution math after vial amount and diluent volume are confirmed');
  }

  if (compound.dosePresets.length > 0) {
    actions.push('Use source-backed dose presets as logging context only');
  }

  return actions;
}

function getInventoryAction(compound: Compound): string {
  if (compound.concentrationMode === 'prefilled') {
    return 'Add the exact labeled container or pen to inventory';
  }

  if (compound.concentrationMode === 'concentration') {
    return 'Add the exact vial concentration and volume to inventory';
  }

  return 'Add the exact vial, kit, bottle, or container to inventory';
}

function getVerificationChecklist(compound: Compound): string[] {
  return [
    'Container label, lot, expiration, strength, and route',
    'Whether the item is a prefilled pen, vial, capsule, or other container',
    'Source, storage instructions, and whether the item is sealed or active',
    `Default app route is ${compound.defaultRoute.toUpperCase()}, but the user should confirm the actual label route`,
  ];
}

function getTrackingChecklist(compound: Compound): string[] {
  const checklist = [
    'Schedule adherence and skipped or missed administrations',
    'Subjective response notes, side-effect notes, and trend observations',
    'Inventory depletion and active container status',
  ];

  if (compound.reconstitutionDefaults) {
    checklist.push('Reconstitution date, concentration, active vial status, and remaining inventory');
  }

  if (compound.category === 'metabolic') {
    checklist.push('Weight, appetite notes, glucose-related notes, and tolerability trends when the user chooses to track them');
  }

  if (compound.category === 'sleep') {
    checklist.push('Sleep timing, sleep quality notes, and next-day effect notes');
  }

  return checklist;
}

function getTrackingDomains(compound: Compound): string[] {
  const domains = [
    'Schedule adherence',
    'Inventory status',
    'Subjective response notes',
  ];

  if (compound.reconstitutionDefaults) {
    domains.push('Reconstitution math and vial status');
  }

  switch (compound.category) {
    case 'metabolic':
      domains.push('Metabolic trend notes', 'Appetite and tolerability notes');
      break;
    case 'healing':
      domains.push('Recovery or tissue-support notes', 'Site rotation and local response notes');
      break;
    case 'growth-hormone':
      domains.push('Recovery, sleep, and training context notes', 'Water-retention or tolerability notes');
      break;
    case 'cognitive':
      domains.push('Focus, mood, and cognition notes', 'Sleep and timing context');
      break;
    case 'longevity':
      domains.push('Energy, endurance, and recovery notes', 'Longitudinal trend notes');
      break;
    case 'immune':
      domains.push('Immune-support context notes', 'Tolerability and flare notes');
      break;
    case 'skin-hair':
      domains.push('Skin, hair, or local tissue notes', 'Topical or site-specific context');
      break;
    case 'sexual-reproductive':
      domains.push('Timing, response, and tolerability notes', 'Hormone/reproductive context notes');
      break;
    case 'sleep':
      domains.push('Sleep quality and timing notes', 'Next-day effect notes');
      break;
    case 'hormone-endocrine':
      domains.push('Lab-adjacent notes the user chooses to track', 'Injection schedule and container status');
      break;
    case 'custom':
      domains.push('Custom user-defined trend notes');
      break;
  }

  return domains;
}

function getInventoryGuidance(compound: Compound): string[] {
  const guidance = [
    'Record vial amount, container state, lot, source, date added, and expiration.',
    compound.storage,
  ];

  const vialAmounts = compound.reconstitutionDefaults?.typicalVialAmounts
    .map((amount) => `${amount.value} ${amount.unit}`)
    .join(', ');

  if (vialAmounts) {
    guidance.push(`Common vial amount presets: ${vialAmounts}.`);
  }

  const bacWater = compound.reconstitutionDefaults?.typicalBacWaterMl
    .map((volume) => `${volume} mL`)
    .join(', ');

  if (bacWater) {
    guidance.push(`BAC water calculator presets: ${bacWater}.`);
  }

  compound.vialPresets.forEach((preset) => {
    guidance.push(`${preset.label}: ${preset.sourceNote}`);
  });

  return guidance;
}

function getPeppiPrompts(compound: Compound): string[] {
  const prompts = [
    `Add my labeled ${compound.name} container to inventory`,
    `Build a ${compound.name} schedule from my confirmed label details`,
    `Show my ${compound.name} inventory, schedule, notes, and missed entries`,
  ];

  if (compound.reconstitutionDefaults) {
    prompts.push(`Calculate ${compound.name} concentration from vial amount and BAC water`);
    prompts.push(`Add a ${compound.name} kit or vial to inventory`);
  }

  if (compound.concentrationMode === 'prefilled') {
    prompts.push(`Help me log a ${compound.name} pen or prefilled container`);
  }

  if (compound.category === 'metabolic') {
    prompts.push(`Review my ${compound.name} metabolic trend notes and tolerability log`);
  }

  return prompts;
}

function getTransparencyFlags(compound: Compound): string[] {
  const flags = [
    'Research-use entries are tracking references, not medical guidance.',
    'Source strength varies by compound; review citations before relying on a claim.',
  ];

  if (compound.citations.some((citation) => citation.source.toLowerCase().includes('dailymed'))) {
    flags.push('Approved-label or label-adjacent citations may describe a regulated product, not an unlabeled research item.');
  }

  if (!compound.referenceProfile) {
    flags.push('Full pro profile is not yet attached; this view is generated from reviewed reference metadata.');
  }

  return flags;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}
