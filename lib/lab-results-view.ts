import {
  buildLabProtocolContext,
  buildLabTrends,
  hasMixedAssays,
  normalizeLabTestKey,
  type LabProtocolContext,
  type LabTrendPoint,
} from './lab-results';
import type { AppData, LabReport, LabResult, Stack } from './types';

export interface LabTimelineMarker {
  id: string;
  name: string;
  normalizedKey: string;
  valueLabel: string;
  rangeLabel: string;
  flag: LabResult['flag'];
  trend?: {
    direction: 'up' | 'down' | 'flat';
    percent: number;
  };
}

export interface LabTimelineCard {
  report: LabReport;
  markers: LabTimelineMarker[];
  markerCount: number;
  stackLabel: string;
  protocolContext: LabProtocolContext;
}

export interface LabMarkerDetail {
  result: LabResult;
  report: LabReport;
  points: LabTrendPoint[];
  comparablePoints: LabTrendPoint[];
  mixedAssays: boolean;
  stackLabel: string;
  latestTrend?: {
    direction: 'up' | 'down' | 'flat';
    percent: number;
  };
}

export interface LabCompareRow {
  key: string;
  marker: string;
  first?: LabResult;
  second?: LabResult;
  deltaValue?: number;
  deltaPercent?: number;
  status: 'matched' | 'missing' | 'unit-mismatch' | 'assay-mismatch' | 'non-numeric';
  issue?: string;
}

