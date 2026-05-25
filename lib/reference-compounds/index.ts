import { aicar } from './entries/aicar';
import { aod9604 } from './entries/aod-9604';
import { bpc157 } from './entries/bpc-157';
import { bremelanotide } from './entries/bremelanotide';
import { cjc1295 } from './entries/cjc-1295';
import { epitalon } from './entries/epitalon';
import { ghkCu } from './entries/ghk-cu';
import { hghSomatropin } from './entries/hgh-somatropin';
import { ibutamoren } from './entries/ibutamoren';
import { ipamorelin } from './entries/ipamorelin';
import { kpv } from './entries/kpv';
import { ll37 } from './entries/ll-37';
import { motsC } from './entries/mots-c';
import { nadPlus } from './entries/nad-plus';
import { selank } from './entries/selank';
import { semax } from './entries/semax';
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
  kpv,
  ll37,
  motsC,
  aicar,
  epitalon,
  semax,
  selank,
  aod9604,
] as const;

export const referenceCompounds = [...reviewedReferenceCompounds];
