import type { AppData, InventoryBatch, Vial } from './types';

function stableKeyPart(value: unknown) {
  if (value === undefined || value === null || value === '') return 'none';
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'none';
}

function batchKeyForVial(vial: Vial) {
  return [
    vial.peptideId,
    vial.containerType ?? '',
    vial.dateAdded.slice(0, 10),
    vial.source,
    vial.lotNumber,
    vial.totalAmount?.value ?? vial.mg,
    vial.totalAmount?.unit ?? 'mg',
  ].map(stableKeyPart).join('__');
}

function batchIdFromKey(key: string) {
  return `batch-${key}`;
}

function batchNameFromVial(vial: Vial) {
  return vial.name.replace(/\s+vial\s+\d+\s+of\s+\d+$/i, '').trim() || vial.name;
}

interface CreateBatchOptions {
  packageUnit?: InventoryBatch['packageUnit'];
  packageQuantity?: number;
}

function createBatchFromVials(
  id: string,
  vials: Vial[],
  createdFrom: InventoryBatch['createdFrom'],
  options: CreateBatchOptions = {},
): InventoryBatch {
  const first = vials[0]!;
  return {
    id,
    name: batchNameFromVial(first),
    peptideId: first.peptideId,
    ...(first.containerType ? { containerType: first.containerType } : {}),
    dateAdded: first.dateAdded,
    source: first.source,
    lotNumber: first.lotNumber,
    mg: first.mg,
    ...(first.totalAmount ? { totalAmount: first.totalAmount } : {}),
    ...(options.packageUnit ? { packageUnit: options.packageUnit } : {}),
    ...(options.packageQuantity ? { packageQuantity: options.packageQuantity } : {}),
    vialCount: vials.length,
    createdFrom,
  };
}

export function createInventoryBatchForVials(
  id: string,
  vials: Vial[],
  createdFrom: InventoryBatch['createdFrom'],
  options: CreateBatchOptions = {},
): InventoryBatch | null {
  if (vials.length === 0) return null;
  return createBatchFromVials(id, vials, createdFrom, options);
}

export function ensureInventoryBatches(data: AppData): AppData {
  const batchesById = new Map(data.inventoryBatches.map((batch) => [batch.id, batch]));
  const vialsByBatch = new Map<string, Vial[]>();

  const vials = data.vials.map((vial) => {
    const inventoryBatchId = vial.inventoryBatchId ?? batchIdFromKey(batchKeyForVial(vial));
    const nextVial = vial.inventoryBatchId ? vial : { ...vial, inventoryBatchId };
    vialsByBatch.set(inventoryBatchId, [...(vialsByBatch.get(inventoryBatchId) ?? []), nextVial]);
    return nextVial;
  });

  for (const [batchId, batchVials] of vialsByBatch) {
    const existingBatch = batchesById.get(batchId);
    batchesById.set(batchId, {
      ...(existingBatch ?? createBatchFromVials(batchId, batchVials, 'legacy')),
      vialCount: batchVials.length,
    });
  }

  return {
    ...data,
    vials,
    inventoryBatches: Array.from(batchesById.values())
      .filter((batch) => vials.some((vial) => vial.inventoryBatchId === batch.id))
      .sort((a, b) => a.dateAdded.localeCompare(b.dateAdded) || a.id.localeCompare(b.id)),
  };
}
