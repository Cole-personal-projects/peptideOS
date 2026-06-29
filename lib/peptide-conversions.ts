// Compound-aware IU/mass conversion table
// IU (International Units) measure biological activity, mg measures mass
// Conversion ratios are compound-specific and standardized
import { referenceCompounds } from './reference-compounds';
import type { Compound, DoseUnit } from './types';

export type DosingMode = 'mass-only' | 'iu-primary' | 'mcg-only';

export interface PeptideConversion {
  id: string;
  name: string;
  dosingMode: DosingMode;
  iuPerMg?: number; // Only for IU compounds
  defaultUnit: 'mg' | 'mcg' | 'iu';
  typicalVialSizes: { value: number; unit: 'mg' | 'iu' }[];
  typicalDoseRange: { min: number; max: number; unit: 'mcg' | 'mg' | 'iu' };
  notes?: string;
}

const curatedPeptideConversions: PeptideConversion[] = [
  // IU-Primary Compounds
  {
    id: 'hgh',
    name: 'hGH (Somatropin)',
    dosingMode: 'iu-primary',
    iuPerMg: 3,
    defaultUnit: 'iu',
    typicalVialSizes: [
      { value: 10, unit: 'iu' },
      { value: 12, unit: 'iu' },
      { value: 16, unit: 'iu' },
      { value: 36, unit: 'iu' },
      { value: 100, unit: 'iu' },
    ],
    typicalDoseRange: { min: 1, max: 10, unit: 'iu' },
    notes: 'Pharmaceutical hGH is standardized at 3 IU/mg. Generic Chinese hGH may vary (2.7-3.3 IU/mg).',
  },
  {
    id: 'hcg',
    name: 'HCG',
    dosingMode: 'iu-primary',
    iuPerMg: 6000,
    defaultUnit: 'iu',
    typicalVialSizes: [
      { value: 5000, unit: 'iu' },
      { value: 10000, unit: 'iu' },
    ],
    typicalDoseRange: { min: 250, max: 1000, unit: 'iu' },
    notes: 'Human Chorionic Gonadotropin. Activity varies by preparation.',
  },
  {
    id: 'fsh',
    name: 'FSH',
    dosingMode: 'iu-primary',
    iuPerMg: 13500,
    defaultUnit: 'iu',
    typicalVialSizes: [
      { value: 75, unit: 'iu' },
      { value: 150, unit: 'iu' },
    ],
    typicalDoseRange: { min: 75, max: 300, unit: 'iu' },
    notes: 'Follicle Stimulating Hormone.',
  },
  {
    id: 'oxytocin',
    name: 'Oxytocin',
    dosingMode: 'iu-primary',
    iuPerMg: 500,
    defaultUnit: 'iu',
    typicalVialSizes: [
      { value: 10, unit: 'iu' },
      { value: 100, unit: 'iu' },
    ],
    typicalDoseRange: { min: 5, max: 40, unit: 'iu' },
    notes: 'Intranasal or injectable.',
  },
  {
    id: 'insulin',
    name: 'Insulin',
    dosingMode: 'iu-primary',
    iuPerMg: 28,
    defaultUnit: 'iu',
    typicalVialSizes: [
      { value: 100, unit: 'iu' },
      { value: 1000, unit: 'iu' },
    ],
    typicalDoseRange: { min: 1, max: 20, unit: 'iu' },
    notes: 'Standard: ~28 IU/mg. U-100 insulin = 100 IU/mL.',
  },
  
  // Mass-Only Compounds (no IU conversion)
  {
    id: 'bpc-157',
    name: 'BPC-157',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
      { value: 10, unit: 'mg' },
    ],
    typicalDoseRange: { min: 100, max: 500, unit: 'mcg' },
    notes: 'Synthetic peptide. No standardized IU activity.',
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 2, unit: 'mg' },
      { value: 5, unit: 'mg' },
      { value: 10, unit: 'mg' },
    ],
    typicalDoseRange: { min: 2, max: 10, unit: 'mg' },
    notes: 'Thymosin Beta-4 fragment.',
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 50, unit: 'mg' },
      { value: 100, unit: 'mg' },
    ],
    typicalDoseRange: { min: 1, max: 4, unit: 'mg' },
    notes: 'Copper peptide complex.',
  },
  {
    id: 'kpv',
    name: 'KPV',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 100, max: 500, unit: 'mcg' },
    notes: 'Alpha-MSH derived tripeptide.',
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 2, unit: 'mg' },
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 1, max: 2, unit: 'mg' },
    notes: 'FDA-approved GHRH analog.',
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 2, unit: 'mg' },
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 100, max: 300, unit: 'mcg' },
    notes: 'With or without DAC.',
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 2, unit: 'mg' },
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 100, max: 300, unit: 'mcg' },
    notes: 'Selective GHRP.',
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 3, unit: 'mg' },
      { value: 5, unit: 'mg' },
      { value: 10, unit: 'mg' },
    ],
    typicalDoseRange: { min: 0.25, max: 2.4, unit: 'mg' },
    notes: 'GLP-1 agonist. Titrate slowly.',
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
      { value: 10, unit: 'mg' },
      { value: 15, unit: 'mg' },
    ],
    typicalDoseRange: { min: 2.5, max: 15, unit: 'mg' },
    notes: 'Dual GIP/GLP-1 agonist.',
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 10, unit: 'mg' },
      { value: 50, unit: 'mg' },
    ],
    typicalDoseRange: { min: 5, max: 10, unit: 'mg' },
    notes: 'Tetrapeptide. Cycled dosing.',
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    dosingMode: 'mass-only',
    defaultUnit: 'mg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
      { value: 10, unit: 'mg' },
    ],
    typicalDoseRange: { min: 5, max: 15, unit: 'mg' },
    notes: 'Mitochondrial peptide.',
  },
  {
    id: 'selank',
    name: 'Selank',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 250, max: 1000, unit: 'mcg' },
    notes: 'Anxiolytic peptide.',
  },
  {
    id: 'semax',
    name: 'Semax',
    dosingMode: 'mass-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 5, unit: 'mg' },
    ],
    typicalDoseRange: { min: 200, max: 1000, unit: 'mcg' },
    notes: 'Nootropic peptide.',
  },
  
  // mcg-only Compounds
  {
    id: 'igf-1-lr3',
    name: 'IGF-1 LR3',
    dosingMode: 'mcg-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 1, unit: 'mg' },
    ],
    typicalDoseRange: { min: 20, max: 100, unit: 'mcg' },
    notes: 'Long-acting IGF-1 analog. mcg dosing only.',
  },
  {
    id: 'igf-1-des',
    name: 'IGF-1 DES',
    dosingMode: 'mcg-only',
    defaultUnit: 'mcg',
    typicalVialSizes: [
      { value: 1, unit: 'mg' },
    ],
    typicalDoseRange: { min: 20, max: 100, unit: 'mcg' },
    notes: 'Truncated IGF-1. Very potent, mcg dosing only.',
  },
];

