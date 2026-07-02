import type { PersistedUserData } from './persistence';

export type PersistedUserDataCollectionKey =
  | 'vials'
  | 'inventoryBatches'
  | 'doses'
  | 'stacks'
  | 'schedules'
  | 'scheduleLogs'
  | 'reconstitutionCalculations'
  | 'signalCheckIns'
  | 'labReports'
  | 'labResults'
  | 'labImportAudits'
  | 'userCompounds';

export interface PersistedUserDataCollectionCount {
  key: PersistedUserDataCollectionKey;
  label: string;
  localCount: number;
  cloudCount: number;
  delta: number;
}

const collectionLabels: Array<{ key: PersistedUserDataCollectionKey; label: string }> = [
  { key: 'vials', label: 'Inventory containers' },
  { key: 'inventoryBatches', label: 'Inventory batches' },
  { key: 'doses', label: 'Logged doses' },
  { key: 'stacks', label: 'Protocols' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'scheduleLogs', label: 'Due-dose records' },
  { key: 'reconstitutionCalculations', label: 'Reconstitution saves' },
  { key: 'signalCheckIns', label: 'Signals' },
  { key: 'labReports', label: 'Lab reports' },
  { key: 'labResults', label: 'Lab results' },
  { key: 'labImportAudits', label: 'Lab import audits' },
  { key: 'userCompounds', label: 'Custom compounds' },
];

export function countPersistedUserRecords(data: PersistedUserData) {
  return collectionLabels.reduce((total, collection) => total + data[collection.key].length, 0);
}

export function comparePersistedUserDataCounts(input: {
  localData: PersistedUserData;
  cloudData: PersistedUserData;
}): PersistedUserDataCollectionCount[] {
  return collectionLabels.map(({ key, label }) => {
    const localCount = input.localData[key].length;
    const cloudCount = input.cloudData[key].length;
    return {
      key,
      label,
      localCount,
      cloudCount,
      delta: cloudCount - localCount,
    };
  });
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
