import { normalizeStacks } from './schedules';
import { referenceCompounds } from './reference-compounds';
import type { AppData, Peptide, Vial, Dose, Stack } from './types';

// Helper to generate dates
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const mockPeptides: Peptide[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    category: 'healing',
    defaultRoute: 'subq',
    halfLifeHours: 4,
    beginnerSummary: 'A synthetic peptide derived from a protective protein found in gastric juice. Widely researched for tissue healing and gut health.',
    researcherDetails: 'Body Protection Compound-157 is a pentadecapeptide consisting of 15 amino acids. It exhibits cytoprotective and wound healing properties through multiple mechanisms including modulation of the nitric oxide system, growth factor expression, and angiogenesis.',
    mechanism: 'BPC-157 works by upregulating growth hormone receptors, promoting angiogenesis, and modulating the nitric oxide system. It also influences the dopaminergic and serotonergic systems.',
    protocols: ['Standard: 250-500mcg 1-2x daily', 'Acute injury: 500mcg 2x daily for 4-6 weeks', 'Maintenance: 250mcg daily'],
    safety: 'Generally well-tolerated in research settings. No significant adverse effects reported in animal studies. Human clinical trials are limited.',
    storage: 'Store lyophilized at -20°C. Reconstituted peptide stable for 3-4 weeks refrigerated.',
    citations: [
      { id: 'c1', title: 'Pentadecapeptide BPC 157 and its effects on a nitric oxide system', url: '#', source: 'Curr Pharm Des', year: 2014 },
      { id: 'c2', title: 'BPC 157 healing effects on different wound types', url: '#', source: 'J Physiol Pharmacol', year: 2018 }
    ]
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    category: 'healing',
    defaultRoute: 'subq',
    halfLifeHours: 6,
    beginnerSummary: 'A synthetic version of thymosin beta-4, a protein naturally occurring in human and animal cells. Researched for tissue repair and flexibility.',
    researcherDetails: 'TB-500 is a synthetic peptide of the protein thymosin beta-4. It promotes cell migration, blood vessel growth, and wound healing through its interaction with actin.',
    mechanism: 'TB-500 upregulates actin, a cell-building protein essential for healing and cell migration. It promotes angiogenesis and reduces inflammation.',
    protocols: ['Loading: 2-2.5mg 2x weekly for 4-6 weeks', 'Maintenance: 2mg monthly', 'Acute: 5-10mg weekly split doses'],
    safety: 'Limited human data. Animal studies show good tolerability. May theoretically affect tumor growth.',
    storage: 'Store lyophilized at -20°C or refrigerated. Reconstituted stable 2-3 weeks refrigerated.',
    citations: [
      { id: 'c3', title: 'Thymosin beta 4 and wound healing', url: '#', source: 'Ann N Y Acad Sci', year: 2010 }
    ]
  },
  {
    id: 'ghk-cu',
    name: 'GHK-Cu',
    category: 'aesthetic',
    defaultRoute: 'subq',
    halfLifeHours: 12,
    beginnerSummary: 'A copper peptide naturally found in human plasma. Researched for skin regeneration, hair growth, and anti-aging properties.',
    researcherDetails: 'GHK-Cu is a tripeptide with a strong affinity for copper. It modulates gene expression, promoting tissue remodeling and anti-inflammatory effects.',
    mechanism: 'Resets gene expression to a healthier state, promotes collagen and glycosaminoglycan synthesis, and has antioxidant properties.',
    protocols: ['Injectable: 1-2mg daily', 'Topical: 1-3% cream/serum', 'Mesotherapy: 50-100mg/ml'],
    safety: 'Well-tolerated topically. Injectable use less studied in humans. Copper overload theoretically possible.',
    storage: 'Store lyophilized refrigerated. Reconstituted stable 2-3 weeks refrigerated.',
    citations: [
      { id: 'c4', title: 'GHK peptide as a natural modulator of multiple cellular pathways', url: '#', source: 'Biomed Res Int', year: 2018 }
    ]
  },
  {
    id: 'kpv',
    name: 'KPV',
    category: 'healing',
    defaultRoute: 'oral',
    halfLifeHours: 2,
    beginnerSummary: 'A tripeptide derived from alpha-MSH with potent anti-inflammatory properties. Researched for gut inflammation and IBD.',
    researcherDetails: 'KPV is the C-terminal tripeptide of alpha-melanocyte-stimulating hormone. It retains the anti-inflammatory properties without melanogenic activity.',
    mechanism: 'Inhibits NF-κB signaling, reducing pro-inflammatory cytokine production. Particularly effective in gut epithelial cells.',
    protocols: ['Oral: 200-500mcg daily', 'Sublingual: 100-200mcg', 'Rectal: 200mcg for gut-specific effects'],
    safety: 'Good safety profile in available research. No significant adverse effects noted.',
    storage: 'Store lyophilized refrigerated. Reconstituted stable 1-2 weeks.',
    citations: [
      { id: 'c5', title: 'Anti-inflammatory properties of KPV tripeptide', url: '#', source: 'J Biol Chem', year: 2015 }
    ]
  },
  {
    id: 'semaglutide',
    name: 'Semaglutide',
    category: 'metabolic',
    defaultRoute: 'subq',
    halfLifeHours: 168,
    beginnerSummary: 'A GLP-1 receptor agonist approved for type 2 diabetes and weight management. Long-acting with once-weekly dosing.',
    researcherDetails: 'Semaglutide is a modified GLP-1 analog with enhanced albumin binding and DPP-4 resistance, resulting in extended half-life.',
    mechanism: 'Activates GLP-1 receptors, enhancing insulin secretion, suppressing glucagon, slowing gastric emptying, and reducing appetite.',
    protocols: ['Start: 0.25mg weekly for 4 weeks', 'Titrate: 0.5mg, then 1mg, then 2.4mg weekly', 'Maintenance: 1-2.4mg weekly'],
    safety: 'FDA approved. Common side effects: nausea, vomiting, diarrhea. Rare: pancreatitis, gallbladder issues.',
    storage: 'Refrigerate. Stable at room temp for 28 days. Do not freeze.',
    citations: [
      { id: 'c6', title: 'Once-Weekly Semaglutide in Adults with Overweight or Obesity', url: '#', source: 'NEJM', year: 2021 }
    ]
  },
  {
    id: 'cjc-1295',
    name: 'CJC-1295',
    category: 'growth',
    defaultRoute: 'subq',
    halfLifeHours: 144,
    beginnerSummary: 'A growth hormone releasing hormone analog that extends GH pulse duration. Often combined with GHRP peptides.',
    researcherDetails: 'CJC-1295 is a tetrasubstituted GHRH(1-29) analog with Drug Affinity Complex (DAC) technology for extended half-life through albumin binding.',
    mechanism: 'Stimulates pituitary GHRH receptors, amplifying natural GH pulsatility without desensitization.',
    protocols: ['With DAC: 1-2mg weekly', 'No DAC (MOD-GRF): 100mcg 2-3x daily', 'Often stacked with Ipamorelin'],
    safety: 'May cause water retention, numbness, fatigue. Long-term safety data limited.',
    storage: 'Store lyophilized frozen. Reconstituted stable 3-4 weeks refrigerated.',
    citations: [
      { id: 'c7', title: 'Prolonged stimulation of GH by CJC-1295', url: '#', source: 'J Clin Endocrinol Metab', year: 2006 }
    ]
  },
  {
    id: 'ipamorelin',
    name: 'Ipamorelin',
    category: 'growth',
    defaultRoute: 'subq',
    halfLifeHours: 2,
    beginnerSummary: 'A selective growth hormone secretagogue that stimulates GH release without affecting cortisol or prolactin.',
    researcherDetails: 'Ipamorelin is a pentapeptide GHRP that selectively binds ghrelin receptors in the pituitary, producing clean GH release.',
    mechanism: 'Selective ghrelin receptor agonist that triggers GH release without significant hunger stimulation or cortisol/prolactin elevation.',
    protocols: ['Standard: 100-300mcg 2-3x daily', 'Pre-bed: 200-300mcg for sleep/recovery', 'Stack: 100mcg with CJC-1295'],
    safety: 'Well-tolerated. May cause transient head rush, water retention. Minimal hunger increase.',
    storage: 'Store lyophilized refrigerated or frozen. Reconstituted stable 3-4 weeks refrigerated.',
    citations: [
      { id: 'c8', title: 'Ipamorelin, a new growth hormone secretagogue', url: '#', source: 'Eur J Endocrinol', year: 1999 }
    ]
  },
  {
    id: 'tesamorelin',
    name: 'Tesamorelin',
    category: 'growth',
    defaultRoute: 'subq',
    halfLifeHours: 0.5,
    beginnerSummary: 'An FDA-approved GHRH analog for HIV-associated lipodystrophy. Reduces visceral adipose tissue.',
    researcherDetails: 'Tesamorelin is a stabilized synthetic GHRH analog that stimulates physiological GH secretion patterns.',
    mechanism: 'Binds GHRH receptors, stimulating pulsatile GH release and reducing trunk fat accumulation.',
    protocols: ['FDA dosing: 2mg daily', 'Research: 1-2mg daily', 'Cycle: 8-12 weeks on, 4 weeks off'],
    safety: 'FDA approved. Side effects: injection site reactions, joint pain, peripheral edema.',
    storage: 'Refrigerate. Reconstituted stable 14 days.',
    citations: [
      { id: 'c9', title: 'Tesamorelin for visceral fat reduction', url: '#', source: 'JAMA', year: 2010 }
    ]
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    category: 'longevity',
    defaultRoute: 'subq',
    halfLifeHours: 3,
    beginnerSummary: 'A tetrapeptide that may activate telomerase, potentially extending cellular lifespan. Researched for anti-aging.',
    researcherDetails: 'Epithalon (AEDG) is a synthetic pineal peptide that stimulates telomerase activity and melatonin production.',
    mechanism: 'Activates telomerase in somatic cells, potentially extending telomere length and cellular replicative capacity.',
    protocols: ['Standard: 5-10mg daily for 10-20 days', 'Cycle: 10 days on, 4-6 months off', 'Annual: 2-3 cycles per year'],
    safety: 'Limited human data. Animal studies show good tolerability and longevity extension.',
    storage: 'Store lyophilized frozen. Reconstituted stable 2 weeks refrigerated.',
    citations: [
      { id: 'c10', title: 'Peptide regulation of aging: 35-year research experience', url: '#', source: 'Bull Exp Biol Med', year: 2020 }
    ]
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    category: 'metabolic',
    defaultRoute: 'subq',
    halfLifeHours: 8,
    beginnerSummary: 'A mitochondrial-derived peptide that improves metabolic homeostasis and exercise capacity.',
    researcherDetails: 'MOTS-c is encoded in the mitochondrial 12S rRNA and acts as a metabolic regulator and exercise mimetic.',
    mechanism: 'Activates AMPK pathway, improves glucose uptake, enhances fatty acid oxidation, and promotes metabolic flexibility.',
    protocols: ['Standard: 5-10mg weekly', 'Split dosing: 5mg 2-3x weekly', 'Pre-exercise: 5mg 30-60 min prior'],
    safety: 'Emerging research. Generally well-tolerated in early studies.',
    storage: 'Store lyophilized frozen. Very sensitive to heat.',
    citations: [
      { id: 'c11', title: 'MOTS-c: A novel mitochondrial-derived peptide', url: '#', source: 'Cell Metab', year: 2015 }
    ]
  },
  {
    id: 'selank',
    name: 'Selank',
    category: 'cognitive',
    defaultRoute: 'intranasal',
    halfLifeHours: 0.5,
    beginnerSummary: 'A synthetic peptide derived from tuftsin with anxiolytic and nootropic properties. Researched for anxiety and cognitive enhancement.',
    researcherDetails: 'Selank is a heptapeptide combining tuftsin with a Pro-Gly-Pro sequence for enhanced stability and BBB penetration.',
    mechanism: 'Modulates GABA, serotonin, dopamine, and norepinephrine systems. Enhances BDNF expression.',
    protocols: ['Intranasal: 250-500mcg 2-3x daily', 'Injectable: 250-500mcg 1-2x daily', 'Acute anxiety: 500mcg as needed'],
    safety: 'Approved in Russia. No significant side effects reported. Non-addictive.',
    storage: 'Store lyophilized refrigerated. Nasal solution stable 2-4 weeks refrigerated.',
    citations: [
      { id: 'c12', title: 'Selank: anxiolytic with a nootropic component', url: '#', source: 'Neuropsychiatr Dis Treat', year: 2009 }
    ]
  },
  {
    id: 'tirzepatide',
    name: 'Tirzepatide',
    category: 'metabolic',
    defaultRoute: 'subq',
    halfLifeHours: 120,
    beginnerSummary: 'A dual GIP/GLP-1 receptor agonist approved for type 2 diabetes and weight loss. More effective than semaglutide in trials.',
    researcherDetails: 'Tirzepatide is a novel dual incretin agonist that activates both GIP and GLP-1 receptors with biased signaling.',
    mechanism: 'Dual receptor activation produces synergistic effects on insulin secretion, appetite suppression, and fat metabolism.',
    protocols: ['Start: 2.5mg weekly for 4 weeks', 'Titrate: 5mg → 7.5mg → 10mg → 12.5mg → 15mg', 'Maintenance: 10-15mg weekly'],
    safety: 'FDA approved. Similar side effect profile to GLP-1 agonists. GI effects common during titration.',
    storage: 'Refrigerate. Stable at room temp for 21 days.',
    citations: [
      { id: 'c13', title: 'Tirzepatide versus Semaglutide for weight loss', url: '#', source: 'NEJM', year: 2022 }
    ]
  },
  {
    id: 'hgh',
    name: 'hGH (Somatropin)',
    category: 'growth',
    defaultRoute: 'subq',
    halfLifeHours: 3,
    beginnerSummary: 'A recombinant human growth hormone preparation typically dosed by biological activity in IU.',
    researcherDetails: 'Somatropin is recombinant human growth hormone with compound-specific IU-to-mass conversion metadata. PeptideOS preserves IU as the selected logging unit.',
    mechanism: 'Binds growth hormone receptors and stimulates downstream IGF-1 signaling and anabolic metabolic pathways.',
    protocols: ['Beginner: 1-2 IU daily', 'Intermediate: 3-4 IU daily', 'Advanced protocols require careful monitoring'],
    safety: 'Monitor glucose, edema, joint discomfort, and other GH-related adverse effects. Use medical supervision.',
    storage: 'Refrigerate according to preparation instructions. Reconstituted stability depends on product labeling.',
    citations: [
      { id: 'c14', title: 'Somatropin prescribing information', url: '#', source: 'FDA Label', year: 2024 }
    ]
  }
];

