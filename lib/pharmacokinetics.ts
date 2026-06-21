import { convertDoseToMg } from './dose-helpers';
import type { Compound, Dose, Schedule, ScheduleLog } from './types';

export interface PharmacokineticDoseEvent {
  id: string;
  occurredAt: string;
  amountMg: number;
  source: 'planned' | 'actual';
}

export interface ConcentrationCurvePoint {
  sampledAt: string;
  estimatedRemainingMg: number;
}

export interface BuildDoseEventsInput {
  compound: Pick<Compound, 'id' | 'pharmacokinetics'>;
  doses: Dose[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  mode: 'planned' | 'actual';
}

export interface SampleCurveInput {
  events: PharmacokineticDoseEvent[];
  halfLifeHours: number | null | undefined;
  startAt: string;
  endAt: string;
  intervalHours: number;
}

const HOUR_MS = 60 * 60 * 1000;

export function calculateRemainingAmount(
  amountMg: number,
  elapsedHours: number,
  halfLifeHours: number | null | undefined,
) {
  if (amountMg <= 0 || elapsedHours < 0 || !halfLifeHours || halfLifeHours <= 0) {
    return 0;
  }

  return amountMg * Math.pow(0.5, elapsedHours / halfLifeHours);
}

export function sumEstimatedRemainingAmount(
  events: PharmacokineticDoseEvent[],
  sampledAt: string,
  halfLifeHours: number | null | undefined,
) {
  const sampledTime = new Date(sampledAt).getTime();

  return events.reduce((total, event) => {
    const elapsedHours = (sampledTime - new Date(event.occurredAt).getTime()) / HOUR_MS;
    return total + calculateRemainingAmount(event.amountMg, elapsedHours, halfLifeHours);
  }, 0);
}

export function buildPharmacokineticDoseEvents(input: BuildDoseEventsInput): PharmacokineticDoseEvent[] {
  if (!input.compound.pharmacokinetics?.halfLifeHours) return [];

  if (input.mode === 'actual') {
    return input.doses
      .filter((dose) => dose.completed && dose.peptideId === input.compound.id)
      .map((dose) => ({
        id: dose.id,
        occurredAt: dose.dateTime,
        amountMg: convertDoseToMg(dose.peptideId, dose.doseValue, dose.doseUnit) ?? 0,
        source: 'actual' as const,
      }))
      .filter((event) => event.amountMg > 0)
      .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }

  const schedulesById = new Map(input.schedules.map((schedule) => [schedule.id, schedule]));

  return input.scheduleLogs
    .filter((log) => log.peptideId === input.compound.id && log.status === 'pending')
    .map((log) => {
      const schedule = schedulesById.get(log.scheduleId);
      const amountMg = schedule ? convertDoseToMg(schedule.peptideId, schedule.doseValue, schedule.doseUnit) ?? 0 : 0;

      return {
        id: log.id,
        occurredAt: log.dueAt,
        amountMg,
        source: 'planned' as const,
      };
    })
    .filter((event) => event.amountMg > 0)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
}

export function sampleEstimatedRemainingCurve(input: SampleCurveInput): ConcentrationCurvePoint[] {
  if (!input.halfLifeHours || input.halfLifeHours <= 0 || input.intervalHours <= 0) return [];

  const start = new Date(input.startAt).getTime();
  const end = new Date(input.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];

  const points: ConcentrationCurvePoint[] = [];
  for (let sampledTime = start; sampledTime <= end; sampledTime += input.intervalHours * HOUR_MS) {
    const sampledAt = new Date(sampledTime).toISOString();
    points.push({
      sampledAt,
      estimatedRemainingMg: sumEstimatedRemainingAmount(input.events, sampledAt, input.halfLifeHours),
    });
  }

  return points;
}
