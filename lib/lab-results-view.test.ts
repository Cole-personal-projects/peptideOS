import { describe, expect, test } from 'vitest';
import { createManualLabDraft, persistLabImportDraft } from './lab-results';
import {
  buildLabComparison,
  buildLabMarkerDetail,
  buildLabTimelineCards,
  buildLabTrendsDashboard,
} from './lab-results-view';
import { initialAppData } from './mock-data';
import type { AppData, LabResult, Stack } from './types';

function withImports(imports: ReturnType<typeof persistLabImportDraft>[], stack?: Stack): AppData {
  return {
    ...initialAppData,
    stacks: stack ? [stack] : [],
    labReports: imports.map((item) => item.report),
    labResults: imports.flatMap((item) => item.results),
    labImportAudits: imports.map((item) => item.audit),
  };
}

function labImport(drawDate: string, rows: Array<Partial<LabResult> & { testName: string; value: string; unit: string }>, linkedStackId?: string) {
  return persistLabImportDraft(createManualLabDraft({
    drawDate,
    sourceLabel: 'Quest',
    panelName: 'Hormones',
    linkedStackId,
    rows: rows.map((row) => ({
      testName: row.testName,
      assayMethod: row.assayMethod,
      value: row.value,
      unit: row.unit,
      referenceRange: row.referenceRange,
      flag: row.flag ?? 'normal',
    })),
  }), new Date(`${drawDate.slice(0, 10)}T12:00:00.000Z`));
}

describe('lab results view models', () => {
  test('builds newest-first timeline cards with linked stack labels and marker trends', () => {
    const stack: Stack = {
      id: 'stack-ghk',
      name: 'GHK-Cu run',
      description: '',
      peptides: [],
      startDate: '2026-05-01T12:00:00.000Z',
      durationDays: 84,
      status: 'active',
      notes: '',
    };
    const older = labImport('2026-06-01', [{ testName: 'IGF-1', value: '160', unit: 'ng/mL' }], stack.id);
    const newer = labImport('2026-07-01', [{ testName: 'IGF-1', value: '184', unit: 'ng/mL' }], stack.id);
    const cards = buildLabTimelineCards(withImports([older, newer], stack));

    expect(cards[0].report.drawDate).toContain('2026-07-01');
    expect(cards[0].stackLabel).toBe('GHK-Cu run');
    expect(cards[0].markers[0].trend).toMatchObject({ direction: 'up', percent: 15 });
  });

  test('marker detail excludes mismatched assay or unit from comparable points and flags mixed assays', () => {
    const lc = labImport('2026-06-01', [{ testName: 'Estradiol Sensitive', assayMethod: 'LC/MS/MS', value: '22', unit: 'pg/mL' }]);
    const immuno = labImport('2026-07-01', [{ testName: 'Estradiol', assayMethod: 'Immunoassay', value: '35', unit: 'pg/mL' }]);
    const data = withImports([lc, immuno]);
    const latest = immuno.results[0];
    const detail = buildLabMarkerDetail(data, immuno.report.id, latest.id);

    expect(detail?.mixedAssays).toBe(true);
    expect(detail?.comparablePoints).toHaveLength(1);
    expect(detail?.latestTrend).toBeUndefined();
  });

  test('comparison matches normalized markers and handles missing and unit mismatches', () => {
const first = labImport('2026-07-01', [
{ testName: 'Testosterone Total', value: '700', unit: 'ng/dL' },
{ testName: 'IGF-1', value: '180', unit: 'ng/mL' },
{ testName: 'Estradiol Sensitive', assayMethod: 'LC/MS/MS', value: '22', unit: 'pg/mL' },
]);
const second = labImport('2026-06-01', [
{ testName: 'Testosterone', value: '650', unit: 'ng/dL' },
{ testName: 'IGF-1', value: '26', unit: 'nmol/L' },
{ testName: 'Estradiol Sensitive', assayMethod: 'Immunoassay', value: '31', unit: 'pg/mL' },
{ testName: 'Glucose', value: '88', unit: 'mg/dL' },
]);
const rows = buildLabComparison(withImports([first, second]), first.report.id, second.report.id);

expect(rows[0]).toMatchObject({ key: 'testosterone', status: 'matched', deltaValue: 50 });
expect(rows.find((row) => row.key === 'estradiol')).toMatchObject({ status: 'assay-mismatch', issue: 'Assay or method differs' });
expect(rows.find((row) => row.key === 'igf-1')).toMatchObject({ status: 'unit-mismatch', issue: 'Units differ' });
expect(rows.find((row) => row.key === 'glucose')).toMatchObject({ status: 'missing' });
});

  test('dashboard handles empty, one-report, and three-report trend states', () => {
    expect(buildLabTrendsDashboard(withImports([]))).toMatchObject({ totalReports: 0, markersTracked: 0, correlations: [] });

    const one = buildLabTrendsDashboard(withImports([labImport('2026-05-01', [{ testName: 'Glucose', value: '90', unit: 'mg/dL' }])]));
    expect(one.keyTrends[0].latestTrend).toBeUndefined();

    const data = withImports([
      labImport('2026-05-01', [{ testName: 'Glucose', value: '90', unit: 'mg/dL' }, { testName: 'Insulin', value: '10', unit: 'uIU/mL' }]),
      labImport('2026-06-01', [{ testName: 'Glucose', value: '95', unit: 'mg/dL' }, { testName: 'Insulin', value: '12', unit: 'uIU/mL' }]),
      labImport('2026-07-01', [{ testName: 'Glucose', value: '100', unit: 'mg/dL' }, { testName: 'Insulin', value: '14', unit: 'uIU/mL' }]),
    ]);
    const dashboard = buildLabTrendsDashboard(data);

    expect(dashboard.totalReports).toBe(3);
    expect(dashboard.markersTracked).toBe(2);
    expect(dashboard.correlations[0]).toMatchObject({ strength: 'strong' });
  });
});
