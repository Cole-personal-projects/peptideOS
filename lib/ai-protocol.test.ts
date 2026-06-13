import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STACK_DURATION_DAYS,
  MAX_STACK_DURATION_DAYS,
  buildProtocolSystemPrompt,
  matchCompoundId,
  normalizeTimeOfDay,
  parsedProtocolSchema,
  parsedProtocolToStackDraft,
  type ParsedProtocol,
  type ProtocolCompoundInput,
} from './ai-protocol';

const compounds: ProtocolCompoundInput[] = [
  { id: 'bpc-157', name: 'BPC-157', defaultRoute: 'subq', supportedRoutes: ['subq', 'oral'], defaultDoseUnit: 'mcg' },
  { id: 'tb-500', name: 'TB-500', defaultRoute: 'subq', supportedRoutes: ['subq'], defaultDoseUnit: 'mg' },
  { id: 'hgh', name: 'HGH (Somatropin)', defaultRoute: 'subq', supportedRoutes: ['subq', 'im'], defaultDoseUnit: 'iu' },
];

function makeParsed(overrides: Partial<ParsedProtocol> = {}): ParsedProtocol {
  return {
    stackName: 'Healing Protocol',
    description: 'Recovery support',
    durationDays: 56,
    items: [
      {
        compoundId: 'bpc-157',
        compoundName: 'BPC-157',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        frequency: 'daily',
        timesOfDay: ['08:00', '20:00'],
        weekdays: null,
        notes: null,
      },
    ],
    warnings: [],
    ...overrides,
  };
}

describe('parsedProtocolSchema', () => {
  it('accepts a well-formed protocol', () => {
    expect(parsedProtocolSchema.parse(makeParsed())).toBeTruthy();
  });

  it('rejects unknown dose units', () => {
    const parsed = makeParsed();
    const invalid = { ...parsed, items: [{ ...parsed.items[0], doseUnit: 'ml' }] };
    expect(() => parsedProtocolSchema.parse(invalid)).toThrow();
  });
});

describe('buildProtocolSystemPrompt', () => {
  it('lists every compound with id, routes, and unit', () => {
    const prompt = buildProtocolSystemPrompt(compounds);
    expect(prompt).toContain('id: bpc-157');
    expect(prompt).toContain('supported routes: subq, oral');
    expect(prompt).toContain('default unit: iu');
  });

  it('forbids inventing doses', () => {
    expect(buildProtocolSystemPrompt(compounds)).toContain('Never invent');
  });
});

describe('matchCompoundId', () => {
  it('matches exact names case-insensitively', () => {
    expect(matchCompoundId('bpc 157', compounds)).toBe('bpc-157');
  });

  it('matches partial names', () => {
    expect(matchCompoundId('somatropin', compounds)).toBe('hgh');
  });

  it('returns null for unknown names and empty input', () => {
    expect(matchCompoundId('retatrutide', compounds)).toBeNull();
    expect(matchCompoundId('   ', compounds)).toBeNull();
  });
});

describe('normalizeTimeOfDay', () => {
  it('pads single-digit hours', () => {
    expect(normalizeTimeOfDay('8:00')).toBe('08:00');
  });

  it('keeps valid times unchanged', () => {
    expect(normalizeTimeOfDay('20:30')).toBe('20:30');
  });

  it('rejects out-of-range and malformed values', () => {
    expect(normalizeTimeOfDay('25:00')).toBeNull();
    expect(normalizeTimeOfDay('08:75')).toBeNull();
    expect(normalizeTimeOfDay('8 am')).toBeNull();
  });
});

