import { bpc157 } from './entries/bpc-157';
import { bremelanotide } from './entries/bremelanotide';
import { cjc1295 } from './entries/cjc-1295';
import { ghkCu } from './entries/ghk-cu';
import { hghSomatropin } from './entries/hgh-somatropin';
import { ibutamoren } from './entries/ibutamoren';
import { ipamorelin } from './entries/ipamorelin';
import { nadPlus } from './entries/nad-plus';
import { semaglutide } from './entries/semaglutide';
import { tesamorelin } from './entries/tesamorelin';
import { testosteroneCypionate } from './entries/testosterone-cypionate';
import { testosteroneEnanthate } from './entries/testosterone-enanthate';
import { testosteronePropionate } from './entries/testosterone-propionate';
import { tb500 } from './entries/tb-500';
import { tirzepatide } from './entries/tirzepatide';
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
  cjc1295,
  ipamorelin,
  tesamorelin,
  semaglutide,
  tirzepatide,
  ibutamoren,
  nadPlus,
  bremelanotide,
] as const;

export const referenceCompounds = [...reviewedReferenceCompounds];
