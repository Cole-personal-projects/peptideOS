import type { PersistedUserData } from './persistence';

export function countPersistedUserRecords(data: PersistedUserData) {
  return [
    data.vials,
    data.inventoryBatches,
    data.doses,
    data.stacks,
    data.schedules,
    data.scheduleLogs,
    data.reconstitutionCalculations,
    data.signalCheckIns,
    data.labReports,
    data.labResults,
    data.labImportAudits,
    data.userCompounds,
  ].reduce((total, records) => total + records.length, 0);
}

function getTimestampMs(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function shouldRestoreCloudData(input: {
  automatic: boolean;
  cloudData: PersistedUserData;
  cloudPulledAt: string | null;
  localData: PersistedUserData;
  localLastSavedAt: string | null;
}) {
  if (!input.automatic) {
    return { restore: true, reason: 'manual-retrieve' as const };
  }

  const localRecordCount = countPersistedUserRecords(input.localData);
  if (localRecordCount === 0) {
    return { restore: true, reason: 'empty-local' as const };
  }

  const cloudTimestamp = getTimestampMs(input.cloudPulledAt);
  const localTimestamp = getTimestampMs(input.localLastSavedAt);

  if (cloudTimestamp !== null && localTimestamp !== null && cloudTimestamp > localTimestamp) {
    return { restore: true, reason: 'newer-cloud' as const };
  }

  return { restore: false, reason: 'preserve-local' as const };
}
