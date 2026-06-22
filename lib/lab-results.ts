import type { AppData, LabImportAudit, LabImportMethod, LabReferenceRange, LabReport, LabResult, LabResultFlag, ScheduleLog, SignalCheckIn, Stack } from './types';

export interface LabImportRow {
  testName: string;
  assayMethod?: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange?: LabReferenceRange;
  flag: LabResultFlag;
  panelName?: string;
}

export interface LabImportDraft {
  drawDate: string;
  resultedDate?: string;
  sourceLabel?: string;
  panelName?: string;
  linkedStackId?: string;
  notes: string;
  method: LabImportMethod;
  rows: LabImportRow[];
  unresolvedRows: string[];
  parserConfidence: number;
  uniqueImportKey: string;
  duplicateStatus: 'new' | 'possible-duplicate';
}

export interface PersistedLabImport {
  report: LabReport;
  results: LabResult[];
  audit: LabImportAudit;
}

export interface LabTrendPoint {
  reportId: string;
  drawDate: string;
  testName: string;
  assayMethod?: string;
  value: string;
  numericValue?: number;
  unit: string;
  flag: LabResultFlag;
}

export interface LabProtocolContext {
  drawDate: string;
  activeStacks: Array<{ id: string; name: string; day: number }>;
  recentCompletedLogs: number;
  recentSkippedOrMissedLogs: number;
  prior30DayCompletedLogs: number;
  prior30DaySkippedOrMissedLogs: number;
  latestSignal?: Pick<SignalCheckIn, 'checkedAt' | 'energy' | 'sleepHours' | 'notes'>;
}

const ASSAY_PATTERNS = [
  /\bLC\/MS\/MS\b/i,
  /\bLC-MS\/MS\b/i,
  /\bMS\/MS\b/i,
  /\bsensitive\b/i,
  /\bultrasensitive\b/i,
  /\bimmunoassay\b/i,
  /\bECLIA\b/i,
  /\bRIA\b/i,
  /\bELISA\b/i,
];

const KNOWN_TEST_KEYS: Array<[RegExp, string]> = [
  [/\bestradiol\b|\be2\b/i, 'estradiol'],
  [/\btestosterone\b.*\bfree\b|\bfree\b.*\btestosterone\b/i, 'free-testosterone'],
  [/\btestosterone\b/i, 'testosterone'],
  [/\bigf[-\s]?1\b/i, 'igf-1'],
  [/\bhba1c\b|\bhemoglobin a1c\b/i, 'hemoglobin-a1c'],
  [/\bglucose\b/i, 'glucose'],
  [/\binsulin\b/i, 'insulin'],
  [/\balt\b/i, 'alt'],
  [/\bast\b/i, 'ast'],
  [/\bhdl\b/i, 'hdl'],
  [/\bldl\b/i, 'ldl'],
  [/\btriglycerides\b/i, 'triglycerides'],
  [/\bhematocrit\b/i, 'hematocrit'],
  [/\bhemoglobin\b/i, 'hemoglobin'],
  [/\bplatelets\b/i, 'platelets'],
  [/\btsh\b/i, 'tsh'],
  [/\bfree t3\b/i, 'free-t3'],
  [/\bfree t4\b/i, 'free-t4'],
];

