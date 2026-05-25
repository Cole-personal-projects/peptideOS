import { aicar } from './entries/aicar';
import { ahkCu } from './entries/ahk-cu';
import { aod9604 } from './entries/aod-9604';
import { bpc157 } from './entries/bpc-157';
import { bremelanotide } from './entries/bremelanotide';
import { cjc1295 } from './entries/cjc-1295';
import { dihexa } from './entries/dihexa';
import { dsip } from './entries/dsip';
import { elamipretide } from './entries/elamipretide';
import { epitalon } from './entries/epitalon';
import { foxo4Dri } from './entries/foxo4-dri';
import { ghkCu } from './entries/ghk-cu';
import { gonadorelin } from './entries/gonadorelin';
import { hcg } from './entries/hcg';
import { hghSomatropin } from './entries/hgh-somatropin';
import { ibutamoren } from './entries/ibutamoren';
import { ipamorelin } from './entries/ipamorelin';
import { kisspeptin10 } from './entries/kisspeptin-10';
import { kpv } from './entries/kpv';
import { ll37 } from './entries/ll-37';
import { melanotanIi } from './entries/melanotan-ii';
import { metformin } from './entries/metformin';
import { motsC } from './entries/mots-c';
import { nadPlus } from './entries/nad-plus';
import { oxytocin } from './entries/oxytocin';
import { pinealon } from './entries/pinealon';
import { ptdDbm } from './entries/ptd-dbm';
import { retatrutide } from './entries/retatrutide';
import { selank } from './entries/selank';
import { semax } from './entries/semax';
import { semaglutide } from './entries/semaglutide';
import { sermorelin } from './entries/sermorelin';
import { sirolimus } from './entries/sirolimus';
import { tesamorelin } from './entries/tesamorelin';
import { thymosinAlpha1 } from './entries/thymosin-alpha-1';
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
  retatrutide,
  sermorelin,
  gonadorelin,
  hcg,
  dihexa,
  pinealon,
  ahkCu,
  elamipretide,
  thymosinAlpha1,
  kisspeptin10,
  melanotanIi,
  dsip,
  sirolimus,
  metformin,
  oxytocin,
  ptdDbm,
  foxo4Dri,
] as const;

export const referenceCompounds = [...reviewedReferenceCompounds];
