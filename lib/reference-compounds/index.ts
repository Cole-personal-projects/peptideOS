import { hghSomatropin } from './entries/hgh-somatropin';
import { testosteroneCypionate } from './entries/testosterone-cypionate';
export { validateReferenceCompound } from './schema';
export type { ReferenceCompound } from './schema';

const reviewedReferenceCompounds = [
  hghSomatropin,
  testosteroneCypionate,
] as const;

export const referenceCompounds = [...reviewedReferenceCompounds];