function normalizeVialAmount(amount: { value: number; unit: DoseUnit }): { value: number; unit: 'mg' | 'iu' } | null {
  if (amount.unit === 'iu') return { value: amount.value, unit: 'iu' };
  if (amount.unit === 'mg') return { value: amount.value, unit: 'mg' };
  if (amount.unit === 'mcg') return { value: amount.value / 1000, unit: 'mg' };
  return null;
}

function getFallbackDoseRange(compound: Compound): PeptideConversion['typicalDoseRange'] {
  const firstPreset = compound.dosePresets[0];
  if (firstPreset) {
    return {
      min: firstPreset.value,
      max: firstPreset.value,
      unit: firstPreset.unit,
    };
  }

  const unit = compound.defaultDoseUnit === 'iu' ? 'iu' : compound.defaultDoseUnit === 'mg' ? 'mg' : 'mcg';
  return {
    min: 0.001,
    max: 1000000,
    unit,
  };
}

function toGeneratedConversion(compound: Compound): PeptideConversion | null {
  if (compound.concentrationMode !== 'reconstituted' || !compound.reconstitutionDefaults) return null;

  const typicalVialSizes = compound.reconstitutionDefaults.typicalVialAmounts
    .map(normalizeVialAmount)
    .filter((amount): amount is { value: number; unit: 'mg' | 'iu' } => Boolean(amount));

  if (typicalVialSizes.length === 0) return null;

  const dosingMode: DosingMode = compound.defaultDoseUnit === 'iu' || compound.conversion?.iuPerMg
    ? 'iu-primary'
    : 'mass-only';

  return {
    id: compound.id,
    name: compound.name,
    dosingMode,
    iuPerMg: compound.conversion?.iuPerMg,
    defaultUnit: compound.defaultDoseUnit === 'iu' ? 'iu' : compound.defaultDoseUnit === 'mg' ? 'mg' : 'mcg',
    typicalVialSizes,
    typicalDoseRange: getFallbackDoseRange(compound),
    notes: compound.conversion?.notes ?? 'Generated from PeptideOS reference-library reconstitution metadata.',
  };
}

function buildPeptideConversions(): PeptideConversion[] {
  const conversionsById = new Map(curatedPeptideConversions.map((conversion) => [conversion.id, conversion]));

  referenceCompounds
    .map(toGeneratedConversion)
    .filter((conversion): conversion is PeptideConversion => Boolean(conversion))
    .forEach((conversion) => {
      if (!conversionsById.has(conversion.id)) {
        conversionsById.set(conversion.id, conversion);
      }
    });

  return Array.from(conversionsById.values());
}

export const peptideConversions: PeptideConversion[] = buildPeptideConversions();

// Syringe types with their specifications
export interface SyringeType {
  id: string;
  name: string;
  totalVolumeMl: number;
  totalUnits: number;
  unitsPerMl: number;
  tickIntervalUnits: number;
}

