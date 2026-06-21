import {
  buildPharmacokineticDoseEvents,
  sumEstimatedRemainingAmount,
  type PharmacokineticDoseEvent,
} from './pharmacokinetics';
import type { AppData, Compound, Dose, Schedule, ScheduleLog, Stack } from './types';

export interface EstimatedRemainingPreviewRow {
  compoundId: string;
  compoundName: string;
  halfLifeHours: number;
  halfLifeSource: string;
  evidenceTier: string;
  citationIds: string[];
  modelNotes: string;
  sampledAt: string;
  actualEstimatedRemainingMg: number;
  plannedEstimatedRemainingMg: number;
  actualEventCount: number;
  plannedEventCount: number;
  latestActualEvent?: PharmacokineticDoseEvent;
}

export interface DashboardEstimatedRemainingPreviewRow extends EstimatedRemainingPreviewRow {
  stackId: string;
  stackName: string;
  href: string;
}

export function buildDashboardEstimatedRemainingPreview(
  data: Pick<AppData, 'compounds' | 'doses' | 'schedules' | 'scheduleLogs' | 'stacks'>,
  sampledAt = new Date().toISOString(),
  limit = 3,
): DashboardEstimatedRemainingPreviewRow[] {
  return data.stacks
    .filter((stack) => stack.status === 'active')
    .flatMap((stack) => buildEstimatedRemainingPreview(stack, data, sampledAt).map((row) => ({
      ...row,
      stackId: stack.id,
      stackName: stack.name,
      href: `/stacks/${stack.id}`,
    })))
    .sort((a, b) => {
      const aLatest = a.latestActualEvent?.occurredAt ?? '';
      const bLatest = b.latestActualEvent?.occurredAt ?? '';
      if (aLatest !== bLatest) return bLatest.localeCompare(aLatest);
      return b.actualEstimatedRemainingMg - a.actualEstimatedRemainingMg;
    })
    .slice(0, limit);
}

export function buildEstimatedRemainingPreview(
  stack: Stack,
  data: Pick<AppData, 'compounds' | 'doses' | 'schedules' | 'scheduleLogs'>,
  sampledAt = new Date().toISOString(),
): EstimatedRemainingPreviewRow[] {
  const stackScheduleLogs = data.scheduleLogs.filter((log) => log.stackId === stack.id);
  const stackScheduleLogIds = new Set(stackScheduleLogs.map((log) => log.id));
  const stackDoses = data.doses.filter((dose) => dose.completed && dose.scheduleLogId && stackScheduleLogIds.has(dose.scheduleLogId));
  const stackSchedules = data.schedules.filter((schedule) => schedule.stackId === stack.id);
  const compoundsById = new Map(data.compounds.map((compound) => [compound.id, compound]));
  const seenCompoundIds = new Set<string>();

  return stack.peptides.reduce<EstimatedRemainingPreviewRow[]>((rows, stackPeptide) => {
    if (seenCompoundIds.has(stackPeptide.peptideId)) return rows;
    seenCompoundIds.add(stackPeptide.peptideId);

    const compound = compoundsById.get(stackPeptide.peptideId);
    if (!compound?.pharmacokinetics?.halfLifeHours) return rows;

    const actualEvents = buildPharmacokineticDoseEvents({
      compound,
      doses: stackDoses,
      schedules: stackSchedules,
      scheduleLogs: stackScheduleLogs,
      mode: 'actual',
    });
    const plannedEvents = buildPharmacokineticDoseEvents({
      compound,
      doses: stackDoses,
      schedules: stackSchedules,
      scheduleLogs: stackScheduleLogs,
      mode: 'planned',
    });

    rows.push(buildPreviewRow(compound, actualEvents, plannedEvents, sampledAt));
    return rows;
  }, []);
}

function buildPreviewRow(
  compound: Compound,
  actualEvents: PharmacokineticDoseEvent[],
  plannedEvents: PharmacokineticDoseEvent[],
  sampledAt: string,
): EstimatedRemainingPreviewRow {
  const pharmacokinetics = compound.pharmacokinetics;
  if (!pharmacokinetics) {
    throw new Error(`Compound "${compound.id}" does not include pharmacokinetics`);
  }

  const sortedActualEvents = [...actualEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  return {
    compoundId: compound.id,
    compoundName: compound.name,
    halfLifeHours: pharmacokinetics.halfLifeHours,
    halfLifeSource: pharmacokinetics.halfLifeSource,
    evidenceTier: pharmacokinetics.evidenceTier,
    citationIds: pharmacokinetics.citationIds,
    modelNotes: pharmacokinetics.modelNotes,
    sampledAt,
    actualEstimatedRemainingMg: sumEstimatedRemainingAmount(actualEvents, sampledAt, pharmacokinetics.halfLifeHours),
    plannedEstimatedRemainingMg: sumEstimatedRemainingAmount(plannedEvents, sampledAt, pharmacokinetics.halfLifeHours),
    actualEventCount: actualEvents.length,
    plannedEventCount: plannedEvents.length,
    latestActualEvent: sortedActualEvents[0],
  };
}