describe('parsedProtocolToStackDraft', () => {
  it('builds a planned stack with normalized schedules', () => {
    const result = parsedProtocolToStackDraft(makeParsed(), compounds);

    expect(result.draft).not.toBeNull();
    expect(result.draft!.status).toBe('planned');
    expect(result.draft!.durationDays).toBe(56);
    expect(result.draft!.peptides).toHaveLength(1);

    const peptide = result.draft!.peptides[0];
    expect(peptide.peptideId).toBe('bpc-157');
    expect(peptide.schedule).toEqual({ frequency: 'daily', timesOfDay: ['08:00', '20:00'] });
    expect(peptide.frequency).toBe('2x daily');
    expect(result.unmatchedCompounds).toHaveLength(0);
  });

  it('handles weekly schedules with weekday filtering', () => {
    const parsed = makeParsed({
      items: [{
        compoundId: 'tb-500',
        compoundName: 'TB-500',
        doseValue: 2.5,
        doseUnit: 'mg',
        route: 'subq',
        frequency: 'weekly',
        timesOfDay: ['8:00'],
        weekdays: [1, 4, 9, 4],
        notes: null,
      }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);
    const peptide = result.draft!.peptides[0];

    expect(peptide.schedule).toEqual({ frequency: 'weekly', timesOfDay: ['08:00'], weekdays: [1, 4] });
    expect(peptide.frequency).toBe('2x weekly');
    expect(peptide.timing).toBe('Monday and Thursday');
  });

  it('builds interval schedules from model output', () => {
    const parsed = makeParsed({
      items: [{
        compoundId: 'bpc-157',
        compoundName: 'BPC-157',
        doseValue: 250,
        doseUnit: 'mcg',
        route: 'subq',
        frequency: 'interval',
        timesOfDay: ['08:00'],
        weekdays: null,
        intervalDays: 2,
        cycleOnDays: null,
        cycleOffDays: null,
        notes: null,
      }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);
    const peptide = result.draft!.peptides[0];

    expect(peptide.schedule).toEqual({ frequency: 'interval', timesOfDay: ['08:00'], intervalDays: 2 });
    expect(peptide.frequency).toBe('every 2 days');
    expect(peptide.timing).toBe('Morning');
  });

  it('builds cycle schedules from model output', () => {
    const parsed = makeParsed({
      items: [{
        compoundId: 'hgh',
        compoundName: 'HGH',
        doseValue: 2,
        doseUnit: 'iu',
        route: 'subq',
        frequency: 'cycle',
        timesOfDay: ['20:00'],
        weekdays: null,
        intervalDays: null,
        cycleOnDays: 5,
        cycleOffDays: 2,
        notes: null,
      }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);
    const peptide = result.draft!.peptides[0];

    expect(peptide.schedule).toEqual({ frequency: 'cycle', timesOfDay: ['20:00'], cycleOnDays: 5, cycleOffDays: 2 });
    expect(peptide.frequency).toBe('5 days on / 2 days off');
    expect(peptide.timing).toBe('Evening');
  });

  it('falls back to the compound default route when unsupported', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], compoundId: 'tb-500', compoundName: 'TB-500', route: 'oral' }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].route).toBe('subq');
    expect(result.issues.some((issue) => issue.includes('not supported'))).toBe(true);
  });

  it('defaults missing doses and surfaces an issue', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], doseValue: null }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].doseValue).toBe(250);
    expect(result.draft!.peptides[0].doseUnit).toBe('mcg');
    expect(result.issues.some((issue) => issue.includes('no dose specified'))).toBe(true);
  });

  it('uses unit-appropriate default doses', () => {
    const parsed = makeParsed({
      items: [
        { ...makeParsed().items[0], compoundId: 'tb-500', compoundName: 'TB-500', doseValue: null, doseUnit: 'mg' },
        { ...makeParsed().items[0], compoundId: 'hgh', compoundName: 'HGH', doseValue: -1, doseUnit: 'iu' },
      ],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].doseValue).toBe(1);
    expect(result.draft!.peptides[1].doseValue).toBe(2);
  });

  it('recovers compound ids from names when the model omits them', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], compoundId: null, compoundName: 'bpc157' }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].peptideId).toBe('bpc-157');
  });

  it('collects unmatched compounds instead of guessing', () => {
    const parsed = makeParsed({
      items: [
        makeParsed().items[0],
        { ...makeParsed().items[0], compoundId: null, compoundName: 'Unknownium' },
      ],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides).toHaveLength(1);
    expect(result.unmatchedCompounds).toEqual(['Unknownium']);
  });

  it('returns a null draft when nothing matches', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], compoundId: null, compoundName: 'Unknownium' }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft).toBeNull();
    expect(result.unmatchedCompounds).toEqual(['Unknownium']);
  });

  it('defaults and clamps the duration', () => {
    const noDuration = parsedProtocolToStackDraft(makeParsed({ durationDays: null }), compounds);
    expect(noDuration.draft!.durationDays).toBe(DEFAULT_STACK_DURATION_DAYS);
    expect(noDuration.issues.some((issue) => issue.includes('No duration specified'))).toBe(true);

    const tooLong = parsedProtocolToStackDraft(makeParsed({ durationDays: 9999 }), compounds);
    expect(tooLong.draft!.durationDays).toBe(MAX_STACK_DURATION_DAYS);
  });

  it('drops invalid times and falls back to a default time', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], timesOfDay: ['8 am', 'noon'] }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].schedule).toEqual({ frequency: 'daily', timesOfDay: ['08:00'] });
  });

  it('passes model warnings through to issues', () => {
    const result = parsedProtocolToStackDraft(makeParsed({ warnings: ['Dose for X was ambiguous'] }), compounds);
    expect(result.issues).toContain('Dose for X was ambiguous');
  });

  it('labels evening-only daily schedules', () => {
    const parsed = makeParsed({
      items: [{ ...makeParsed().items[0], timesOfDay: ['20:00'] }],
    });
    const result = parsedProtocolToStackDraft(parsed, compounds);

    expect(result.draft!.peptides[0].timing).toBe('Evening');
    expect(result.draft!.peptides[0].frequency).toBe('daily');
  });
});