export const syringeTypes: SyringeType[] = [
  {
    id: 'u100-1ml',
    name: 'Insulin U-100 (1mL/100u)',
    totalVolumeMl: 1,
    totalUnits: 100,
    unitsPerMl: 100,
    tickIntervalUnits: 2,
  },
  {
    id: 'u100-0.5ml',
    name: 'Insulin U-100 (0.5mL/50u)',
    totalVolumeMl: 0.5,
    totalUnits: 50,
    unitsPerMl: 100,
    tickIntervalUnits: 1,
  },
  {
    id: 'u100-0.3ml',
    name: 'Insulin U-100 (0.3mL/30u)',
    totalVolumeMl: 0.3,
    totalUnits: 30,
    unitsPerMl: 100,
    tickIntervalUnits: 1,
  },
  {
    id: 'u40',
    name: 'Insulin U-40 (1mL/40u)',
    totalVolumeMl: 1,
    totalUnits: 40,
    unitsPerMl: 40,
    tickIntervalUnits: 1,
  },
];

// Quick presets
export interface QuickPreset {
  id: string;
  label: string;
  compoundId: string;
  doseValue: number;
  doseUnit: 'mcg' | 'mg' | 'iu';
  category: 'mass' | 'iu';
}

export const quickPresets: QuickPreset[] = [
  // Mass-based row
  { id: 'bpc-250', label: 'BPC-157 250mcg', compoundId: 'bpc-157', doseValue: 250, doseUnit: 'mcg', category: 'mass' },
  { id: 'tb-2mg', label: 'TB-500 2mg', compoundId: 'tb-500', doseValue: 2, doseUnit: 'mg', category: 'mass' },
  { id: 'ghk-2mg', label: 'GHK-Cu 2mg', compoundId: 'ghk-cu', doseValue: 2, doseUnit: 'mg', category: 'mass' },
  { id: 'ipa-200', label: 'Ipamorelin 200mcg', compoundId: 'ipamorelin', doseValue: 200, doseUnit: 'mcg', category: 'mass' },
  { id: 'tesa-1mg', label: 'Tesamorelin 1mg', compoundId: 'tesamorelin', doseValue: 1, doseUnit: 'mg', category: 'mass' },
  
  // IU-based row
  { id: 'hgh-2iu', label: 'hGH 2 IU (beginner)', compoundId: 'hgh', doseValue: 2, doseUnit: 'iu', category: 'iu' },
  { id: 'hgh-4iu', label: 'hGH 4 IU (intermediate)', compoundId: 'hgh', doseValue: 4, doseUnit: 'iu', category: 'iu' },
  { id: 'hcg-500', label: 'HCG 500 IU', compoundId: 'hcg', doseValue: 500, doseUnit: 'iu', category: 'iu' },
  { id: 'hcg-250', label: 'HCG 250 IU', compoundId: 'hcg', doseValue: 250, doseUnit: 'iu', category: 'iu' },
];

// Helper functions
export function getConversionById(id: string): PeptideConversion | undefined {
  return peptideConversions.find(p => p.id === id);
}

export function canUseIU(compoundId: string): boolean {
  const compound = getConversionById(compoundId);
  return compound?.dosingMode === 'iu-primary';
}

export function convertMgToIU(compoundId: string, mg: number): number | null {
  const compound = getConversionById(compoundId);
  if (!compound?.iuPerMg) return null;
  return mg * compound.iuPerMg;
}

export function convertIUToMg(compoundId: string, iu: number): number | null {
  const compound = getConversionById(compoundId);
  if (!compound?.iuPerMg) return null;
  return iu / compound.iuPerMg;
}

export function convertMcgToMg(mcg: number): number {
  return mcg / 1000;
}

export function convertMgToMcg(mg: number): number {
  return mg * 1000;
}

// Educational content
export const educationalContent = {
  bacWater: {
    title: 'What is BAC water?',
    content: 'Bacteriostatic water (BAC water) is sterile water containing 0.9% benzyl alcohol as a preservative. It prevents bacterial growth, allowing multi-dose use of reconstituted peptides. Never use regular water or saline for peptides intended for multiple uses.',
  },
  mgVsIU: {
    title: 'mg vs IU explained',
    content: 'Milligrams (mg) measure mass - how much physical substance is present. International Units (IU) measure biological activity - how potent the compound is. The conversion varies per compound because different peptides have different potencies per unit of mass. For example, 1mg of hGH equals 3 IU, while 1mg of HCG equals 6000 IU.',
  },
  syringeUnits: {
    title: 'Syringe units vs IU dose',
    content: 'CRITICAL: The "unit" markings on an insulin syringe are VOLUMETRIC measurements, not International Units (IU). A U-100 syringe has 100 unit marks per 1mL of liquid. Example: To inject 2 IU of hGH reconstituted at 10 IU/mL, you need 0.2mL, which equals 20 syringe units on a U-100 syringe. The syringe units and IU dose are NOT the same number unless your concentration happens to match!',
  },
  whyIU: {
    title: 'Why does hGH come in IU?',
    content: 'Historically, biological substances like hormones were standardized by their effect on living tissue, not their mass. This allowed for consistent dosing despite manufacturing variations. The WHO maintains reference standards for IU conversions. While modern analytical methods can measure mass precisely, IU dosing persists because it directly relates to biological effect and allows comparison across different preparations.',
  },
};
