import type { ReferenceCompound } from '../schema';

export const hghSomatropin: ReferenceCompound = {
  id: 'hgh-somatropin',
  name: 'hGH / Somatropin',
  aliases: ['Somatropin', 'Recombinant human growth hormone', 'rhGH'],
  compoundType: 'hormone',
  category: 'hormone-endocrine',
  defaultRoute: 'subq',
  supportedRoutes: ['subq'],
  defaultDoseUnit: 'iu',
  concentrationMode: 'prefilled',
  dosePresets: [],
  vialPresets: [
    {
      label: '10 mg / 1.5 mL cartridge',
      concentration: { value: 6.67, unit: 'mg/ml' },
      volumeMl: 1.5,
      sourceNote: 'Label concentration for reference logging only.',
      citationIds: ['dailymed-norditropin'],
    },
  ],
  conversion: {
    iuPerMg: 3,
    notes: 'Biological activity conversions are product-specific; PeptideOS stores IU selections without generic substitution.',
  },
  beginnerSummary: 'Recombinant human growth hormone is a hormone/endocrine compound tracked separately from peptide research compounds.',
  researcherDetails: 'Somatropin is recombinant human growth hormone. Reference metadata focuses on identity, route, labeling units, and storage context for tracking.',
  mechanism: 'Binds growth hormone receptors and supports downstream endocrine signaling including IGF-1 mediated pathways.',
  safety: 'Hormone/endocrine compound. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage varies by product labeling; keep product-specific label instructions attached to the actual container.',
  citations: [
    {
      id: 'dailymed-norditropin',
      title: 'NORDITROPIN- somatropin injection, solution label',
      url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=1058e17c-9261-459c-a3e6-fae38d196c14',
      source: 'DailyMed',
      year: 2025,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
