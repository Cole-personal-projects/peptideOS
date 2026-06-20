import { convertDoseToMg, formatDose, getDefaultDoseUnit } from './dose-helpers';
import { convertIUToMg, convertMgToIU } from './peptide-conversions';
import type { Dose, Schedule, ScheduleLog, Vial } from './types';

export interface VialInventoryMetrics {
  originalMg: number;
  usedMg: number;
  remainingMg: number;
  originalLabel: string;
  remainingLabel: string;
}

export type VialRunoutStatus = 'unscheduled' | 'covered' | 'runout';

export interface VialRunoutForecast {
  status: VialRunoutStatus;
  runoutAt: string | null;
  daysUntilRunout: number | null;
  dosesCovered: number;
  scheduledDoseMg: number;
  isLowStock: boolean;
  label: string;
}

export interface VialRunoutForecastInput {
  vial: Vial;
  doses: Dose[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  now?: Date;
  lowStockDays?: number;
}

export interface InventoryStockHealthSummary {
  activeCount: number;
  healthyCount: number;
  lowStockCount: number;
  runoutCount: number;
  expiringSoonCount: number;
  unscheduledCount: number;
}

export interface InventoryStockHealthSummaryInput {
  vials: Vial[];
  doses: Dose[];
  schedules: Schedule[];
  scheduleLogs: ScheduleLog[];
  now?: Date;
  lowStockDays?: number;
  expiringSoonDays?: number;
}

function roundMg(value: number): number {
  return Number(value.toFixed(3));
}

function formatInventoryMass(peptideId: string, mg: number): string {
  if (getDefaultDoseUnit(peptideId) === 'iu') {
    const iu = convertMgToIU(peptideId, mg);
    if (iu !== null) {
      return formatDose(iu, 'iu');
    }
  }

  return formatDose(mg, 'mg');
}

function getOriginalMg(vial: Vial): number {
  if (vial.concentration && vial.volumeMl && vial.volumeMl > 0) {
    const total = vial.concentration.value * vial.volumeMl;
    if (vial.concentration.unit === 'mg/ml') {
      return total;
    }

    return convertIUToMg(vial.peptideId, total) ?? vial.mg;
  }

  return vial.mg;
}

function formatOriginalInventory(vial: Vial, originalMg: number): string {
  if (vial.concentration && vial.volumeMl && vial.volumeMl > 0) {
    const concentrationLabel =
      vial.concentration.unit === 'iu/ml'
        ? `${formatDose(vial.concentration.value, 'iu')}/mL`
        : `${formatDose(vial.concentration.value, 'mg')}/mL`;
    const volumeLabel = `${vial.volumeMl.toLocaleString('en-US', { maximumFractionDigits: 3 })} mL`;

    return `${concentrationLabel} · ${volumeLabel}`;
  }

  return formatInventoryMass(vial.peptideId, originalMg);
}

export function getVialInventoryMetrics(vial: Vial, doses: Dose[]): VialInventoryMetrics {
  const originalMg = getOriginalMg(vial);
  const usedMg = doses.reduce((total, dose) => {
    if (!dose.completed || dose.vialId !== vial.id || dose.peptideId !== vial.peptideId) {
      return total;
    }

    const doseMg = convertDoseToMg(dose.peptideId, dose.doseValue, dose.doseUnit);
    return total + (doseMg ?? 0);
  }, 0);
  const remainingMg = Math.max(originalMg - usedMg, 0);

  return {
    originalMg: roundMg(originalMg),
    usedMg: roundMg(usedMg),
    remainingMg: roundMg(remainingMg),
    originalLabel: formatOriginalInventory(vial, originalMg),
    remainingLabel: formatInventoryMass(vial.peptideId, remainingMg),
  };
}

function formatRunoutDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function daysUntil(from: Date, toIso: string): number {
  const to = new Date(toIso);
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.max(0, Math.round((toDay - fromDay) / 86_400_000));
}

export function getVialRunoutForecast(input: VialRunoutForecastInput): VialRunoutForecast {
  const now = input.now ?? new Date();
  const lowStockDays = input.lowStockDays ?? 14;
  const metrics = getVialInventoryMetrics(input.vial, input.doses);
  const schedulesById = new Map(input.schedules.map((schedule) => [schedule.id, schedule]));
  const futureLogs = input.scheduleLogs
    .filter((log) => log.status === 'pending' && new Date(log.dueAt) >= now)
    .map((log) => ({ log, schedule: schedulesById.get(log.scheduleId) }))
    .filter((item): item is { log: ScheduleLog; schedule: Schedule } => (
      item.schedule !== undefined && item.schedule.peptideId === input.vial.peptideId
    ))
    .sort((a, b) => new Date(a.log.dueAt).getTime() - new Date(b.log.dueAt).getTime());

  if (futureLogs.length === 0) {
    return {
      status: 'unscheduled',
      runoutAt: null,
      daysUntilRunout: null,
      dosesCovered: 0,
      scheduledDoseMg: 0,
      isLowStock: false,
      label: 'No scheduled usage',
    };
  }

  let consumedMg = 0;
  let dosesCovered = 0;
  for (const { log, schedule } of futureLogs) {
    const doseMg = convertDoseToMg(schedule.peptideId, schedule.doseValue, schedule.doseUnit) ?? 0;
    consumedMg += doseMg;

    if (consumedMg >= metrics.remainingMg) {
      const days = daysUntil(now, log.dueAt);
      return {
        status: 'runout',
        runoutAt: log.dueAt,
        daysUntilRunout: days,
        dosesCovered: dosesCovered + 1,
        scheduledDoseMg: roundMg(consumedMg),
        isLowStock: days <= lowStockDays,
        label: `Runs out ${formatRunoutDate(log.dueAt)}`,
      };
    }

    dosesCovered++;
  }

  return {
    status: 'covered',
    runoutAt: null,
    daysUntilRunout: null,
    dosesCovered,
    scheduledDoseMg: roundMg(consumedMg),
    isLowStock: false,
    label: 'Covers scheduled doses',
  };
}

export function getInventoryStockHealthSummary(input: InventoryStockHealthSummaryInput): InventoryStockHealthSummary {
  const now = input.now ?? new Date();
  const expiringSoonDays = input.expiringSoonDays ?? 7;
  const activeVials = input.vials.filter((vial) => vial.status === 'active');

  let healthyCount = 0;
  let lowStockCount = 0;
  let runoutCount = 0;
  let expiringSoonCount = 0;
  let unscheduledCount = 0;

  for (const vial of activeVials) {
    const forecast = getVialRunoutForecast({
      vial,
      doses: input.doses,
      schedules: input.schedules,
      scheduleLogs: input.scheduleLogs,
      now,
      lowStockDays: input.lowStockDays,
    });
    const daysToExpiration = Math.ceil((new Date(vial.expirationDate).getTime() - now.getTime()) / 86_400_000);
    const isExpiringSoon = daysToExpiration > 0 && daysToExpiration <= expiringSoonDays;

    if (forecast.status === 'runout') {
      runoutCount += 1;
    } else if (forecast.isLowStock) {
      lowStockCount += 1;
    } else if (forecast.status === 'unscheduled') {
      unscheduledCount += 1;
    } else {
      healthyCount += 1;
    }

    if (isExpiringSoon || daysToExpiration <= 0) {
      expiringSoonCount += 1;
    }
  }

  return {
    activeCount: activeVials.length,
    healthyCount,
    lowStockCount,
    runoutCount,
    expiringSoonCount,
    unscheduledCount,
  };
}
