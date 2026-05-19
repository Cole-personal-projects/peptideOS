import { describe, expect, it } from 'vitest';
import { filterPeptides } from './library-filters';
import type { Peptide } from './types';

const peptides: Peptide[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'healing',
    defaultRoute: 'subq',
    halfLifeHours: 4,
    beginnerSummary: 'Research compound for tissue repair.',
    researcherDetails: 'Angiogenesis and nitric oxide pathway details.',
    mechanism: 'Growth factor expression.',
    protocols: ['250mcg daily'],
    safety: 'Research use only.',
    storage: 'Refrigerate.',
    citations: [],
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    category: 'metabolic',
    defaultRoute: 'subq',
    halfLifeHours: 168,
    beginnerSummary: 'GLP-1 agonist for metabolic research.',
    researcherDetails: 'Incretin receptor activity.',
    mechanism: 'GLP-1 receptor activation.',
    protocols: ['0.25mg weekly'],
    safety: 'Research use only.',
    storage: 'Refrigerate.',
    citations: [],
  },
  {
    id: 'hgh',
    name: 'hGH (Somatropin)',
    category: 'growth',
    defaultRoute: 'subq',
    halfLifeHours: 3,
    beginnerSummary: 'Growth hormone research compound.',
    researcherDetails: 'Somatropin and IGF-1 signaling.',
    mechanism: 'GH receptor activation.',
    protocols: ['2 IU daily'],
    safety: 'Research use only.',
    storage: 'Refrigerate.',
    citations: [],
  },
];

describe('library filters', () => {
  it('filters peptides by name and searchable research text', () => {
    expect(filterPeptides(peptides, { search: 'sema', category: 'all' }).map((peptide) => peptide.id)).toEqual([
      'semaglutide',
    ]);
    expect(filterPeptides(peptides, { search: 'nitric oxide', category: 'all' }).map((peptide) => peptide.id)).toEqual([
      'bpc-157',
    ]);
    expect(filterPeptides(peptides, { search: '2 iu', category: 'all' }).map((peptide) => peptide.id)).toEqual([
      'hgh',
    ]);
  });

  it('filters peptides by category without changing order', () => {
    expect(filterPeptides(peptides, { search: '', category: 'healing' }).map((peptide) => peptide.id)).toEqual([
      'bpc-157',
    ]);
  });

  it('combines search and category filters and returns an empty list when nothing matches', () => {
    expect(filterPeptides(peptides, { search: 'glp', category: 'metabolic' }).map((peptide) => peptide.id)).toEqual([
      'semaglutide',
    ]);
    expect(filterPeptides(peptides, { search: 'glp', category: 'healing' })).toEqual([]);
  });
});
