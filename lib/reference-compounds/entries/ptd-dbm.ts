import type { ReferenceCompound } from '../schema';

export const ptdDbm: ReferenceCompound = {
  id: 'ptd-dbm',
  name: 'PTD-DBM',
  aliases: ['Protein transduction domain-derived Dishevelled-binding motif', 'PTD DBM'],
  compoundType: 'peptide',
  category: 'skin-hair',
  defaultRoute: 'topical',
  supportedRoutes: ['topical'],
  defaultDoseUnit: 'mg',
  concentrationMode: 'none',
  dosePresets: [],
  vialPresets: [],
  beginnerSummary: 'A peptide-like research compound commonly discussed in hair and Wnt-pathway research contexts.',
  researcherDetails: 'PTD-DBM is indexed by PubChem as a defined compound. PeptideOS includes it as reference metadata only, with no protocol guidance.',
  mechanism: 'Studied in Wnt/beta-catenin pathway research contexts involving Dishevelled-binding motifs.',
  safety: 'Research compound context. This entry is not medical advice or use guidance.',
  storage: 'Storage depends on formulation and supplier label.',
  citations: [
    {
      id: 'pubchem-ptd-dbm',
      title: 'PTD-DBM compound summary',
      url: 'https://pubchem.ncbi.nlm.nih.gov/compound/176453931',
      source: 'PubChem',
      year: 2026,
    },
  ],
  source: 'bundled',
  curationStatus: 'reviewed',
};
