import { bpc157 } from './entries/bpc-157';
import { ghkCu } from './entries/ghk-cu';
import { hghSomatropin } from './entries/hgh-somatropin';
import { testosteroneCypionate } from './entries/testosterone-cypionate';
import { testosteroneEnanthate } from './entries/testosterone-enanthate';
import { testosteronePropionate } from './entries/testosterone-propionate';
import { tb500 } from './entries/tb-500';
export { validateReferenceCompound } from './schema';
export type { ReferenceCompound } from './schema';

const reviewedReferenceCompounds = [
  hghSomatropin,
  testosteroneCypionate,
  testosteroneEnanthate,
  testosteronePropionate,
  bpc157,
  tb500,
  ghkCu,
] as const;

export const referenceCompounds = [...reviewedReferenceCompounds];
