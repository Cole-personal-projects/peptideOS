import { sampleEstimatedRemainingCurve, sumEstimatedRemainingAmount, type ConcentrationCurvePoint, type PharmacokineticDoseEvent } from './pharmacokinetics';
import type { Compound, DoseUnit } from './types';

export type HalfLifeFrequencyId = 'twice-daily' | 'daily' | 'every-2-days' | 'every-3-days' | 'weekly' | 'biweekly';

export interface HalfLifeFrequencyOption {
  id: HalfLifeFrequencyId;
  label: string;
  intervalDays: number;
}

export interface HalfLifeSimulationInput {
  compound: Pick<Compound, 'id' | 'name' | 'conversion' | 'pharmacokinetics'>;
  doseValue: number;
  doseUnit: DoseUnit;
  doseCount: number;
  frequencyId: HalfLifeFrequencyId;
  windowDays: number;
  now?: Date;
}

export interface HalfLifeSimulation {
  events: PharmacokineticDoseEvent[];
  points: ConcentrationCurvePoint[];
  currentEstimatedMg: number;
  peakEstimatedMg: number;
  clearsAt: string | null;
  unsupportedReason?: string;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const halfLifeFrequencyOptions: HalfLifeFrequencyOption[] = [
  { id: 'twice-daily', label: '2x daily', intervalDays: 0.5 },
  { id: 'daily', label: 'Daily', intervalDays: 1 },
  { id: 'every-2-days', label: 'Every 2d', intervalDays: 2 },
  { id: 'every-3-days', label: 'Every 3d', intervalDays: 3 },
  { id: 'weekly', label: 'Weekly', intervalDays: 7 },
  { id: 'biweekly', label: 'Biweekly', intervalDays: 14 },
];

export function buildHalfLifeSimulation(input: HalfLifeSimulationInput): HalfLifeSimulation {
  const halfLifeHours = input.compound.pharmacokinetics?.halfLifeHours;
  if (!halfLifeHours || halfLifeHours <= 0) {
    return emptySimulation('No source-backed half-life is available for this compound.');
  }

  const doseMg = convertDoseToMgForCompound(input.compound, input.doseValue, input.doseUnit);
  if (!doseMg || doseMg <= 0) {
    return emptySimulation('Enter convertible dose amount.');
  }

  const frequency = halfLifeFrequencyOptions.find((option) => option.id === input.frequencyId) ?? halfLifeFrequencyOptions[0];
  const now = input.now ?? new Date();
  const doseCount = Math.max(1, Math.min(365, Math.round(input.doseCount)));
  const windowDays = Math.max(1, Math.min(180, Math.round(input.windowDays)));
  const endAt = new Date(now.getTime() + windowDays * DAY_MS).toISOString();
  const events = Array.from({ length: doseCount }, (_, index) => ({
    id: `sim-dose-${index + 1}`,
    occurredAt: new Date(now.getTime() + index * frequency.intervalDays * DAY_MS).toISOString(),
    amountMg: doseMg,
    source: 'planned' as const,
  })).filter((event) => new Date(event.occurredAt).getTime() <= new Date(endAt).getTime());

  const points = sampleEstimatedRemainingCurve({
    events,
    halfLifeHours,
    startAt: now.toISOString(),
    endAt,
    intervalHours: windowDays > 45 ? 24 : 6,
  });
  const currentEstimatedMg = sumEstimatedRemainingAmount(events, now.toISOString(), halfLifeHours);
  const peakEstimatedMg = Math.max(currentEstimatedMg, ...points.map((point) => point.estimatedRemainingMg), 0);
  const clearsAt = estimateClearanceAt(events, halfLifeHours, peakEstimatedMg);

  return {
    events,
    points,
    currentEstimatedMg,
    peakEstimatedMg,
    clearsAt,
  };
}

function convertDoseToMgForCompound(
  compound: Pick<Compound, 'id' | 'conversion'>,
  value: number,
  unit: DoseUnit,
) {
  if (unit === 'mg') return value;
  if (unit === 'mcg') return value / 1000;
  if (compound.conversion?.iuPerMg) return value / compound.conversion.iuPerMg;
  if (compound.conversion?.mgPerIU) return value * compound.conversion.mgPerIU;
  return null;
}

function estimateClearanceAt(events: PharmacokineticDoseEvent[], halfLifeHours: number, peakEstimatedMg: number) {
  if (events.length === 0 || peakEstimatedMg <= 0) return null;
  const lastEventTime = new Date(events.at(-1)?.occurredAt ?? events[0].occurredAt).getTime();
  const thresholdMg = Math.max(peakEstimatedMg * 0.01, 0.001);

  for (let hour = 0; hour <= 365 * 24; hour += 6) {
    const sampledAt = new Date(lastEventTime + hour * HOUR_MS).toISOString();
    if (sumEstimatedRemainingAmount(events, sampledAt, halfLifeHours) <= thresholdMg) {
      return sampledAt;
    }
  }

  return null;
}

function emptySimulation(unsupportedReason: string): HalfLifeSimulation {
  return {
    events: [],
    points: [],
    currentEstimatedMg: 0,
    peakEstimatedMg: 0,
    clearsAt: null,
    unsupportedReason,
  };
}
