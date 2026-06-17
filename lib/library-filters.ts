import type { Compound, CompoundCategory, CompoundType, Peptide, PeptideCategory } from './types';
import { getLibraryEvidenceDisplay, type LibraryEvidenceFilter } from './library-evidence';

export interface LibraryFilterOptions {
  search: string;
  category: PeptideCategory | 'all';
}

export interface CompoundLibraryFilterOptions {
  search: string;
  category: CompoundCategory | 'all';
  compoundType: CompoundType | 'all';
  evidence?: LibraryEvidenceFilter;
}

function searchableText(peptide: Peptide): string {
  return [
    peptide.name,
    peptide.category,
    peptide.defaultRoute,
    peptide.beginnerSummary,
    peptide.researcherDetails,
    peptide.mechanism,
    peptide.protocols.join(' '),
    peptide.safety,
    peptide.storage,
  ].join(' ').toLowerCase();
}

export function filterPeptides(peptides: Peptide[], options: LibraryFilterOptions): Peptide[] {
  const search = options.search.trim().toLowerCase();

  return peptides.filter((peptide) => {
    const matchesSearch = search.length === 0 || searchableText(peptide).includes(search);
    const matchesCategory = options.category === 'all' || peptide.category === options.category;
    return matchesSearch && matchesCategory;
  });
}

function searchableCompoundText(compound: Compound): string {
  return [
    compound.name,
    compound.aliases.join(' '),
    compound.compoundType,
    compound.category,
    compound.defaultRoute,
    compound.supportedRoutes.join(' '),
    compound.defaultDoseUnit,
    compound.concentrationMode,
    compound.beginnerSummary,
    compound.researcherDetails,
    compound.mechanism ?? '',
    compound.safety,
    compound.storage,
    compound.source,
  ].join(' ').toLowerCase();
}

export function filterCompounds(compounds: Compound[], options: CompoundLibraryFilterOptions): Compound[] {
  const search = options.search.trim().toLowerCase();

  return compounds.filter((compound) => {
    if (compound.deletedAt) return false;
    const matchesSearch = search.length === 0 || searchableCompoundText(compound).includes(search);
    const matchesCategory = options.category === 'all' || compound.category === options.category;
    const matchesType = options.compoundType === 'all' || compound.compoundType === options.compoundType;
    const matchesEvidence = !options.evidence || options.evidence === 'all' || getLibraryEvidenceDisplay(compound).filter === options.evidence;
    return matchesSearch && matchesCategory && matchesType && matchesEvidence;
  });
}