export const mockVials: Vial[] = [
  {
    id: 'vial-1',
    name: 'BPC-157 active vial',
    peptideId: 'bpc-157',
    dateAdded: daysAgo(28),
    source: 'PeptideSciences',
    lotNumber: 'BPC-2024-001',
    mg: 5,
    bacWaterMl: 2,
    reconstitutedDate: daysAgo(14),
    expirationDate: daysFromNow(14),
    status: 'active'
  },
  {
    id: 'vial-2',
    name: 'TB-500 loading vial',
    peptideId: 'tb-500',
    dateAdded: daysAgo(21),
    source: 'PeptideSciences',
    lotNumber: 'TB5-2024-042',
    mg: 5,
    bacWaterMl: 2,
    reconstitutedDate: daysAgo(7),
    expirationDate: daysFromNow(21),
    status: 'active'
  },
  {
    id: 'vial-3',
    name: 'Ipamorelin bedtime vial',
    peptideId: 'ipamorelin',
    dateAdded: daysAgo(14),
    source: 'CanLab',
    lotNumber: 'IPA-2024-103',
    mg: 5,
    bacWaterMl: 2.5,
    reconstitutedDate: daysAgo(3),
    expirationDate: daysFromNow(25),
    status: 'active'
  },
  {
    id: 'vial-4',
    name: 'CJC-1295 stack vial',
    peptideId: 'cjc-1295',
    dateAdded: daysAgo(14),
    source: 'CanLab',
    lotNumber: 'CJC-2024-088',
    mg: 2,
    bacWaterMl: 2,
    reconstitutedDate: daysAgo(5),
    expirationDate: daysFromNow(23),
    status: 'active'
  },
  {
    id: 'vial-5',
    name: 'GHK-Cu sealed vial',
    peptideId: 'ghk-cu',
    dateAdded: daysAgo(10),
    source: 'PureRawz',
    lotNumber: 'GHK-2024-015',
    mg: 10,
    bacWaterMl: 0,
    reconstitutedDate: null,
    expirationDate: daysFromNow(180),
    status: 'sealed'
  },
  {
    id: 'vial-6',
    name: 'Epitalon sealed vial',
    peptideId: 'epitalon',
    dateAdded: daysAgo(10),
    source: 'PureRawz',
    lotNumber: 'EPI-2024-007',
    mg: 50,
    bacWaterMl: 0,
    reconstitutedDate: null,
    expirationDate: daysFromNow(365),
    status: 'sealed'
  },
  {
    id: 'vial-7',
    name: 'hGH active vial',
    peptideId: 'hgh',
    dateAdded: daysAgo(2),
    source: 'Pharmacy',
    lotNumber: 'HGH-2024-010',
    mg: 3.33,
    bacWaterMl: 1,
    reconstitutedDate: daysAgo(2),
    expirationDate: daysFromNow(26),
    status: 'active'
  }
];

