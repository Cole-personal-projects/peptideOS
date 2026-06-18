import { describe, expect, it } from 'vitest';
import { buildLibraryProfileViewModel } from './library-profile-view';
import { referenceCompounds } from './reference-compounds';

function compound(id: string) {
  const value = referenceCompounds.find((entry) => entry.id === id);
  if (!value) throw new Error(`Missing reference compound ${id}`);
  return value;
}

describe('library profile view model', () => {
  it('builds one database-driven profile shape for approved-label, reconstituted, and pro-profile compounds', () => {
    const tirzepatide = buildLibraryProfileViewModel(compound('tirzepatide'), { researcherMode: false });
    const bpc157 = buildLibraryProfileViewModel(compound('bpc-157'), { researcherMode: false });
    const retatrutide = buildLibraryProfileViewModel(compound('retatrutide'), { researcherMode: true });

    expect(tirzepatide.atAGlance).toEqual(expect.arrayContaining([
      { label: 'Evidence', value: 'Approved Label' },
      { label: 'Status', value: 'Approved' },
      { label: 'Route', value: 'SUBQ' },
      { label: 'Form', value: 'Prefilled' },
    ]));
    expect(tirzepatide.sections.map((section) => section.title)).toEqual(expect.arrayContaining([
      'What you can do',
      'Peppi prompts',
      'Evidence and transparency',
      'Citations',
    ]));
    expect(tirzepatide.sections.find((section) => section.title === 'Peppi prompts')?.items).toEqual(expect.arrayContaining([
      'Add my labeled Tirzepatide container to inventory',
    ]));

    expect(bpc157.sections.find((section) => section.title === 'Inventory and math')?.items).toEqual(expect.arrayContaining([
      'Common vial amount presets: 5 mg.',
      'BAC water calculator presets: 1 mL, 2 mL.',
    ]));
    expect(bpc157.sections.find((section) => section.title === 'Tracking domains')?.items).toContain('Recovery or tissue-support notes');

    expect(retatrutide.atAGlance).toEqual(expect.arrayContaining([
      { label: 'Evidence', value: 'Strong Human' },
      { label: 'Status', value: 'Investigational' },
      { label: 'Mechanism', value: 'GLP-1 / GIP / Glucagon' },
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Evidence and transparency')?.items).toEqual(expect.arrayContaining([
      'No FDA-approved US prescribing label or consumer storage instructions.',
      'Some phase 3 results are company-announced/topline or not yet reflected in an FDA-approved label.',
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Field brief')?.items).toEqual(expect.arrayContaining([
      'A triple-agonist metabolic peptide people are watching because it may push past the current GLP-1/GIP ceiling.',
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Why people care')?.items).toEqual(expect.arrayContaining([
      'It hits GLP-1, GIP, and glucagon receptors instead of only one or two incretin pathways.',
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Regulatory context')?.items).toEqual(expect.arrayContaining([
      'Lilly describes Retatrutide as not FDA approved and investigational while phase 3 trials evaluate safety and efficacy.',
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Reality check')?.items).toEqual(expect.arrayContaining([
      'The clinical Retatrutide story is not a gray-market vial. PeptideOS should help the user track what they actually have, what they actually did, and what is still uncertain.',
    ]));
    expect(retatrutide.sections.find((section) => section.title === 'Evidence details')?.items.join(' ')).toContain('phase-2-randomized-controlled-trial');
  });
});
