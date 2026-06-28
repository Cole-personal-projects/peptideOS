import { describe, expect, it } from 'vitest';
import { filterCompounds, filterPeptides } from './library-filters';
import { referenceCompounds } from './reference-compounds';
import type { Compound, Peptide } from './types';

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

const compounds: Compound[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    aliases: ['Body Protection Compound 157'],
    compoundType: 'peptide',
    category: 'healing',
    defaultRoute: 'subq',
    supportedRoutes: ['subq'],
    defaultDoseUnit: 'mcg',
    concentrationMode: 'reconstituted',
    dosePresets: [],
    vialPresets: [],
    beginnerSummary: 'Research compound for tissue repair.',
    researcherDetails: 'Angiogenesis and nitric oxide pathway details.',
    safety: 'Research use only.',
    storage: 'Refrigerate.',
    citations: [],
    source: 'bundled',
    curationStatus: 'reviewed',
  },
  {
    id: 'testosterone-cypionate',
    name: 'Testosterone Cypionate',
    aliases: ['Depo-Testosterone'],
    compoundType: 'hormone',
    category: 'hormone-endocrine',
    defaultRoute: 'im',
    supportedRoutes: ['im'],
    defaultDoseUnit: 'mg',
    concentrationMode: 'concentration',
    dosePresets: [],
    vialPresets: [],
    beginnerSummary: 'Hormone/endocrine tracking entry.',
    researcherDetails: 'Androgen receptor activity.',
    mechanism: 'Androgen receptor ligand.',
    safety: 'Tracking only.',
    storage: 'Follow label.',
    citations: [],
    source: 'bundled',
    curationStatus: 'reviewed',
  },
  {
    id: 'custom-cognitive',
    name: 'Custom Cognitive Compound',
    aliases: ['CCC'],
    compoundType: 'small-molecule',
    category: 'cognitive',
    defaultRoute: 'oral',
    supportedRoutes: ['oral'],
    defaultDoseUnit: 'mg',
    concentrationMode: 'none',
    dosePresets: [],
    vialPresets: [],
    beginnerSummary: 'User-created nootropic tracker.',
    researcherDetails: 'User notes mention focus and recall.',
    safety: 'User safety notes.',
    storage: 'Room temperature.',
    citations: [],
    source: 'user',
    curationStatus: 'draft',
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

describe('library alphabetical ordering', () => {
  it('sorts peptide and compound results by display name', () => {
    expect(filterPeptides(peptides, { search: '', category: 'all' }).map((peptide) => peptide.name)).toEqual([
      'BPC-157',
      'hGH (Somatropin)',
      'Semaglutide',
    ]);
    expect(filterCompounds(compounds, { search: '', category: 'all', compoundType: 'all' }).map((compound) => compound.name)).toEqual([
      'BPC-157',
      'Custom Cognitive Compound',
      'Testosterone Cypionate',
    ]);
  });
});

describe('compound library filters', () => {
  it('filters compounds by name, aliases, and research text', () => {
    expect(filterCompounds(compounds, { search: 'depo', category: 'all', compoundType: 'all' }).map((compound) => compound.id)).toEqual([
      'testosterone-cypionate',
    ]);
    expect(filterCompounds(compounds, { search: 'nitric oxide', category: 'all', compoundType: 'all' }).map((compound) => compound.id)).toEqual([
      'bpc-157',
    ]);
  });

  it('filters compounds by category and compound type without changing order', () => {
    expect(filterCompounds(compounds, { search: '', category: 'healing', compoundType: 'all' }).map((compound) => compound.id)).toEqual([
      'bpc-157',
    ]);
    expect(filterCompounds(compounds, { search: '', category: 'all', compoundType: 'hormone' }).map((compound) => compound.id)).toEqual([
      'testosterone-cypionate',
    ]);
  });

  it('combines compound search, category, and type filters', () => {
    expect(filterCompounds(compounds, { search: 'focus', category: 'cognitive', compoundType: 'small-molecule' }).map((compound) => compound.id)).toEqual([
      'custom-cognitive',
    ]);
    expect(filterCompounds(compounds, { search: 'focus', category: 'cognitive', compoundType: 'peptide' })).toEqual([]);
  });

  it('omits soft-deleted custom compounds', () => {
    expect(filterCompounds([
      ...compounds,
      { ...compounds[2], id: 'deleted-custom', deletedAt: '2026-05-24T00:00:00.000Z' },
    ], { search: 'focus', category: 'all', compoundType: 'all' }).map((compound) => compound.id)).toEqual([
      'custom-cognitive',
    ]);
  });

  it('filters compounds by PeptideOS evidence band', () => {
    expect(filterCompounds(referenceCompounds, {
      search: '',
      category: 'all',
      compoundType: 'all',
      evidence: 'strong-human',
    }).map((compound) => compound.id)).toContain('retatrutide');

    const approvedIds = filterCompounds(referenceCompounds, {
      search: '',
      category: 'all',
      compoundType: 'all',
      evidence: 'approved-label',
    }).map((compound) => compound.id);

    expect(approvedIds).toContain('semaglutide');
    expect(approvedIds).not.toContain('retatrutide');
  });
});
