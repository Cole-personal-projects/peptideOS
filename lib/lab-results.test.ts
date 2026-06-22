import { describe, expect, test } from 'vitest';
import {
  buildLabProtocolContext,
  buildLabTrends,
  createManualLabDraft,
  extractAssayMethod,
  hasMixedAssays,
  normalizeLabTestKey,
  parseLabCsv,
  parseLabText,
  persistLabImportDraft,
} from './lab-results';
import { initialAppData } from './mock-data';
import type { AppData, Stack } from './types';

describe('lab results', () => {
  test('parses CSV rows with assay details and duplicate keys', () => {
    const draft = parseLabCsv(
      'Test,Value,Unit,Reference Range,Flag,Assay\nEstradiol Sensitive,22,pg/mL,8-35,normal,LC/MS/MS',
      { drawDate: '2026-06-01', panelName: 'Hormones' },
    );

    expect(draft.rows).toHaveLength(1);
    expect(draft.rows[0]).toMatchObject({
      testName: 'Estradiol Sensitive',
      assayMethod: 'LC/MS/MS',
      value: '22',
      unit: 'pg/mL',
      flag: 'normal',
    });
    expect(draft.uniqueImportKey).toMatch(/^2026-06-01:/);

    const duplicate = parseLabCsv(
      'Test,Value,Unit,Reference Range,Flag,Assay\nEstradiol Sensitive,22,pg/mL,8-35,normal,LC/MS/MS',
      { drawDate: '2026-06-01', existingReports: [{ ...persistLabImportDraft(draft).report }] },
    );
    expect(duplicate.duplicateStatus).toBe('possible-duplicate');
  });

  test('stores date-only draw dates at noon UTC to preserve local calendar date', () => {
    const draft = createManualLabDraft({
      drawDate: '2026-06-01',
      rows: [{ testName: 'IGF-1', value: '180', unit: 'ng/mL', flag: 'normal' }],
    });

    expect(draft.drawDate).toBe('2026-06-01T12:00:00.000Z');
  });

  test('parses pasted text and preserves unresolved rows', () => {
    const draft = parseLabText(
      'Estradiol, Sensitive LC/MS/MS 22 pg/mL 8-35 normal\nPatient: Jane Doe',
      { drawDate: '2026-06-01' },
    );

    expect(draft.rows[0].assayMethod).toContain('LC/MS/MS');
    expect(draft.unresolvedRows).toEqual(['Patient: Jane Doe']);
  });

  test('handles empty and loose CSV imports without inventing rows', () => {
    expect(parseLabCsv('', { drawDate: '2026-06-01' })).toMatchObject({
      rows: [],
      unresolvedRows: [],
      parserConfidence: 0,
    });

    const draft = parseLabCsv('IGF-1,180,ng/mL,100-250,normal\nbad-row', {
      drawDate: '2026-06-01',
      panelName: 'Growth',
    });

    expect(draft.rows[0]).toMatchObject({
      testName: 'IGF-1',
      value: '180',
      unit: 'ng/mL',
      flag: 'normal',
      panelName: 'Growth',
      referenceRange: { text: '100-250', low: 100, high: 250 },
    });
    expect(draft.unresolvedRows).toEqual(['bad-row']);
  });

  test('parses quoted CSV fields, status flags, panels, and one-sided ranges', () => {
    const draft = parseLabCsv(
      'Component,Result,Units,Ref Range,Status,Panel\n"Free Testosterone",12.5,pg/mL,"> 5",H,Hormones\nALT,42,U/L,"< 45",L,CMP',
      { drawDate: '2026-06-01' },
    );

    expect(draft.rows[0]).toMatchObject({
      testName: 'Free Testosterone',
      flag: 'high',
      panelName: 'Hormones',
      referenceRange: { text: '> 5', low: 5 },
    });
    expect(draft.rows[1]).toMatchObject({
      testName: 'ALT',
      flag: 'low',
      panelName: 'CMP',
      referenceRange: { text: '< 45', high: 45 },
    });
  });

  test('handles text qualitative values and critical flags', () => {
    const draft = parseLabText('COVID PCR detected critical', { drawDate: '2026-06-01' });

    expect(draft.rows[0]).toMatchObject({
      testName: 'COVID PCR',
      value: 'detected',
      unit: 'critical',
      flag: 'unknown',
    });
  });

  test('normalizes common keys and assay labels without PHI', () => {
    expect(normalizeLabTestKey('Hemoglobin A1c')).toBe('hemoglobin-a1c');
    expect(normalizeLabTestKey('Some Custom Marker')).toBe('some-custom-marker');
    expect(extractAssayMethod('Estradiol ultrasensitive ECLIA')).toBe('ultrasensitive, ECLIA');
    expect(extractAssayMethod('Plain marker')).toBeUndefined();
  });

  test('keeps invalid non-date draw values rather than guessing', () => {
    const draft = createManualLabDraft({
      drawDate: 'not-a-date',
      rows: [{ testName: 'Glucose', value: '90', unit: 'mg/dL', flag: 'normal' }],
    });

    expect(draft.drawDate).toBe('not-a-date');
  });

  test('detects mixed assay or unit trends', () => {
    const lc = persistLabImportDraft(createManualLabDraft({
      drawDate: '2026-06-01',
      rows: [{ testName: 'Estradiol', assayMethod: 'LC/MS/MS', value: '22', unit: 'pg/mL', flag: 'normal' }],
    }));
    const standard = persistLabImportDraft(createManualLabDraft({
      drawDate: '2026-07-01',
      rows: [{ testName: 'Estradiol', assayMethod: 'Immunoassay', value: '35', unit: 'pg/mL', flag: 'normal' }],
    }));
    const trends = buildLabTrends([...lc.results, ...standard.results], [lc.report, standard.report]);
    const estradiol = Array.from(trends.values()).find((points) => points[0].testName === 'Estradiol');

    expect(estradiol).toBeDefined();
    expect(hasMixedAssays(estradiol ?? [])).toBe(true);
  });

  test('links draw date to active protocol context', () => {
    const stack: Stack = {
      id: 'stack-ghk',
      name: 'GHK-Cu run',
      description: '',
      peptides: [],
      startDate: '2026-06-01T08:00:00.000Z',
      durationDays: 84,
      status: 'active',
      notes: '',
    };
    const data: AppData = {
      ...initialAppData,
      stacks: [stack],
      signalCheckIns: [
        {
          id: 'signal-1',
          checkedAt: '2026-06-09T08:00:00.000Z',
          energy: 7,
          sleepHours: 8,
          notes: 'Felt steady',
        },
      ],
      scheduleLogs: [
        {
          id: 'log-1',
          scheduleId: 'schedule-1',
          stackId: 'stack-ghk',
          stackPeptideId: 'sp-1',
          peptideId: 'ghk-cu',
          dueAt: '2026-06-08T08:00:00.000Z',
          status: 'taken',
        },
        {
          id: 'log-2',
          scheduleId: 'schedule-1',
          stackId: 'stack-ghk',
          stackPeptideId: 'sp-1',
          peptideId: 'ghk-cu',
          dueAt: '2026-06-09T08:00:00.000Z',
          status: 'skipped',
        },
      ],
    };

    const context = buildLabProtocolContext(data, '2026-06-10T12:00:00.000Z');
    expect(context.activeStacks[0]).toMatchObject({ name: 'GHK-Cu run', day: 10 });
    expect(context.recentCompletedLogs).toBe(1);
    expect(context.recentSkippedOrMissedLogs).toBe(1);
    expect(context.latestSignal).toMatchObject({ energy: 7, notes: 'Felt steady' });
  });

  test('omits inactive stacks from draw-date protocol context', () => {
    const data: AppData = {
      ...initialAppData,
      stacks: [
        {
          id: 'stack-paused',
          name: 'Paused stack',
          description: '',
          peptides: [],
          startDate: '2026-06-01T08:00:00.000Z',
          durationDays: 84,
          status: 'paused',
          notes: '',
        },
      ],
    };

    expect(buildLabProtocolContext(data, '2026-06-10T12:00:00.000Z').activeStacks).toEqual([]);
  });
});