export function normalizeLabTestKey(testName: string, assayMethod?: string) {
  const source = `${testName} ${assayMethod ?? ''}`.trim();
  const known = KNOWN_TEST_KEYS.find(([pattern]) => pattern.test(source));
  return known?.[1] ?? testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function extractAssayMethod(testName: string) {
  const matches = ASSAY_PATTERNS.map((pattern) => testName.match(pattern)?.[0]).filter(Boolean);
  if (matches.length === 0) return undefined;
  return Array.from(new Set(matches.map((match) => String(match)))).join(', ');
}

export function buildLabImportKey(drawDate: string, rows: LabImportRow[]) {
  const normalizedRows = rows
    .map((row) => [
      normalizeLabTestKey(row.testName, row.assayMethod),
      row.assayMethod?.trim().toLowerCase() ?? '',
      row.value.trim().toLowerCase(),
      row.unit.trim().toLowerCase(),
    ].join('='))
    .sort()
    .join('|');
  return `${drawDate.slice(0, 10)}:${hashString(normalizedRows)}`;
}

type LabImportOptions = { drawDate: string; resultedDate?: string; sourceLabel?: string; panelName?: string; linkedStackId?: string; notes?: string; existingReports?: LabReport[] };

export function parseLabCsv(input: string, options: LabImportOptions): LabImportDraft {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return buildDraft([], [], 'csv', options);
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const firstColumns = splitDelimitedLine(lines[0], delimiter);
  const hasHeader = firstColumns.some((column) => /test|name|result|value|unit|range|flag|panel|assay|method/i.test(column));
  const headers = hasHeader ? firstColumns.map(normalizeHeader) : [];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const rows: LabImportRow[] = [];
  const unresolvedRows: string[] = [];

  dataLines.forEach((line) => {
    const columns = splitDelimitedLine(line, delimiter);
    const row = hasHeader ? parseHeaderedColumns(headers, columns, options.panelName) : parseLooseColumns(columns, options.panelName);
    if (row) rows.push(row);
    else unresolvedRows.push(line);
  });

  return buildDraft(rows, unresolvedRows, 'csv', options);
}

export function parseLabText(input: string, options: LabImportOptions): LabImportDraft {
  const rows: LabImportRow[] = [];
  const unresolvedRows: string[] = [];

  input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
    const match = line.match(/^(.+?)\s+([-+]?\d+(?:\.\d+)?|positive|negative|detected|not detected)\s+([a-zA-Z/%µμ0-9.\/-]+)?(?:\s+(?:ref(?:erence)?(?: range)?:?)?\s*([<>]?\d+(?:\.\d+)?\s*-\s*[<>]?\d+(?:\.\d+)?|[<>]=?\s*\d+(?:\.\d+)?))?(?:\s+(high|low|normal|critical|h|l))?$/i);
    if (!match) {
      unresolvedRows.push(line);
      return;
    }
    const testName = match[1].trim();
    rows.push(normalizeRow({
      testName,
      assayMethod: extractAssayMethod(testName),
      value: match[2].trim(),
      unit: match[3]?.trim() ?? '',
      referenceRange: parseReferenceRange(match[4] ?? ''),
      flag: normalizeFlag(match[5] ?? ''),
      panelName: options.panelName,
    }));
  });

  return buildDraft(rows, unresolvedRows, 'text', options);
}

export function createManualLabDraft(input: LabImportOptions & { rows: LabImportRow[] }): LabImportDraft {
  return buildDraft(input.rows.map(normalizeRow), [], 'manual', input);
}

export function persistLabImportDraft(draft: LabImportDraft, now = new Date()): PersistedLabImport {
  const idBase = `lab-${draft.drawDate.slice(0, 10)}-${hashString(draft.uniqueImportKey).slice(0, 8)}`;
  const reportId = idBase;
  const report: LabReport = {
    id: reportId,
    drawDate: draft.drawDate,
    resultedDate: draft.resultedDate,
    sourceLabel: draft.sourceLabel,
    panelName: draft.panelName,
    linkedStackId: draft.linkedStackId,
    sourceMethod: draft.method,
    uniqueImportKey: draft.uniqueImportKey,
    notes: draft.notes,
    createdAt: now.toISOString(),
  };
  const results = draft.rows.map((row, index): LabResult => ({
    id: `${reportId}-result-${index + 1}`,
    reportId,
    testName: row.testName,
    normalizedKey: normalizeLabTestKey(row.testName, row.assayMethod),
    assayMethod: row.assayMethod,
    value: row.value,
    numericValue: row.numericValue,
    unit: row.unit,
    referenceRange: row.referenceRange,
    flag: row.flag,
    panelName: row.panelName ?? draft.panelName,
  }));
  const audit: LabImportAudit = {
    id: `${reportId}-audit`,
    reportId,
    method: draft.method,
    importedAt: now.toISOString(),
    parserConfidence: draft.parserConfidence,
    unresolvedRows: draft.unresolvedRows,
    duplicateStatus: draft.duplicateStatus,
  };
  return { report, results, audit };
}