export interface LabTrendsDashboard {
  totalReports: number;
  markersTracked: number;
  improvingCount: number;
  keyTrends: Array<{
    key: string;
    label: string;
    points: LabTrendPoint[];
    mixedAssays: boolean;
    latestTrend?: { direction: 'up' | 'down' | 'flat'; percent: number };
  }>;
  correlations: Array<{
    label: string;
    coefficient: number;
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  stackPerformance: Array<{
    stackId: string;
    stackName: string;
    reportCount: number;
    latestDate: string;
    summary: string;
  }>;
}

export function buildLabTimelineCards(data: AppData): LabTimelineCard[] {
  const resultsByReport = groupResultsByReport(data.labResults);
  const trends = buildLabTrends(data.labResults, data.labReports);

  return [...data.labReports]
    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
    .map((report) => {
      const results = resultsByReport.get(report.id) ?? [];
      return {
        report,
        markerCount: results.length,
        stackLabel: getReportStackLabel(report, data.stacks, data),
        protocolContext: buildLabProtocolContext(data, report.drawDate),
        markers: results.map((result) => {
          const points = trends.get(result.normalizedKey) ?? [];
          return {
            id: result.id,
            name: result.testName,
            normalizedKey: result.normalizedKey,
            valueLabel: formatResultValue(result),
            rangeLabel: result.referenceRange?.text ? `Ref: ${result.referenceRange.text}` : result.assayMethod ?? 'Reference not specified',
            flag: result.flag,
            trend: getTrendForResult(result, report, points),
          };
        }),
      };
    });
}

export function buildLabMarkerDetail(data: AppData, reportId: string, resultIdOrKey: string): LabMarkerDetail | undefined {
  const report = data.labReports.find((item) => item.id === reportId);
  if (!report) return undefined;
  const result = data.labResults.find((item) => item.reportId === reportId && (item.id === resultIdOrKey || item.normalizedKey === resultIdOrKey));
  if (!result) return undefined;
  const points = buildLabTrends(data.labResults, data.labReports).get(result.normalizedKey) ?? [];
  const comparablePoints = points.filter((point) => isComparablePoint(point, result));
  return {
    report,
    result,
    points,
    comparablePoints,
    mixedAssays: hasMixedAssays(points),
    stackLabel: getReportStackLabel(report, data.stacks, data),
    latestTrend: getTrendForResult(result, report, comparablePoints),
  };
}

export function buildLabComparison(data: AppData, firstReportId: string, secondReportId: string): LabCompareRow[] {
  const firstResults = data.labResults.filter((result) => result.reportId === firstReportId);
  const secondResults = data.labResults.filter((result) => result.reportId === secondReportId);
  const keys = Array.from(new Set([...firstResults, ...secondResults].map((result) => result.normalizedKey))).sort();

  return keys.map((key): LabCompareRow => {
    const firstCandidates = firstResults.filter((result) => result.normalizedKey === key);
    const secondCandidates = secondResults.filter((result) => result.normalizedKey === key);
    const { first, second } = pickBestComparisonPair(firstCandidates, secondCandidates);
    if (!first || !second) {
      return {
        key,
        marker: first?.testName ?? second?.testName ?? key,
        first,
        second,
        status: 'missing',
        issue: first ? 'Missing from second report' : 'Missing from first report',
      };
    }
    if (first.unit.trim().toLowerCase() !== second.unit.trim().toLowerCase()) {
      return { key, marker: first.testName, first, second, status: 'unit-mismatch', issue: 'Units differ' };
    }
    if (!sameAssay(first, second)) {
      return { key, marker: first.testName, first, second, status: 'assay-mismatch', issue: 'Assay or method differs' };
    }
    if (typeof first.numericValue !== 'number' || typeof second.numericValue !== 'number' || second.numericValue === 0) {
      return { key, marker: first.testName, first, second, status: 'non-numeric', issue: 'Needs numeric values' };
    }
    const deltaValue = first.numericValue - second.numericValue;
    return {
      key,
      marker: first.testName,
      first,
      second,
      deltaValue,
      deltaPercent: (deltaValue / Math.abs(second.numericValue)) * 100,
      status: 'matched',
    };
  }).sort(compareRowsByUsefulness);
}

export function buildLabTrendsDashboard(data: AppData): LabTrendsDashboard {
  const trends = buildLabTrends(data.labResults, data.labReports);
  const keyTrends = Array.from(trends.entries())
    .filter(([, points]) => points.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([key, points]) => ({
      key,
      label: points.at(-1)?.testName ?? key,
      points,
      mixedAssays: hasMixedAssays(points),
      latestTrend: points.length >= 2 ? getTrendBetween(points.at(-1), points.at(-2)) : undefined,
    }));

  return {
    totalReports: data.labReports.length,
    markersTracked: trends.size,
    improvingCount: keyTrends.filter((trend) => trend.latestTrend?.direction && trend.latestTrend.direction !== 'flat').length,
    keyTrends,
    correlations: buildCorrelations(trends),
    stackPerformance: buildStackPerformance(data),
  };
}

export function formatResultValue(result: LabResult) {
  return `${result.value}${result.unit ? ` ${result.unit}` : ''}`;
}

function groupResultsByReport(results: LabResult[]) {
  return results.reduce((groups, result) => {
    const group = groups.get(result.reportId) ?? [];
    group.push(result);
    groups.set(result.reportId, group);
    return groups;
  }, new Map<string, LabResult[]>());
}

function getReportStackLabel(report: LabReport, stacks: Stack[], data: AppData) {
  const linkedStack = report.linkedStackId ? stacks.find((stack) => stack.id === report.linkedStackId) : undefined;
  if (linkedStack) return linkedStack.name;
  const context = buildLabProtocolContext(data, report.drawDate);
  return context.activeStacks[0]?.name ?? 'Baseline';
}

function pickBestComparisonPair(first: LabResult[], second: LabResult[]) {
  if (first.length === 0 || second.length === 0) return { first: first[0], second: second[0] };
  const exact = findPair(first, second, (a, b) => sameUnit(a, b) && sameAssay(a, b) && isNumericPair(a, b));
  if (exact) return exact;
  const unitNumeric = findPair(first, second, (a, b) => sameUnit(a, b) && isNumericPair(a, b));
  if (unitNumeric) return unitNumeric;
  const sameUnitPair = findPair(first, second, sameUnit);
  if (sameUnitPair) return sameUnitPair;
  return { first: first[0], second: second[0] };
}

function findPair(first: LabResult[], second: LabResult[], predicate: (first: LabResult, second: LabResult) => boolean) {
  for (const firstResult of first) {
    const secondResult = second.find((candidate) => predicate(firstResult, candidate));
    if (secondResult) return { first: firstResult, second: secondResult };
  }
  return undefined;
}

function sameUnit(first: LabResult, second: LabResult) {
  return first.unit.trim().toLowerCase() === second.unit.trim().toLowerCase();
}

function sameAssay(first: LabResult, second: LabResult) {
  const firstAssay = first.assayMethod?.trim().toLowerCase() ?? '';
  const secondAssay = second.assayMethod?.trim().toLowerCase() ?? '';
  return !firstAssay || !secondAssay || firstAssay === secondAssay;
}

function isNumericPair(first: LabResult, second: LabResult) {
  return typeof first.numericValue === 'number' && typeof second.numericValue === 'number';
}

function compareRowsByUsefulness(a: LabCompareRow, b: LabCompareRow) {
  const order: Record<LabCompareRow['status'], number> = {
    matched: 0,
    'non-numeric': 1,
    'assay-mismatch': 2,
    'unit-mismatch': 3,
    missing: 4,
  };
  return order[a.status] - order[b.status] || a.marker.localeCompare(b.marker);
}

function getTrendForResult(result: LabResult, report: LabReport, points: LabTrendPoint[]) {
  const comparable = points
    .filter((point) => point.reportId !== report.id && isComparablePoint(point, result))
    .filter((point) => new Date(point.drawDate).getTime() < new Date(report.drawDate).getTime())
    .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())[0];
  return getTrendBetween(result, comparable);
}

