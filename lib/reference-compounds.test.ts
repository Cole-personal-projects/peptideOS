import { describe, expect, test } from 'vitest';
import { referenceCompounds, validateReferenceCompound } from './reference-compounds';

describe('reference compounds', () => {
  const coreReferenceIds = [
    'hgh-somatropin',
    'testosterone-cypionate',
    'testosterone-enanthate',
    'testosterone-propionate',
    'bpc-157',
    'tb-500',
    'ghk-cu',
  ];

  test('ships only reviewed reference compounds with valid schema fields', () => {
    expect(referenceCompounds.length).toBeGreaterThanOrEqual(2);

    referenceCompounds.forEach((compound) => {
      expect(validateReferenceCompound(compound)).toEqual([]);
      expect(compound.source).toBe('bundled');
      expect(compound.curationStatus).toBe('reviewed');
      expect(compound.id).toMatch(/^[a-z0-9-]+$/);
      expect(compound.supportedRoutes).toContain(compound.defaultRoute);
      expect(compound.citations.length).toBeGreaterThan(0);
      compound.citations.forEach((citation) => {
        expect(citation.url).toMatch(/^https:\/\//);
        expect(citation.title).toBeTruthy();
        expect(citation.source).toBeTruthy();
      });
    });
  });

  test('keeps reference compound identifiers, names, and aliases unique', () => {
    const ids = referenceCompounds.map((compound) => compound.id);
    const names = referenceCompounds.map((compound) => compound.name.toLowerCase());
    const aliases = referenceCompounds.flatMap((compound) => compound.aliases.map((alias) => alias.toLowerCase()));

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(aliases).size).toBe(aliases.length);
  });

  test('seeds the first reviewed core reference library', () => {
    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(coreReferenceIds));
    expect(referenceCompounds.length).toBeGreaterThanOrEqual(coreReferenceIds.length);
  });

  test('includes reviewed batch one expansion entries across core categories', () => {
    const batchOneIds = [
      'cjc-1295',
      'ipamorelin',
      'tesamorelin',
      'semaglutide',
      'tirzepatide',
      'ibutamoren',
      'nad-plus',
      'bremelanotide',
    ];
    const batchOne = referenceCompounds.filter((compound) => batchOneIds.includes(compound.id));

    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(batchOneIds));
    expect(batchOne).toHaveLength(batchOneIds.length);
    expect(new Set(batchOne.map((compound) => compound.category))).toEqual(new Set([
      'growth-hormone',
      'metabolic',
      'longevity',
      'sexual-reproductive',
    ]));
  });

  test('includes reviewed batch two expansion entries across core categories', () => {
    const batchTwoIds = [
      'kpv',
      'll-37',
      'mots-c',
      'aicar',
      'epitalon',
      'semax',
      'selank',
      'aod-9604',
    ];
    const batchTwo = referenceCompounds.filter((compound) => batchTwoIds.includes(compound.id));

    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(batchTwoIds));
    expect(batchTwo).toHaveLength(batchTwoIds.length);
    expect(new Set(batchTwo.map((compound) => compound.category))).toEqual(new Set([
      'healing',
      'immune',
      'metabolic',
      'longevity',
      'cognitive',
    ]));
  });

  test('includes reviewed batch three expansion entries across core categories', () => {
    const batchThreeIds = [
      'retatrutide',
      'sermorelin',
      'gonadorelin',
      'hcg',
      'dihexa',
      'pinealon',
      'ahk-cu',
    ];
    const batchThree = referenceCompounds.filter((compound) => batchThreeIds.includes(compound.id));

    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(batchThreeIds));
    expect(batchThree).toHaveLength(batchThreeIds.length);
    expect(new Set(batchThree.map((compound) => compound.category))).toEqual(new Set([
      'metabolic',
      'growth-hormone',
      'hormone-endocrine',
      'cognitive',
      'longevity',
      'skin-hair',
    ]));
  });

  test('uses approved generated records to override stale bundled entries', () => {
    const ahkCu = referenceCompounds.find((compound) => compound.id === 'ahk-cu');

    expect(ahkCu?.supportedRoutes).toEqual(['topical']);
    expect(ahkCu?.concentrationMode).toBe('none');
    expect(ahkCu?.referenceProfile?.biohackerBrief.headline).toBe(
      'Topical-first copper peptide with preclinical hair-follicle signal.',
    );
    expect(ahkCu?.referenceProfile?.evidenceTier).toBe('preclinical');
    expect(ahkCu?.citations.map((citation) => citation.id)).toEqual([
      'src-pubchem-ahk-cu',
      'src-pyo-2007-ahk-cu-hair',
    ]);
  });

  test('uses Retatrutide as the reviewed flagship for pro-grade library data', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');

    expect(retatrutide).toBeDefined();
    expect(retatrutide?.referenceProfile).toEqual(expect.objectContaining({
      evidenceTier: 'phase-3-topline',
      regulatoryStatus: expect.objectContaining({
        status: 'investigational',
        region: 'US',
      }),
    }));
    expect(retatrutide?.referenceProfile?.mechanismTargets).toEqual([
      'GLP-1 receptor',
      'GIP receptor',
      'glucagon receptor',
    ]);
    expect(retatrutide?.referenceProfile?.clinicalEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        design: 'phase-2-randomized-controlled-trial',
        population: expect.stringContaining('obesity'),
      }),
      expect.objectContaining({
        design: 'phase-3-program',
        population: expect.stringContaining('obesity'),
      }),
    ]));
    expect(retatrutide?.referenceProfile?.peptideOSActions).toEqual(expect.arrayContaining([
      expect.stringContaining('Log labeled doses'),
      expect.stringContaining('Track inventory'),
    ]));
    expect(retatrutide?.referenceProfile?.biohackerBrief).toEqual(expect.objectContaining({
      headline: expect.stringContaining('triple-agonist'),
      realityCheck: expect.stringContaining('not a gray-market vial'),
    }));
    expect(retatrutide?.referenceProfile?.biohackerBrief.whyPeopleCare).toEqual(expect.arrayContaining([
      expect.stringContaining('GLP-1'),
      expect.stringContaining('phase 3'),
    ]));
    expect(retatrutide?.referenceProfile?.biohackerBrief.verifyBeforeUse).toEqual(expect.arrayContaining([
      expect.stringContaining('lot'),
      expect.stringContaining('concentration'),
    ]));
    expect(retatrutide?.libraryClassification).toEqual(expect.objectContaining({
      categoryGroup: 'GLP-1',
      protocolCategories: expect.arrayContaining(['weight-loss']),
    }));
    expect(retatrutide?.inventoryProfile).toEqual(expect.objectContaining({
      containerTypes: ['lyophilized-vial'],
      requiredFields: expect.arrayContaining(['vial amount', 'lot number', 'source']),
    }));
    expect(retatrutide?.calculatorProfile).toEqual(expect.objectContaining({
      reconstitutionCompatible: true,
      typicalBacWaterMl: [1, 2],
    }));
    expect(retatrutide?.protocolTemplates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'retatrutide-triple-agonist',
        name: 'Triple Agonist',
        doseChips: expect.arrayContaining([
          { value: 4, unit: 'mg', label: '4' },
        ]),
      }),
    ]));
    expect(retatrutide?.peppiActions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'build-retatrutide-protocol',
        type: 'build_protocol_preview',
        requiresConfirmation: true,
      }),
    ]));
  });

  test('upgrades the first priority batch to full pro-grade profiles', () => {
    const firstPriorityBatch = [
      ['tirzepatide', 'approved-label', 'approved'],
      ['semaglutide', 'approved-label', 'approved'],
      ['bpc-157', 'preclinical', 'unknown'],
      ['tb-500', 'identity-only', 'unknown'],
      ['mots-c', 'preclinical', 'unknown'],
    ] as const;

    firstPriorityBatch.forEach(([id, evidenceTier, status]) => {
      const compound = referenceCompounds.find((entry) => entry.id === id);

      expect(compound, id).toBeDefined();
      expect(compound?.referenceProfile, id).toEqual(expect.objectContaining({
        evidenceTier,
        regulatoryStatus: expect.objectContaining({ status }),
      }));
      expect(compound?.referenceProfile?.biohackerBrief.headline.length, id).toBeGreaterThan(20);
      expect(compound?.referenceProfile?.biohackerBrief.whyPeopleCare.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.biohackerBrief.verifyBeforeUse.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.biohackerBrief.trackInApp.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.clinicalEvidence.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.safetySignals.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.practicalNotes.length, id).toBeGreaterThanOrEqual(3);
      expect(compound?.referenceProfile?.evidenceGaps.length, id).toBeGreaterThanOrEqual(2);
      expect(compound?.referenceProfile?.peptideOSActions.length, id).toBeGreaterThanOrEqual(1);
    });
  });

  test('ships a complete pro-grade profile for every bundled reference compound', () => {
    referenceCompounds.forEach((compound) => {
      expect(compound.referenceProfile, compound.id).toEqual(expect.objectContaining({
        evidenceTier: expect.any(String),
        reviewSummary: expect.any(String),
        regulatoryStatus: expect.objectContaining({
          status: expect.any(String),
          region: expect.any(String),
          summary: expect.any(String),
        }),
      }));
      expect(compound.referenceProfile?.biohackerBrief.headline.length, compound.id).toBeGreaterThan(40);
      expect(compound.referenceProfile?.biohackerBrief.whyPeopleCare.length, compound.id).toBeGreaterThanOrEqual(2);
      expect(compound.referenceProfile?.biohackerBrief.verifyBeforeUse.length, compound.id).toBeGreaterThanOrEqual(2);
      expect(compound.referenceProfile?.biohackerBrief.trackInApp.length, compound.id).toBeGreaterThanOrEqual(2);
      expect(compound.referenceProfile?.mechanismTargets.length, compound.id).toBeGreaterThanOrEqual(1);
      expect(compound.referenceProfile?.clinicalEvidence.length, compound.id).toBeGreaterThanOrEqual(1);
      expect(compound.referenceProfile?.safetySignals.length, compound.id).toBeGreaterThanOrEqual(1);
      expect(compound.referenceProfile?.practicalNotes.length, compound.id).toBeGreaterThanOrEqual(3);
      expect(compound.referenceProfile?.evidenceGaps.length, compound.id).toBeGreaterThanOrEqual(1);
      expect(compound.referenceProfile?.peptideOSActions.length, compound.id).toBeGreaterThanOrEqual(1);
    });
  });

  test('includes hormone-adjacent compounds users expect to track', () => {
    const hormoneIds = [
      'testosterone-cypionate',
      'testosterone-enanthate',
      'testosterone-propionate',
      'hcg',
      'enclomiphene',
    ];

    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(hormoneIds));
    hormoneIds.forEach((id) => {
      const compound = referenceCompounds.find((entry) => entry.id === id);

      expect(compound, id).toEqual(expect.objectContaining({
        category: 'hormone-endocrine',
        curationStatus: 'reviewed',
      }));
      expect(compound?.referenceProfile?.biohackerBrief.verifyBeforeUse, id).toEqual(expect.arrayContaining([
        expect.stringMatching(/label|lot|source|prescription|container/i),
      ]));
    });
  });

  test('includes reviewed batch four expansion entries across core categories', () => {
    const batchFourIds = [
      'elamipretide',
      'thymosin-alpha-1',
      'kisspeptin-10',
      'melanotan-ii',
      'dsip',
      'sirolimus',
      'metformin',
      'oxytocin',
      'ptd-dbm',
      'foxo4-dri',
    ];
    const batchFour = referenceCompounds.filter((compound) => batchFourIds.includes(compound.id));

    expect(referenceCompounds.map((compound) => compound.id)).toEqual(expect.arrayContaining(batchFourIds));
    expect(batchFour).toHaveLength(batchFourIds.length);
    expect(new Set(batchFour.map((compound) => compound.category))).toEqual(new Set([
      'longevity',
      'immune',
      'hormone-endocrine',
      'skin-hair',
      'sleep',
      'metabolic',
    ]));
  });

  test('blocks medical recommendation language and fields from bundled entries', () => {
    const bannedCopy = /\b(recommended dose|should take|safe dose|dose recommendation)\b/i;

    referenceCompounds.forEach((compound) => {
      expect(compound).not.toHaveProperty('recommendedDose');
      expect(JSON.stringify(compound)).not.toMatch(bannedCopy);
      compound.dosePresets.forEach((preset) => {
        expect(preset.intent).not.toBe('recommendation');
        expect(preset.sourceNote).toBeTruthy();
      });
    });
  });

  test('supports hormones and concentration-mode compounds without modeling them as peptides', () => {
    const somatropin = referenceCompounds.find((compound) => compound.id === 'hgh-somatropin');
    const testosteroneCompounds = referenceCompounds.filter((compound) => compound.id.startsWith('testosterone-'));

    expect(somatropin).toEqual(expect.objectContaining({
      compoundType: 'hormone',
      category: 'hormone-endocrine',
      defaultDoseUnit: 'iu',
      concentrationMode: 'prefilled',
    }));
    testosteroneCompounds.forEach((compound) => {
      expect(compound).toEqual(expect.objectContaining({
        compoundType: 'hormone',
        category: 'hormone-endocrine',
        defaultDoseUnit: 'mg',
        concentrationMode: 'concentration',
      }));
      expect(compound.source).toBe('bundled');
    });
  });

  test('preserves workflow metadata when generated peptide records are content-only', () => {
    const peptideIds = ['bpc-157', 'tb-500', 'ghk-cu'];

    peptideIds.forEach((id) => {
      const compound = referenceCompounds.find((entry) => entry.id === id);

      expect(compound).toEqual(expect.objectContaining({
        compoundType: 'peptide',
        concentrationMode: 'reconstituted',
        source: 'bundled',
      }));
      expect(compound?.reconstitutionDefaults).toBeDefined();
      expect(compound?.referenceProfile?.biohackerBrief.verifyBeforeUse.length).toBeGreaterThanOrEqual(2);
    });

    expect(referenceCompounds.find((entry) => entry.id === 'ahk-cu')).toEqual(expect.objectContaining({
      compoundType: 'peptide',
      defaultRoute: 'topical',
      concentrationMode: 'none',
      source: 'bundled',
    }));
  });

  test('reports actionable issues for malformed reference entries', () => {
    const valid = referenceCompounds[0];
    const invalid = {
      ...valid,
      id: 'Bad ID',
      name: '',
      aliases: [''],
      compoundType: 'bad-type',
      category: 'bad-category',
      defaultRoute: 'bad-route',
      supportedRoutes: ['oral'],
      defaultDoseUnit: 'bad-unit',
      concentrationMode: 'concentration',
      source: 'user',
      curationStatus: 'draft',
      beginnerSummary: '',
      researcherDetails: '',
      safety: '',
      storage: '',
      citations: [{ id: '', title: '', url: 'http://example.com', source: '', year: 2026 }],
      dosePresets: [{
        label: 'Bad preset',
        value: 1,
        unit: 'bad-unit',
        intent: 'recommendation',
        sourceNote: '',
        citationIds: [],
      }],
      vialPresets: [{
        label: 'Bad vial',
        totalAmount: { value: 1, unit: 'bad-unit' },
        sourceNote: '',
        citationIds: [],
      }],
    } as never;

    const issues = validateReferenceCompound(invalid);

    expect(issues).toEqual(expect.arrayContaining([
      'Bad ID: id must be slug-safe',
      'Bad ID: name is required',
      'Bad ID: aliases cannot be blank',
      'Bad ID: invalid compoundType',
      'Bad ID: invalid category',
      'Bad ID: invalid defaultRoute',
      'Bad ID: supportedRoutes must include defaultRoute',
      'Bad ID: invalid defaultDoseUnit',
      'Bad ID: bundled reference compound must use bundled source',
      'Bad ID: app index only ships reviewed compounds',
      'Bad ID: citation URLs must be HTTPS',
      'Bad ID: dose presets cannot be recommendations',
      'Bad ID: concentration compounds require at least one concentration vial preset',
    ]));
  });

  test('requires reconstitution defaults for reconstituted reference compounds', () => {
    const invalid = {
      ...referenceCompounds[0],
      concentrationMode: 'reconstituted' as const,
      reconstitutionDefaults: undefined,
    };

    expect(validateReferenceCompound(invalid)).toContain(`${invalid.id}: reconstituted compounds require reconstitutionDefaults`);
  });

  test('allows cutting-edge profiles when weak evidence is transparent', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
    const emerging = {
      ...retatrutide!,
      id: 'emerging-test-compound',
      name: 'Emerging Test Compound',
      aliases: ['ETC-1'],
      citations: [],
      referenceProfile: {
        ...retatrutide!.referenceProfile!,
        evidenceTier: 'identity-only',
        reviewSummary: 'Early community interest only; PeptideOS can track it but cannot verify efficacy claims.',
        clinicalEvidence: [{
          design: 'community-reported',
          population: 'Biohacking community reports; no verified clinical population.',
          finding: 'Anecdotal reports exist, but reviewed source-backed human evidence is not available.',
          citationIds: [],
          sourceQuality: 'uncited-emerging',
          limitations: 'No source-backed human study or authoritative identity record is attached yet.',
        }],
        evidenceGaps: [
          'No authoritative identity source is attached.',
          'No reviewed clinical evidence is attached.',
          'Community reports may not match the compound, purity, dose, or route users actually have.',
        ],
        regulatoryStatus: {
          status: 'unknown',
          region: 'US',
          summary: 'No confirmed US regulatory status is attached; users should treat status as unknown.',
          citationIds: [],
          sourceQuality: 'uncited-emerging',
          limitations: 'Regulatory status has not been verified against an authoritative source.',
        },
      },
    } as never;

    expect(validateReferenceCompound(emerging)).toEqual([]);
  });

  test('requires limitation text when cutting-edge profiles are not citation-backed', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
    const opaque = {
      ...retatrutide!,
      id: 'opaque-emerging-compound',
      citations: [],
      referenceProfile: {
        ...retatrutide!.referenceProfile!,
        evidenceTier: 'identity-only',
        clinicalEvidence: [{
          design: 'community-reported',
          population: 'Biohacking community reports.',
          finding: 'Anecdotal reports exist.',
          citationIds: [],
          sourceQuality: 'community-reported',
          limitations: '',
        }],
        evidenceGaps: ['No reviewed clinical evidence is attached.'],
        regulatoryStatus: {
          status: 'unknown',
          region: 'US',
          summary: 'No confirmed US regulatory status is attached.',
          citationIds: [],
          sourceQuality: 'uncited-emerging',
          limitations: '',
        },
      },
    } as never;

    expect(validateReferenceCompound(opaque)).toEqual(expect.arrayContaining([
      'opaque-emerging-compound: reference profile field "clinicalEvidence" with weak evidence requires limitations',
      'opaque-emerging-compound: reference profile field "regulatoryStatus" with weak evidence requires limitations',
    ]));
  });

  test('requires pro-grade reference profile citations to resolve on the compound', () => {
    const retatrutide = referenceCompounds.find((compound) => compound.id === 'retatrutide');
    const invalid = {
      ...retatrutide!,
      citations: retatrutide!.citations.filter((citation) => citation.id !== 'clinicaltrials-retatrutide-triumph-5'),
    };

    expect(validateReferenceCompound(invalid)).toContain(
      'retatrutide: reference profile field "clinicalEvidence" references missing citation "clinicaltrials-retatrutide-triumph-5"',
    );
  });
});