export function buildLabTrends(results: LabResult[], reports: LabReport[]) {
  const reportById = new Map(reports.map((report) => [report.id, report]));
  const trends = new Map<string, LabTrendPoint[]>();
  results.forEach((result) => {
    const report = reportById.get(result.reportId);
    if (!report) return;
    const trend = trends.get(result.normalizedKey) ?? [];
    trend.push({
      reportId: result.reportId,
      drawDate: report.drawDate,
      testName: result.testName,
      assayMethod: result.assayMethod,
      value: result.value,
      numericValue: result.numericValue,
      unit: result.unit,
      flag: result.flag,
    });
    trends.set(result.normalizedKey, trend);
  });
  trends.forEach((points) => points.sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime()));
  return trends;
}

export function hasMixedAssays(points: LabTrendPoint[]) {
  return new Set(points.map((point) => `${point.unit.toLowerCase()}|${point.assayMethod ?? ''}`)).size > 1;
}

export function buildLabProtocolContext(data: AppData, drawDate: string): LabProtocolContext {
  const draw = new Date(drawDate);
  const window14Start = new Date(draw);
  window14Start.setDate(window14Start.getDate() - 14);
  const window30Start = new Date(draw);
  window30Start.setDate(window30Start.getDate() - 30);
  const activeStacks = data.stacks
    .filter((stack) => isStackActiveOnDate(stack, draw))
    .map((stack) => ({
      id: stack.id,
      name: stack.name,
      day: Math.max(1, Math.floor((startOfDay(draw).getTime() - startOfDay(new Date(stack.startDate)).getTime()) / 86400000) + 1),
    }));
  const recentLogs = data.scheduleLogs.filter((log) => isBetween(new Date(log.dueAt), window14Start, draw));
  const prior30DayLogs = data.scheduleLogs.filter((log) => isBetween(new Date(log.dueAt), window30Start, draw));
  const latestSignal = [...data.signalCheckIns]
    .filter((signal) => new Date(signal.checkedAt).getTime() <= draw.getTime())
    .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())[0];

  return {
    drawDate,
    activeStacks,
    recentCompletedLogs: recentLogs.filter((log) => log.status === 'taken').length,
    recentSkippedOrMissedLogs: recentLogs.filter((log) => log.status === 'skipped' || log.status === 'missed').length,
    prior30DayCompletedLogs: prior30DayLogs.filter((log) => log.status === 'taken').length,
    prior30DaySkippedOrMissedLogs: prior30DayLogs.filter((log) => log.status === 'skipped' || log.status === 'missed').length,
    latestSignal: latestSignal ? {
      checkedAt: latestSignal.checkedAt,
      energy: latestSignal.energy,
      sleepHours: latestSignal.sleepHours,
      notes: latestSignal.notes,
    } : undefined,
  };
}

function buildDraft(rows: LabImportRow[], unresolvedRows: string[], method: LabImportMethod, options: LabImportOptions): LabImportDraft {
  const normalizedRows = rows.map(normalizeRow);
  const uniqueImportKey = buildLabImportKey(options.drawDate, normalizedRows);
  return {
    drawDate: normalizeDate(options.drawDate),
    resultedDate: options.resultedDate ? normalizeDate(options.resultedDate) : undefined,
    sourceLabel: options.sourceLabel?.trim() || undefined,
    panelName: options.panelName?.trim() || undefined,
    linkedStackId: options.linkedStackId?.trim() || undefined,
    notes: options.notes?.trim() ?? '',
    method,
    rows: normalizedRows,
    unresolvedRows,
    parserConfidence: normalizedRows.length === 0 ? 0 : normalizedRows.length / (normalizedRows.length + unresolvedRows.length),
    uniqueImportKey,
    duplicateStatus: options.existingReports?.some((report) => report.uniqueImportKey === uniqueImportKey) ? 'possible-duplicate' : 'new',
  };
}

