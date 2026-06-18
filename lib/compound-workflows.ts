import { canUseIU, quickPresets } from './peptide-conversions';
import type { AppData, Compound, DoseUnit, Peptide, Route } from './types';

export interface TrackableCompound {
  id: string;
  name: string;
  defaultRoute: Route;
  supportedRoutes: Route[];
  defaultDoseUnit: DoseUnit;
  concentrationMode: Compound['concentrationMode'];
  dosePresets: Compound['dosePresets'];
  vialPresets: Compound['vialPresets'];
  source: Compound['source'] | 'legacy';
}

export interface WorkflowDosePreset {
  id: string;
  label: string;
  doseValue: number;
  doseUnit: DoseUnit;
}

function fromPeptide(peptide: Peptide): TrackableCompound {
  return {
    id: peptide.id,
    name: peptide.name,
    defaultRoute: peptide.defaultRoute,
    supportedRoutes: [peptide.defaultRoute],
    defaultDoseUnit: canUseIU(peptide.id) ? 'iu' : peptide.id === 'tb-500' ? 'mg' : 'mcg',
    concentrationMode: 'reconstituted',
    dosePresets: [],
    vialPresets: [],
    source: 'legacy',
  };
}

function fromCompound(compound: Compound): TrackableCompound {
  return {
    id: compound.id,
    name: compound.name,
    defaultRoute: compound.defaultRoute,
    supportedRoutes: compound.supportedRoutes,
    defaultDoseUnit: compound.defaultDoseUnit,
    concentrationMode: compound.concentrationMode,
    dosePresets: compound.dosePresets,
    vialPresets: compound.vialPresets,
    source: compound.source,
  };
}

export function getTrackableCompounds(data: Pick<AppData, 'peptides' | 'compounds'>): TrackableCompound[] {
  const compoundsById = new Map<string, TrackableCompound>();

  data.peptides.forEach((peptide) => {
    compoundsById.set(peptide.id, fromPeptide(peptide));
  });

  data.compounds
    .filter((compound) => !compound.deletedAt)
    .forEach((compound) => {
      compoundsById.set(compound.id, fromCompound(compound));
    });

  return Array.from(compoundsById.values());
}

export function getAllowedWorkflowDoseUnits(compound: TrackableCompound | undefined): DoseUnit[] {
  if (!compound) return ['mcg', 'mg'];
  if (compound.defaultDoseUnit === 'iu' || canUseIU(compound.id)) return ['iu', 'mg', 'mcg'];
  if (compound.defaultDoseUnit === 'mg') return ['mg', 'mcg'];
  return ['mcg', 'mg'];
}

export function getWorkflowDosePresets(compound: TrackableCompound | undefined): WorkflowDosePreset[] {
  if (!compound) return [];

  const legacyPresets = quickPresets
    .filter((preset) => preset.compoundId === compound.id)
    .map(({ id, label, doseValue, doseUnit }) => ({ id, label, doseValue, doseUnit }));
  const compoundPresets = compound.dosePresets.map((preset, index) => ({
    id: `${compound.id}-preset-${index}`,
    label: preset.label,
    doseValue: preset.value,
    doseUnit: preset.unit,
  }));

  return [...legacyPresets, ...compoundPresets];
}

export function isReconstitutableCompound(compound: TrackableCompound | undefined): boolean {
  return compound?.concentrationMode === 'reconstituted';
}
