import { describe, expect, test } from 'vitest';
import { referenceCompounds, validateReferenceCompound } from './reference-compounds';

describe('reference compounds', () => {
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
    const testosteroneCypionate = referenceCompounds.find((compound) => compound.id === 'testosterone-cypionate');

    expect(somatropin).toEqual(expect.objectContaining({
      compoundType: 'hormone',
      category: 'hormone-endocrine',
      defaultDoseUnit: 'iu',
      concentrationMode: 'prefilled',
    }));
    expect(testosteroneCypionate).toEqual(expect.objectContaining({
      compoundType: 'hormone',
      category: 'hormone-endocrine',
      defaultDoseUnit: 'mg',
      concentrationMode: 'concentration',
    }));
    expect(testosteroneCypionate?.vialPresets.some((preset) => preset.concentration?.unit === 'mg/ml')).toBe(true);
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