function normalizeRow(row: LabImportRow): LabImportRow {
  const numericValue = row.numericValue ?? parseNumericValue(row.value);
  const assayMethod = row.assayMethod?.trim() || extractAssayMethod(row.testName);
  return {
    testName: row.testName.trim(),
    assayMethod,
    value: row.value.trim(),
    numericValue,
    unit: row.unit.trim(),
    referenceRange: row.referenceRange?.text ? row.referenceRange : undefined,
    flag: row.flag ?? 'unknown',
    panelName: row.panelName?.trim() || undefined,
  };
}

function parseHeaderedColumns(headers: string[], columns: string[], fallbackPanel?: string): LabImportRow | null {
  const valueByHeader = new Map(headers.map((header, index) => [header, columns[index]?.trim() ?? '']));
  const testName = firstHeaderValue(valueByHeader, ['test', 'test-name', 'name', 'component', 'analyte']);
  const value = firstHeaderValue(valueByHeader, ['value', 'result', 'result-value']);
  if (!testName || !value) return null;
  const assay = firstHeaderValue(valueByHeader, ['assay', 'method', 'assay-method']) || extractAssayMethod(testName);
  return normalizeRow({
    testName,
    assayMethod: assay || undefined,
    value,
    unit: firstHeaderValue(valueByHeader, ['unit', 'units']) ?? '',
    referenceRange: parseReferenceRange(firstHeaderValue(valueByHeader, ['range', 'reference-range', 'ref-range']) ?? ''),
    flag: normalizeFlag(firstHeaderValue(valueByHeader, ['flag', 'status']) ?? ''),
    panelName: firstHeaderValue(valueByHeader, ['panel', 'panel-name']) ?? fallbackPanel,
  });
}

function parseLooseColumns(columns: string[], fallbackPanel?: string): LabImportRow | null {
  const [testName, value, unit, range, flag] = columns.map((column) => column.trim());
  if (!testName || !value) return null;
  return normalizeRow({
    testName,
    assayMethod: extractAssayMethod(testName),
    value,
    unit: unit ?? '',
    referenceRange: parseReferenceRange(range ?? ''),
    flag: normalizeFlag(flag ?? ''),
    panelName: fallbackPanel,
  });
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function firstHeaderValue(values: Map<string, string>, keys: string[]) {
  const key = keys.find((candidate) => values.get(candidate));
  return key ? values.get(key) : undefined;
}

function splitDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

function parseReferenceRange(value: string): LabReferenceRange | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const between = text.match(/([-+]?\d+(?:\.\d+)?)\s*-\s*([-+]?\d+(?:\.\d+)?)/);
  if (between) return { text, low: Number(between[1]), high: Number(between[2]) };
  const lessThan = text.match(/<\s*([-+]?\d+(?:\.\d+)?)/);
  if (lessThan) return { text, high: Number(lessThan[1]) };
  const greaterThan = text.match(/>\s*([-+]?\d+(?:\.\d+)?)/);
  if (greaterThan) return { text, low: Number(greaterThan[1]) };
  return { text };
}

function normalizeFlag(value: string): LabResultFlag {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'h' || normalized.includes('high')) return 'high';
  if (normalized === 'l' || normalized.includes('low')) return 'low';
  if (normalized.includes('critical')) return 'critical';
  if (normalized.includes('normal') || normalized === 'n') return 'normal';
  return 'unknown';
}

function parseNumericValue(value: string) {
  const match = value.match(/[-+]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function normalizeDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T12:00:00.000Z`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

function hashString(value: string) {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(index);
    hash &= 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

function isStackActiveOnDate(stack: Stack, date: Date) {
  if (stack.status !== 'active' && stack.status !== 'completed') return false;
  const start = startOfDay(new Date(stack.startDate));
  const end = new Date(start);
  end.setDate(end.getDate() + stack.durationDays);
  const checked = startOfDay(date);
  return checked.getTime() >= start.getTime() && checked.getTime() <= end.getTime();
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function isBetween(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}