function getTrendBetween(current?: Pick<LabResult | LabTrendPoint, 'numericValue'>, previous?: Pick<LabResult | LabTrendPoint, 'numericValue'>) {
  if (typeof current?.numericValue !== 'number' || typeof previous?.numericValue !== 'number' || previous.numericValue === 0) return undefined;
  const percent = ((current.numericValue - previous.numericValue) / Math.abs(previous.numericValue)) * 100;
  return {
    direction: Math.abs(percent) < 0.5 ? 'flat' as const : percent > 0 ? 'up' as const : 'down' as const,
    percent: Math.round(Math.abs(percent)),
  };
}

function isComparablePoint(point: LabTrendPoint, result: LabResult) {
  return point.unit.toLowerCase() === result.unit.toLowerCase()
    && (point.assayMethod ?? '').toLowerCase() === (result.assayMethod ?? '').toLowerCase();
}

function buildCorrelations(trends: Map<string, LabTrendPoint[]>) {
  const entries = Array.from(trends.entries()).filter(([, points]) => points.filter((point) => typeof point.numericValue === 'number').length >= 3);
  const correlations: LabTrendsDashboard['correlations'] = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const coefficient = correlate(entries[i][1], entries[j][1]);
      if (coefficient === undefined) continue;
      const abs = Math.abs(coefficient);
      correlations.push({
        label: `${entries[i][1].at(-1)?.testName ?? entries[i][0]} ↔ ${entries[j][1].at(-1)?.testName ?? entries[j][0]}`,
        coefficient,
        strength: abs >= 0.8 ? 'strong' : abs >= 0.4 ? 'moderate' : 'weak',
      });
    }
  }
  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient)).slice(0, 4);
}

function correlate(a: LabTrendPoint[], b: LabTrendPoint[]) {
  const bByDate = new Map(b.map((point) => [point.drawDate.slice(0, 10), point]));
  const pairs = a
    .map((point) => [point, bByDate.get(point.drawDate.slice(0, 10))] as const)
    .filter((pair): pair is readonly [LabTrendPoint, LabTrendPoint] => typeof pair[0].numericValue === 'number' && typeof pair[1]?.numericValue === 'number');
  if (pairs.length < 3) return undefined;
  const xs = pairs.map(([point]) => point.numericValue as number);
  const ys = pairs.map(([, point]) => point.numericValue as number);
  const xMean = average(xs);
  const yMean = average(ys);
  const numerator = xs.reduce((sum, x, index) => sum + (x - xMean) * (ys[index] - yMean), 0);
  const denominator = Math.sqrt(xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0) * ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0));
  return denominator === 0 ? undefined : numerator / denominator;
}

function buildStackPerformance(data: AppData) {
  return data.stacks.flatMap((stack) => {
    const reports = data.labReports
      .filter((report) => report.linkedStackId === stack.id)
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
    if (reports.length === 0) return [];
    const latestResults = data.labResults.filter((result) => result.reportId === reports[0].id).slice(0, 2);
    return [{
      stackId: stack.id,
      stackName: stack.name,
      reportCount: reports.length,
      latestDate: reports[0].drawDate,
      summary: latestResults.length ? latestResults.map((result) => result.testName).join(' · ') : 'No marker summary yet',
    }];
  });
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function makeLabMarkerHref(reportId: string, result: Pick<LabResult, 'id' | 'normalizedKey'>) {
  return `/labs?view=detail&report=${encodeURIComponent(reportId)}&marker=${encodeURIComponent(result.id || result.normalizedKey)}`;
}

export function makeLabCompareHref(firstReportId?: string, secondReportId?: string) {
  const params = new URLSearchParams({ view: 'compare' });
  if (firstReportId) params.set('first', firstReportId);
  if (secondReportId) params.set('second', secondReportId);
  return `/labs?${params.toString()}`;
}
