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
      'sexual-reproductive',
      'cognitive',
      'skin-hair',
    ]));
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
      'sexual-reproductive',
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
      expect(compound.vialPresets.some((preset) => preset.concentration?.unit === 'mg/ml')).toBe(true);
    });
  });

  test('models lyophilized peptide-style entries as reconstituted tracking records', () => {
    const peptideIds = ['bpc-157', 'tb-500', 'ghk-cu'];

    peptideIds.forEach((id) => {
      const compound = referenceCompounds.find((entry) => entry.id === id);

      expect(compound).toEqual(expect.objectContaining({
        compoundType: 'peptide',
        concentrationMode: 'reconstituted',
      }));
      expect(compound?.reconstitutionDefaults?.typicalVialAmounts.length).toBeGreaterThan(0);
      expect(compound?.reconstitutionDefaults?.typicalBacWaterMl.length).toBeGreaterThan(0);
    });
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
});
