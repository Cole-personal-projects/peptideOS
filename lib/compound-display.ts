import type { CompoundCategory, CompoundType } from './types';

export const libraryCategoryOptions: Array<CompoundCategory | 'all'> = [
  'all',
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

export const libraryCompoundTypeOptions: Array<CompoundType | 'all'> = [
  'all',
  'peptide',
  'hormone',
  'glp-1',
  'small-molecule',
  'biologic',
  'supplement',
  'other',
];

export function formatCompoundDisplayLabel(value: string): string {
  return value.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
