import type { Peptide, PeptideCategory } from './types';

export interface LibraryFilterOptions {
  search: string;
  category: PeptideCategory | 'all';
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