// Generate 30 days of dose history
const generateDoseHistory = (): Dose[] => {
  const doses: Dose[] = [];
  const sites = [
    'abdomen-upper-left',
    'abdomen-upper-right',
    'abdomen-lower-left',
    'abdomen-lower-right',
    'thigh-front-upper-left',
    'thigh-front-upper-right',
  ] as const;
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // BPC-157 - twice daily
    if (i < 28) {
      doses.push({
        id: `dose-bpc-am-${i}`,
        peptideId: 'bpc-157',
        vialId: 'vial-1',
        dateTime: new Date(date.setHours(8, 0, 0, 0)).toISOString(),
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        site: sites[i % 6],
        notes: '',
        completed: true
      });
      doses.push({
        id: `dose-bpc-pm-${i}`,
        peptideId: 'bpc-157',
        vialId: 'vial-1',
        dateTime: new Date(date.setHours(20, 0, 0, 0)).toISOString(),
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        site: sites[(i + 1) % 6],
        notes: '',
        completed: true
      });
    }
    
    // TB-500 - twice weekly
    if (i % 3 === 0 && i < 21) {
      doses.push({
        id: `dose-tb500-${i}`,
        peptideId: 'tb-500',
        vialId: 'vial-2',
        dateTime: new Date(date.setHours(9, 0, 0, 0)).toISOString(),
        doseValue: 2.5,
        doseUnit: 'mg',
        route: 'subq',
        site: sites[i % 6],
        notes: i === 0 ? 'Loading phase' : '',
        completed: true
      });
    }
    
    // Ipamorelin - daily pre-bed
    if (i < 14) {
      doses.push({
        id: `dose-ipa-${i}`,
        peptideId: 'ipamorelin',
        vialId: 'vial-3',
        dateTime: new Date(date.setHours(22, 0, 0, 0)).toISOString(),
        doseValue: 200,
        doseUnit: 'mcg',
        route: 'subq',
        site: 'abdomen-lower-left',
        notes: '',
        completed: true
      });
    }
    
    // CJC-1295 - twice weekly with Ipamorelin
    if ((i === 0 || i === 3 || i === 7 || i === 10) && i < 14) {
      doses.push({
        id: `dose-cjc-${i}`,
        peptideId: 'cjc-1295',
        vialId: 'vial-4',
        dateTime: new Date(date.setHours(22, 5, 0, 0)).toISOString(),
        doseValue: 100,
        doseUnit: 'mcg',
        route: 'subq',
        site: 'abdomen-lower-right',
        notes: 'Stacked with Ipamorelin',
        completed: true
      });
    }
  }
  
  // Add today's planned doses (some completed, some not)
  const today = new Date();
  doses.push({
    id: 'dose-today-bpc-am',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: new Date(today.setHours(8, 0, 0, 0)).toISOString(),
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-left',
    notes: '',
    completed: true
  });
  doses.push({
    id: 'dose-today-bpc-pm',
    peptideId: 'bpc-157',
    vialId: 'vial-1',
    dateTime: new Date(today.setHours(20, 0, 0, 0)).toISOString(),
    doseValue: 250,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-upper-right',
    notes: '',
    completed: false
  });
  doses.push({
    id: 'dose-today-ipa',
    peptideId: 'ipamorelin',
    vialId: 'vial-3',
    dateTime: new Date(today.setHours(22, 0, 0, 0)).toISOString(),
    doseValue: 200,
    doseUnit: 'mcg',
    route: 'subq',
    site: 'abdomen-lower-left',
    notes: '',
    completed: false
  });
  
  return doses;
};

