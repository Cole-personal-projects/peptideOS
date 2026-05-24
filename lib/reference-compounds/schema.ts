import type { Compound, CompoundCategory, CompoundType, ConcentrationMode, DoseUnit, Route } from '../types';

const compoundTypes: CompoundType[] = ['peptide', 'hormone', 'glp-1', 'small-molecule', 'biologic', 'supplement', 'other'];
const categories: CompoundCategory[] = [
  'healing',
  'growth-hormone',
  'metabolic',
  'longevity',
  'cognitive',
  'skin-hair',
  'immune',
  'sleep',
  'sexual-reproductive',
  'hormone-endocrine',
  'custom',
];
const routes: Route[] = ['subq', 'im', 'intranasal', 'oral', 'topical'];
const doseUnits: DoseUnit[] = ['mcg', 'mg', 'iu'];
const concentrationModes: ConcentrationMode[] = ['reconstituted', 'concentration', 'prefilled', 'none'];
const recommendationLanguage = /\b(recommended dose|should take|safe dose|dose recommendation)\b/i;

export type ReferenceCompound = Compound & {
  source: 'bundled';
};

export function validateReferenceCompound(compound: ReferenceCompound): string[] {
  const issues: string[] = [];

  if (!/^[a-z0-9-]+$/.test(compound.id)) issues.push(`${compound.id}: id must be slug-safe`);
  if (!compound.name.trim()) issues.push(`${compound.id}: name is required`);
  if (!compound.aliases.every((alias) => alias.trim().length > 0)) issues.push(`${compound.id}: aliases cannot be blank`);
  if (!compoundTypes.includes(compound.compoundType)) issues.push(`${compound.id}: invalid compoundType`);
  if (!categories.includes(compound.category)) issues.push(`${compound.id}: invalid category`);
  if (!routes.includes(compound.defaultRoute)) issues.push(`${compound.id}: invalid defaultRoute`);
  if (!compound.supportedRoutes.includes(compound.defaultRoute)) issues.push(`${compound.id}: supportedRoutes must include defaultRoute`);
  if (!compound.supportedRoutes.every((route) => routes.includes(route))) issues.push(`${compound.id}: invalid supported route`);
  if (!doseUnits.includes(compound.defaultDoseUnit)) issues.push(`${compound.id}: invalid defaultDoseUnit`);
  if (!concentrationModes.includes(compound.concentrationMode)) issues.push(`${compound.id}: invalid concentrationMode`);
  if (compound.source !== 'bundled') issues.push(`${compound.id}: bundled reference compound must use bundled source`);
  if (compound.curationStatus !== 'reviewed') issues.push(`${compound.id}: app index only ships reviewed compounds`);
  if (!compound.beginnerSummary.trim()) issues.push(`${compound.id}: beginnerSummary is required`);
  if (!compound.researcherDetails.trim()) issues.push(`${compound.id}: researcherDetails is required`);
  if (!compound.safety.trim()) issues.push(`${compound.id}: safety is required`);
  if (!compound.storage.trim()) issues.push(`${compound.id}: storage is required`);
  if (compound.citations.length === 0) issues.push(`${compound.id}: at least one citation is required`);

  compound.citations.forEach((citation) => {
    if (!citation.id.trim()) issues.push(`${compound.id}: citation id is required`);
    if (!citation.title.trim()) issues.push(`${compound.id}: citation title is required`);
    if (!citation.source.trim()) issues.push(`${compound.id}: citation source is required`);
    if (!/^https:\/\//.test(citation.url)) issues.push(`${compound.id}: citation URLs must be HTTPS`);
  });

  compound.dosePresets.forEach((preset) => {
    if (preset.intent === 'recommendation') issues.push(`${compound.id}: dose presets cannot be recommendations`);
    if (!preset.sourceNote.trim()) issues.push(`${compound.id}: dose preset sourceNote is required`);
    if (!doseUnits.includes(preset.unit)) issues.push(`${compound.id}: invalid dose preset unit`);
  });

  compound.vialPresets.forEach((preset) => {
    if (!preset.sourceNote.trim()) issues.push(`${compound.id}: vial preset sourceNote is required`);
    if (preset.totalAmount && !doseUnits.includes(preset.totalAmount.unit)) {
      issues.push(`${compound.id}: invalid vial preset total amount unit`);
    }
  });

  if (compound.concentrationMode === 'reconstituted' && !compound.reconstitutionDefaults) {
    issues.push(`${compound.id}: reconstituted compounds require reconstitutionDefaults`);
  }

  if (compound.concentrationMode === 'concentration' && !compound.vialPresets.some((preset) => preset.concentration)) {
    issues.push(`${compound.id}: concentration compounds require at least one concentration vial preset`);
  }

  if (recommendationLanguage.test(JSON.stringify(compound))) {
    issues.push(`${compound.id}: contains medical recommendation language`);
  }

  return issues;
}
