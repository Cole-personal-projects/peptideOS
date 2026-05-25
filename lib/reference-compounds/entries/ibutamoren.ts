import type { ReferenceCompound } from '../schema';

export const ibutamoren: ReferenceCompound = {
  id: 'ibutamoren',
  name: 'MK-677 / Ibutamoren',
  aliases: ['MK-677', 'Ibutamoren mesylate'],
  compoundType: 'small-molecule',
  category: 'growth-hormone',
  defaultRoute: 'oral',
  supportedRoutes: ['oral'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [
    {
      label: 'Capsule bottle or powder container',
      sourceNote: 'Container preset for inventory tracking only; verify amount and form from the actual container label.',
      citationIds: ['pubchem-ibutamoren'],
    },
  ],
  beginnerSummary: 'An oral small molecule tracked in growth-hormone secretagogue research contexts.',
  researcherDetails: 'Ibutamoren is represented as a small-molecule reference entry for identity, route, and container tracking metadata.',
  mechanism: 'Studied as a ghrelin receptor agonist and growth hormone secretagogue.',
  safety: 'Research small molecule. This reference entry supports tracking context only and is not treatment guidance.',
  storage: 'Storage depends on formulation and container; keep product-specific label instructions attached to the actual product.',
  citations: [
    {
      id: 'pubchem-ibutamoren',
      title: 'Ibutamoren compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/178024',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
