import {
  buildPharmacokineticDoseEvents,
  sampleEstimatedRemainingCurve,
  sumEstimatedRemainingAmount,
  type ConcentrationCurvePoint,
  type PharmacokineticDoseEvent,
} from './pharmacokinetics';
import type { AppData, Compound, Stack } from './types';

export interface ProtocolPkCompoundView {
  compound: Compound;
  halfLifeHours: number;
  actualEvents: PharmacokineticDoseEvent[];
  plannedEvents: PharmacokineticDoseEvent[];
  actualPoints: ConcentrationCurvePoint[];
  projectedPoints: ConcentrationCurvePoint[];
  currentEstimatedMg: number;
  peakProjectedMg: number;
  percentOfPeak: number;
  nextEventAt?: string;
}

export interface ProtocolPkView {
  compounds: ProtocolPkCompoundView[];
  unsupportedCompounds: Compound[];
  generatedAt: string;
  startAt: string;
  endAt: string;
}

const HOUR_MS = 60 * 60 * 1000;

export function buildProtocolPkView(data: AppData, stack: Stack, now: Date = new Date()): ProtocolPkView {
  const startAt = new Date(now.getTime() - 7 * 24 * HOUR_MS).toISOString();
  const endAt = new Date(now.getTime() + 14 * 24 * HOUR_MS).toISOString();
  const stackCompoundIds = new Set(stack.peptides.map((peptide) => peptide.peptideId));
  const stackCompounds = data.compounds.filter((compound) => stackCompoundIds.has(compound.id));
  const unsupportedCompounds = stackCompounds.filter((compound) => !compound.pharmacokinetics?.halfLifeHours);
  const compounds = stackCompounds
    .filter((compound) => compound.pharmacokinetics?.halfLifeHours)
    .map((compound) => buildCompoundPkView(data, stack, compound, now, startAt, endAt))
    .filter((view): view is ProtocolPkCompoundView => Boolean(view));

  return {
    compounds,
    unsupportedCompounds,
    generatedAt: now.toISOString(),
    startAt,
    endAt,
  };
}

function buildCompoundPkView(
  data: AppData,
  stack: Stack,
  compound: Compound,
  now: Date,
  startAt: string,
  endAt: string,
): ProtocolPkCompoundView | null {
  const halfLifeHours = compound.pharmacokinetics?.halfLifeHours;
  if (!halfLifeHours) return null;

  const stackScheduleIds = new Set(data.schedules.filter((schedule) => schedule.stackId === stack.id).map((schedule) => schedule.id));
  const stackScheduleLogIds = new Set(data.scheduleLogs.filter((log) => log.stackId === stack.id).map((log) => log.id));
  const stackDoseIds = new Set(
    data.scheduleLogs
      .filter((log) => log.stackId === stack.id && log.doseId)
      .map((log) => log.doseId as string),
  );
  const actualEvents = buildPharmacokineticDoseEvents({
    compound,
    doses: data.doses.filter((dose) => stackDoseIds.has(dose.id) || (dose.scheduleLogId ? stackScheduleLogIds.has(dose.scheduleLogId) : false)),
    schedules: data.schedules.filter((schedule) => stackScheduleIds.has(schedule.id)),
    scheduleLogs: data.scheduleLogs.filter((log) => log.stackId === stack.id),
    mode: 'actual',
  }).filter((event) => new Date(event.occurredAt).getTime() >= new Date(startAt).getTime());
  const plannedEvents = buildPharmacokineticDoseEvents({
    compound,
    doses: data.doses,
    schedules: data.schedules.filter((schedule) => stackScheduleIds.has(schedule.id)),
    scheduleLogs: data.scheduleLogs.filter((log) => log.stackId === stack.id),
    mode: 'planned',
  }).filter((event) => new Date(event.occurredAt).getTime() >= now.getTime());
  const projectedEvents = [...actualEvents, ...plannedEvents];
  const actualPoints = sampleEstimatedRemainingCurve({
    events: actualEvents,
    halfLifeHours,
    startAt,
    endAt: now.toISOString(),
    intervalHours: 12,
  });
  const projectedPoints = sampleEstimatedRemainingCurve({
    events: projectedEvents,
    halfLifeHours,
    startAt: now.toISOString(),
    endAt,
    intervalHours: 12,
  });
  const currentEstimatedMg = sumEstimatedRemainingAmount(actualEvents, now.toISOString(), halfLifeHours);
  const peakProjectedMg = Math.max(
    currentEstimatedMg,
    ...projectedPoints.map((point) => point.estimatedRemainingMg),
    0,
  );
  const percentOfPeak = peakProjectedMg > 0 ? Math.min(100, Math.round((currentEstimatedMg / peakProjectedMg) * 100)) : 0;
  const nextEventAt = plannedEvents
    .map((event) => event.occurredAt)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return {
    compound,
    halfLifeHours,
    actualEvents,
    plannedEvents,
    actualPoints,
    projectedPoints,
    currentEstimatedMg,
    peakProjectedMg,
    percentOfPeak,
    nextEventAt,
  };
}