export const mockDoses: Dose[] = generateDoseHistory();

export const mockStacks: Stack[] = [
  {
    id: 'stack-1',
    name: 'Healing Protocol',
    description: 'Comprehensive healing stack for injury recovery and tissue repair',
    peptides: [
      { peptideId: 'bpc-157', doseValue: 250, doseUnit: 'mcg', frequency: '2x daily', route: 'subq', timing: 'Morning and evening' },
      { peptideId: 'tb-500', doseValue: 2.5, doseUnit: 'mg', frequency: '2x weekly', route: 'subq', timing: 'Monday and Thursday' }
    ],
    startDate: daysAgo(28),
    durationDays: 42,
    status: 'active',
    notes: 'Focus on rotator cuff recovery. Rotate injection sites. Monitor for any unusual reactions.'
  },
  {
    id: 'stack-2',
    name: 'Longevity + GH Protocol',
    description: 'Growth hormone optimization with longevity peptides',
    peptides: [
      { peptideId: 'ipamorelin', doseValue: 200, doseUnit: 'mcg', frequency: 'daily', route: 'subq', timing: 'Pre-bed' },
      { peptideId: 'cjc-1295', doseValue: 100, doseUnit: 'mcg', frequency: '2x weekly', route: 'subq', timing: 'With Ipamorelin on Mon/Thu' },
      { peptideId: 'epitalon', doseValue: 5, doseUnit: 'mg', frequency: 'daily', route: 'subq', timing: '10-day cycle, then 4 months off' }
    ],
    startDate: daysAgo(14),
    durationDays: 90,
    status: 'active',
    notes: 'Epitalon cycle: Days 1-10 only. Continue Ipa/CJC throughout. Assess IGF-1 at 6 weeks.'
  },
  {
    id: 'stack-3',
    name: 'Metabolic Reset',
    description: 'Weight management and metabolic optimization',
    peptides: [
      { peptideId: 'semaglutide', doseValue: 0.5, doseUnit: 'mg', frequency: 'weekly', route: 'subq', timing: 'Sunday morning' },
      { peptideId: 'mots-c', doseValue: 5, doseUnit: 'mg', frequency: '2x weekly', route: 'subq', timing: 'Pre-workout days' }
    ],
    startDate: daysFromNow(7),
    durationDays: 84,
    status: 'planned',
    notes: 'Start semaglutide at 250mcg and titrate up every 4 weeks. Monitor blood glucose.'
  }
];

export const initialAppData: AppData = {
  peptides: mockPeptides,
  compounds: [...referenceCompounds],
  vials: [],
  inventoryBatches: [],
  doses: [],
  stacks: [],
  schedules: [],
  scheduleLogs: [],
  reconstitutionCalculations: [],
  signalCheckIns: [],
  labReports: [],
  labResults: [],
  labImportAudits: [],
  hasSeenDisclaimer: false,
  hasCompletedOnboarding: false,
userMode: 'beginner',
biometricLock: false,
darkMode: true,
theme: 'graphite-dark',
cloudSyncEnabled: false
};
