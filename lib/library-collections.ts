import { formatCompoundDisplayLabel, libraryCategoryOptions } from './compound-display';
import type { Compound, CompoundCategory, CompoundType } from './types';

type LibraryCollectionKind = 'category' | 'compound-type';

interface LibraryCollectionBase {
  slug: string;
  label: string;
  description: string;
  kind: LibraryCollectionKind;
}

export interface CategoryLibraryCollection extends LibraryCollectionBase {
  kind: 'category';
  value: CompoundCategory;
}

export interface CompoundTypeLibraryCollection extends LibraryCollectionBase {
  kind: 'compound-type';
  value: CompoundType;
}

export type LibraryCollection = CategoryLibraryCollection | CompoundTypeLibraryCollection;

export type LibraryCollectionSummary = LibraryCollection & {
  count: number;
};

const categoryDescriptions: Partial<Record<CompoundCategory, string>> = {
  healing: 'Repair, recovery, and tissue-support compounds',
  'growth-hormone': 'Growth hormone axis and secretagogue workflows',
  metabolic: 'Metabolic, weight, and glucose-context compounds',
  longevity: 'Longevity, mitochondrial, and aging-interest compounds',
  cognitive: 'Cognitive, focus, and neuro-interest compounds',
  'skin-hair': 'Skin, hair, and cosmetic-support compounds',
  immune: 'Immune and host-defense compounds',
  sleep: 'Sleep and recovery-context compounds',
  'sexual-reproductive': 'Sexual and reproductive health compounds',
  'hormone-endocrine': 'Hormone and endocrine tracking compounds',
  custom: 'User-created compounds',
};

export const libraryCollections: LibraryCollection[] = [
  {
    slug: 'glp-1',
    label: 'GLP-1',
    description: 'GLP-1 and incretin-class compounds',
    kind: 'compound-type',
    value: 'glp-1',
  },
  ...libraryCategoryOptions
    .filter((category): category is CompoundCategory => category !== 'all')
    .map((category) => ({
      slug: category,
      label: formatCompoundDisplayLabel(category),
      description: categoryDescriptions[category] ?? `${formatCompoundDisplayLabel(category)} compounds`,
      kind: 'category' as const,
      value: category,
    })),
];

export function getLibraryCollection(slug: string): LibraryCollection | undefined {
  return libraryCollections.find((collection) => collection.slug === slug);
}

export function getLibraryCollectionCompounds(
  compounds: readonly Compound[],
  collection: LibraryCollection,
): Compound[] {
  return compounds.filter((compound) => {
    if (compound.deletedAt) return false;

    if (collection.kind === 'compound-type') {
      return compound.compoundType === collection.value;
    }

    return compound.category === collection.value;
  });
}

export function getVisibleLibraryCollectionSummaries(compounds: readonly Compound[]): LibraryCollectionSummary[] {
  return libraryCollections
    .map((collection) => ({
      ...collection,
      count: getLibraryCollectionCompounds(compounds, collection).length,
    }))
    .filter((collection) => collection.count > 0);
}
