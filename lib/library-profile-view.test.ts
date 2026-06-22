import { describe, expect, it } from 'vitest';
import { buildLibraryProfileViewModel } from './library-profile-view';
import { referenceCompounds } from './reference-compounds';

function compound(id: string) {
  const value = referenceCompounds.find((entry) => entry.id === id);
  if (!value) throw new Error(`Missing reference compound ${id}`);
  return value;
}

describe('library profile view model', () => {
  it('makes beginner mode task-first instead of pro-evidence-first', () => {
    const tirzepatide = buildLibraryProfileViewModel(compound('tirzepatide'), { researcherMode: false });

    expect(tirzepatide.modeLabel).toBe('Beginner view');
    expect(tirzepatide.atAGlance).toEqual(expect.arrayContaining([
      { label: 'Evidence', value: 'Approved Label' },
      { label: 'Status', value: 'Approved' },
      { label: 'Route', value: 'SUBQ' },
      { label: 'Form', value: 'Prefilled' },
      { label: 'Default unit', value: 'MG' },
    ]));
    expect(tirzepatide.sections.map((section) => section.title)).toEqual([
      'Plain-language brief',
      'Start by verifying',
      'Track in PeptideOS',
      'Useful first actions',
      'Inventory and storage',
      'Safety note',
    ]);
    expect(tirzepatide.sections.find((section) => section.title === 'Start by verifying')?.tone).toBe('warning');
    expect(tirzepatide.sections.find((section) => section.title === 'Track in PeptideOS')?.items.length).toBeGreaterThan(0);
    expect(tirzepatide.sections.map((section) => section.title)).not.toContain('Clinical evidence');
  });

  it('makes experienced mode evidence-first with mechanisms and source detail', () => {
    const bpc157 = buildLibraryProfileViewModel(compound('bpc-157'), { researcherMode: true });

    expect(bpc157.modeLabel).toBe('Experienced tracker view');
    expect(bpc157.atAGlance).toEqual(expect.arrayContaining([
      { label: 'Evidence', value: 'Preclinical' },
      { label: 'Route', value: 'SUBQ' },
      { label: 'Source', value: 'Reference' },
    ]));
    const sectionTitles = bpc157.sections.map((section) => section.title);
    expect(sectionTitles).toEqual(expect.arrayContaining([
      'Mechanism and targets',
      'Clinical evidence',
      'Evidence transparency',
      'Storage',
      'Safety',
    ]));
    expect(sectionTitles).not.toEqual(expect.arrayContaining([
      'Plain-language brief',
      'Start by verifying',
      'Track in PeptideOS',
      'Useful first actions',
    ]));
    expect(bpc157.sections.find((section) => section.title === 'Clinical evidence')?.items.length).toBeGreaterThan(0);
  });

  it('keeps AHK-Cu topical data prominent in experienced mode', () => {
    const ahkCu = buildLibraryProfileViewModel(compound('ahk-cu'), { researcherMode: true });

    expect(ahkCu.atAGlance).toEqual(expect.arrayContaining([
      { label: 'Evidence', value: 'Preclinical' },
      { label: 'Route', value: 'TOPICAL' },
      { label: 'Form', value: 'None' },
    ]));
    expect(ahkCu.sections.find((section) => section.title === 'Storage')?.items.join(' ')).toContain(
      'Finished topical AHK-Cu products',
    );
    expect(ahkCu.sections.find((section) => section.title === 'Safety')?.items.join(' ')).toContain(
      'Label confusion with GHK-Cu',
    );
  });
});
