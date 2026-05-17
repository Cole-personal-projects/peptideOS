import type { Route, SiteCode } from './types';

export type BodyTemplateSex = 'male' | 'female';
export type BodyTemplateView = 'front' | 'back';
export type BodyTemplateId = `${BodyTemplateSex}-${BodyTemplateView}`;
export type BodyRegion = 'abdomen' | 'thigh' | 'deltoid' | 'glute' | 'back';
export type ZoneSide = 'left' | 'right' | 'midline';
export type CautionLevel = 'ok' | 'caution' | 'restricted';

export interface BodyTemplate {
  id: BodyTemplateId;
  sex: BodyTemplateSex;
  view: BodyTemplateView;
  viewBox: string;
  assetVersion: string;
}

export interface BodySite {
  siteCode: SiteCode;
  anatomicalName: string;
  patientName: string;
  bodyRegion: BodyRegion;
  defaultRoute: Route;
  restrictedByDefault: boolean;
  requiresTraining: boolean;
  assistanceRecommended: boolean;
  protocolDependent: boolean;
  notesKey: string | null;
}

export interface BodyZone {
  id: string;
  templateId: BodyTemplateId;
  siteCode: SiteCode;
  side: ZoneSide;
  pathData: string;
  displayLabel: string | null;
  zOrder: number;
}

export interface BodyHitTarget {
  id: string;
  zoneId: string;
  pathData: string;
  minTapPx: number;
}

export interface SiteRouteCompat {
  id: string;
  siteCode: SiteCode;
  route: Route;
  allowed: boolean;
  cautionLevel: CautionLevel;
  rationaleKey: string | null;
}

export const BODY_TEMPLATES: BodyTemplate[] = [
  { id: 'male-front', sex: 'male', view: 'front', viewBox: '0 0 724 1448', assetVersion: '0.1.0' },
  { id: 'male-back', sex: 'male', view: 'back', viewBox: '724 0 724 1448', assetVersion: '0.1.0' },
  { id: 'female-front', sex: 'female', view: 'front', viewBox: '-50 -40 734 1538', assetVersion: '0.1.0' },
  { id: 'female-back', sex: 'female', view: 'back', viewBox: '756 0 774 1448', assetVersion: '0.1.0' },
];

export const BODY_SITES: BodySite[] = [
  site('abdomen-upper-left', 'Upper left abdomen', 'Upper left abdomen', 'abdomen', 'subq'),
  site('abdomen-upper-right', 'Upper right abdomen', 'Upper right abdomen', 'abdomen', 'subq'),
  site('abdomen-mid-left', 'Mid left abdomen', 'Mid left abdomen', 'abdomen', 'subq'),
  site('abdomen-mid-right', 'Mid right abdomen', 'Mid right abdomen', 'abdomen', 'subq'),
  site('abdomen-lower-left', 'Lower left abdomen', 'Lower left abdomen', 'abdomen', 'subq'),
  site('abdomen-lower-right', 'Lower right abdomen', 'Lower right abdomen', 'abdomen', 'subq'),
  site('flank-left', 'Left flank', 'Left flank', 'abdomen', 'subq', { protocolDependent: true }),
  site('flank-right', 'Right flank', 'Right flank', 'abdomen', 'subq', { protocolDependent: true }),
  site('thigh-front-upper-left', 'Upper left anterolateral thigh', 'Upper left thigh', 'thigh', 'subq'),
  site('thigh-front-upper-right', 'Upper right anterolateral thigh', 'Upper right thigh', 'thigh', 'subq'),
  site('thigh-front-mid-left', 'Mid left anterolateral thigh', 'Mid left thigh', 'thigh', 'subq'),
  site('thigh-front-mid-right', 'Mid right anterolateral thigh', 'Mid right thigh', 'thigh', 'subq'),
  site('thigh-outer-left', 'Outer left thigh', 'Outer left thigh', 'thigh', 'subq'),
  site('thigh-outer-right', 'Outer right thigh', 'Outer right thigh', 'thigh', 'subq'),
  site('delt-anterior-left', 'Left anterior deltoid', 'Left front deltoid', 'deltoid', 'im'),
  site('delt-anterior-right', 'Right anterior deltoid', 'Right front deltoid', 'deltoid', 'im'),
  site('delt-lateral-left', 'Left lateral deltoid', 'Left lateral deltoid', 'deltoid', 'im'),
  site('delt-lateral-right', 'Right lateral deltoid', 'Right lateral deltoid', 'deltoid', 'im'),
  site('delt-posterior-left', 'Left posterior deltoid', 'Left rear deltoid', 'deltoid', 'im'),
  site('delt-posterior-right', 'Right posterior deltoid', 'Right rear deltoid', 'deltoid', 'im'),
  site('glute-upper-outer-left', 'Left upper outer glute', 'Left upper outer glute', 'glute', 'im', {
    restrictedByDefault: true,
  }),
  site('glute-upper-outer-right', 'Right upper outer glute', 'Right upper outer glute', 'glute', 'im', {
    restrictedByDefault: true,
  }),
  site('lower-back-left', 'Left lower back', 'Left lower back', 'back', 'subq'),
  site('lower-back-right', 'Right lower back', 'Right lower back', 'back', 'subq'),
];

const frontZoneDefinitions = [
  ['abdomen-upper-left', 'left', 'M312 430 C326 420 350 421 360 433 L359 482 C345 487 326 487 312 482 Z', 30],
  ['abdomen-upper-right', 'right', 'M366 433 C378 421 401 421 414 430 L414 482 C400 487 380 487 366 482 Z', 30],
  ['abdomen-mid-left', 'left', 'M311 493 C326 489 345 489 360 494 L359 558 C344 563 326 562 311 557 Z', 31],
  ['abdomen-mid-right', 'right', 'M366 494 C381 489 400 489 415 493 L415 557 C400 562 381 563 366 558 Z', 31],
  ['abdomen-lower-left', 'left', 'M313 570 C328 565 344 565 358 571 L356 636 C340 632 324 625 314 612 Z', 32],
  ['abdomen-lower-right', 'right', 'M368 571 C382 565 399 565 414 570 L413 612 C402 625 386 632 370 636 Z', 32],
  ['flank-left', 'left', 'M258 428 C282 444 297 493 295 560 C282 560 267 552 254 538 C246 494 247 458 258 428 Z', 24],
  ['flank-right', 'right', 'M468 428 C479 458 480 494 472 538 C459 552 444 560 431 560 C429 493 444 444 468 428 Z', 24],
  ['thigh-front-upper-left', 'left', 'M262 666 C283 652 315 659 329 681 C329 729 319 772 306 811 C283 800 261 779 252 751 C250 718 253 691 262 666 Z', 28],
  ['thigh-front-upper-right', 'right', 'M464 666 C473 691 476 718 474 751 C465 779 443 800 420 811 C407 772 397 729 397 681 C411 659 443 652 464 666 Z', 28],
  ['thigh-front-mid-left', 'left', 'M252 772 C267 797 286 816 306 827 C305 870 301 910 292 941 C276 939 264 921 257 895 C250 855 247 814 252 772 Z', 29],
  ['thigh-front-mid-right', 'right', 'M474 772 C479 814 476 855 469 895 C462 921 450 939 434 941 C425 910 421 870 420 827 C440 816 459 797 474 772 Z', 29],
  ['thigh-outer-left', 'left', 'M238 700 C250 733 248 829 258 899 C241 874 232 828 230 781 C228 744 230 718 238 700 Z', 27],
  ['thigh-outer-right', 'right', 'M488 700 C496 718 498 744 496 781 C494 828 485 874 468 899 C478 829 476 733 488 700 Z', 27],
  ['delt-anterior-left', 'left', 'M219 316 C244 297 273 303 283 324 C268 348 252 371 231 396 C208 386 193 369 194 349 C196 336 205 325 219 316 Z', 35],
  ['delt-anterior-right', 'right', 'M506 316 C520 325 529 336 531 349 C532 369 517 386 494 396 C473 371 457 348 442 324 C452 303 481 297 506 316 Z', 35],
  ['delt-lateral-left', 'left', 'M195 351 C194 380 209 397 229 405 C214 431 203 459 190 493 C179 486 177 462 180 439 C183 407 185 375 195 351 Z', 34],
  ['delt-lateral-right', 'right', 'M531 351 C541 375 543 407 546 439 C549 462 547 486 536 493 C523 459 512 431 497 405 C517 397 532 380 531 351 Z', 34],
] as const;

const femaleFrontZoneDefinitions = [
  ['abdomen-upper-left', 'left', 'M263 444 C277 438 296 438 310 442 L309 513 C294 511 278 512 264 516 C258 493 258 463 263 444 Z', 30],
  ['abdomen-upper-right', 'right', 'M331 442 C346 438 365 438 379 444 C383 463 383 493 377 516 C363 512 346 511 332 513 Z', 30],
  ['abdomen-mid-left', 'left', 'M263 526 C277 516 295 513 310 520 L309 560 C294 554 278 552 264 553 C260 545 260 535 263 526 Z', 31],
  ['abdomen-mid-right', 'right', 'M331 520 C347 513 365 516 378 526 C381 535 381 545 377 553 C363 552 347 554 332 560 Z', 31],
  ['abdomen-lower-left', 'left', 'M264 560 C284 557 300 563 310 578 C312 616 313 650 312 671 C307 677 300 680 295 677 C277 651 265 603 263 572 Z', 32],
  ['abdomen-lower-right', 'right', 'M332 578 C342 563 358 557 378 560 C376 603 364 651 345 677 C340 680 333 677 329 671 C328 650 329 616 332 578 Z', 32],
  ['flank-left', 'left', 'M239 442 C252 455 258 492 256 524 C257 557 262 590 258 615 C247 613 240 604 239 590 C239 560 239 520 240 499 C240 477 236 460 239 442 Z', 24],
  ['flank-right', 'right', 'M399 442 C402 460 398 477 399 499 C400 520 400 560 400 590 C399 604 392 613 382 615 C378 590 383 557 382 524 C380 492 386 455 399 442 Z', 24],
  ['thigh-front-upper-left', 'left', 'M213 623 C229 675 248 733 265 782 C268 819 270 856 268 892 C256 893 246 887 241 875 C228 840 216 800 209 759 C203 710 204 665 213 623 Z', 28],
  ['thigh-front-upper-right', 'right', 'M428 623 C437 665 438 710 432 759 C425 800 413 840 400 875 C395 887 385 893 373 892 C371 856 373 819 376 782 C393 733 412 675 428 623 Z', 28],
  ['thigh-front-mid-left', 'left', 'M244 858 C253 893 252 923 251 958 C251 963 259 963 263 961 C266 938 268 910 269 880 C270 850 268 821 265 790 C254 811 247 834 244 858 Z', 29],
  ['thigh-front-mid-right', 'right', 'M397 858 C388 893 389 923 390 958 C390 963 382 963 378 961 C375 938 373 910 372 880 C371 850 373 821 376 790 C387 811 394 834 397 858 Z', 29],
  ['thigh-outer-left', 'left', 'M199 724 C204 782 219 843 240 898 C242 925 241 946 238 956 C223 920 207 866 199 810 C196 776 196 747 199 724 Z', 27],
  ['thigh-outer-right', 'right', 'M442 724 C437 782 422 843 401 898 C399 925 400 946 403 956 C418 920 434 866 442 810 C445 776 445 747 442 724 Z', 27],
  ['delt-anterior-left', 'left', 'M216 289 C228 291 237 296 238 306 C235 332 226 350 210 360 C199 368 187 371 178 370 C184 338 199 310 216 289 Z', 35],
  ['delt-anterior-right', 'right', 'M425 289 C413 291 404 296 403 306 C406 332 415 350 431 360 C442 368 454 371 463 370 C457 338 442 310 425 289 Z', 35],
  ['delt-lateral-left', 'left', 'M172 319 C184 305 199 294 216 289 C202 305 186 329 177 356 C175 363 173 370 171 377 C165 374 162 366 164 355 C166 341 168 329 172 319 Z', 34],
  ['delt-lateral-right', 'right', 'M469 319 C457 305 442 294 425 289 C439 305 455 329 464 356 C466 363 468 370 470 377 C476 374 479 366 477 355 C475 341 473 329 469 319 Z', 34],
] as const;

const backZoneDefinitions = [
  ['delt-posterior-left', 'left', 'M938 318 C963 300 994 305 1004 326 C990 350 971 374 951 397 C927 389 912 371 914 350 C916 337 925 326 938 318 Z', 34],
  ['delt-posterior-right', 'right', 'M1234 318 C1247 326 1256 337 1258 350 C1260 371 1245 389 1221 397 C1201 374 1182 350 1168 326 C1178 305 1209 300 1234 318 Z', 34],
  ['glute-upper-outer-left', 'left', 'M1010 692 C1029 676 1060 678 1078 702 C1077 744 1064 775 1040 790 C1018 772 1006 738 1010 692 Z', 33],
  ['glute-upper-outer-right', 'right', 'M1094 702 C1112 678 1142 676 1160 692 C1164 738 1150 772 1127 790 C1105 775 1094 744 1094 702 Z', 33],
  ['lower-back-left', 'left', 'M1013 458 C1034 448 1065 449 1081 462 L1079 557 C1058 568 1031 566 1010 552 C1007 515 1008 484 1013 458 Z', 28],
  ['lower-back-right', 'right', 'M1092 462 C1106 449 1133 448 1150 458 C1154 484 1155 515 1152 552 C1135 566 1112 568 1094 557 Z', 28],
] as const;

const femaleBackZoneDefinitions = [
  ['delt-posterior-left', 'left', 'M1015 291 C1030 282 1048 289 1058 302 C1033 322 1010 345 993 371 C992 362 991 353 991 347 C991 322 998 301 1015 291 Z', 34],
  ['delt-posterior-right', 'right', 'M1270 291 C1255 282 1239 289 1231 302 C1255 322 1276 345 1291 371 C1292 362 1293 353 1293 347 C1292 322 1286 301 1270 291 Z', 34],
  ['glute-upper-outer-left', 'left', 'M1032 631 C1048 602 1075 595 1104 629 C1071 635 1040 651 1021 679 C1020 661 1024 644 1032 631 Z M1021 688 C1041 657 1075 638 1133 633 C1135 658 1135 692 1134 721 C1126 741 1112 753 1092 758 C1078 763 1064 768 1053 776 C1034 754 1018 729 1016 704 C1016 698 1018 693 1021 688 Z', 33],
  ['glute-upper-outer-right', 'right', 'M1265 679 C1246 651 1215 635 1182 629 C1211 595 1238 602 1256 631 C1263 644 1267 661 1265 679 Z M1151 721 C1150 692 1150 658 1152 633 C1210 638 1245 657 1265 688 C1268 693 1270 698 1270 704 C1268 729 1252 754 1232 776 C1220 768 1205 763 1186 755 C1170 748 1158 737 1151 721 Z', 33],
  ['lower-back-left', 'left', 'M1068 544 C1080 559 1081 580 1080 584 L1060 596 C1061 577 1063 557 1067 547 Z M1082 556 C1098 537 1115 520 1133 508 C1134 538 1134 570 1133 596 C1132 603 1132 610 1131 616 C1118 599 1100 584 1082 556 Z', 28],
  ['lower-back-right', 'right', 'M1218 544 C1206 559 1205 580 1206 584 L1225 596 C1224 577 1222 557 1219 547 Z M1152 508 C1170 520 1188 537 1203 556 C1186 584 1168 599 1154 616 C1152 603 1151 596 1151 588 C1151 562 1152 535 1152 508 Z', 28],
] as const;

export const BODY_ZONES: BodyZone[] = [
  ...zonesForTemplate('male-front', frontZoneDefinitions),
  ...zonesForTemplate('female-front', femaleFrontZoneDefinitions),
  ...zonesForTemplate('male-back', backZoneDefinitions),
  ...zonesForTemplate('female-back', femaleBackZoneDefinitions),
];

export const BODY_HIT_TARGETS: BodyHitTarget[] = BODY_ZONES.map((zone) => ({
  id: `${zone.id}__hit`,
  zoneId: zone.id,
  pathData: zone.pathData,
  minTapPx: 48,
}));

export const SITE_ROUTE_COMPAT: SiteRouteCompat[] = BODY_SITES.flatMap((siteEntry) => {
  const sourceRoutes = siteEntry.bodyRegion === 'abdomen' || siteEntry.bodyRegion === 'back'
    ? ['subq']
    : siteEntry.bodyRegion === 'thigh' || siteEntry.bodyRegion === 'deltoid' || siteEntry.bodyRegion === 'glute'
      ? ['subq', 'im']
      : [];

  return (['subq', 'im', 'intranasal', 'oral', 'topical'] satisfies Route[]).map((route) => {
    const allowed = sourceRoutes.includes(route);
    return {
      id: `${siteEntry.siteCode}__${route}`,
      siteCode: siteEntry.siteCode,
      route,
      allowed,
      cautionLevel: allowed ? 'ok' : 'restricted',
      rationaleKey: allowed ? null : 'body_map.route_not_supported',
    };
  });
});

interface SiteOptions {
  restrictedByDefault?: boolean;
  requiresTraining?: boolean;
  assistanceRecommended?: boolean;
  protocolDependent?: boolean;
}

function site(
  siteCode: SiteCode,
  anatomicalName: string,
  patientName: string,
  bodyRegion: BodyRegion,
  defaultRoute: Route,
  options: SiteOptions = {},
): BodySite {
  return {
    siteCode,
    anatomicalName,
    patientName,
    bodyRegion,
    defaultRoute,
    restrictedByDefault: options.restrictedByDefault ?? false,
    requiresTraining: options.requiresTraining ?? false,
    assistanceRecommended: options.assistanceRecommended ?? false,
    protocolDependent: options.protocolDependent ?? false,
    notesKey: null,
  };
}

function zonesForTemplate(
  templateId: BodyTemplateId,
  definitions: readonly (readonly [SiteCode, ZoneSide, string, number])[],
): BodyZone[] {
  return definitions.map(([siteCode, side, pathData, zOrder]) => ({
    id: `${templateId}__${siteCode}`,
    templateId,
    siteCode,
    side,
    pathData,
    displayLabel: null,
    zOrder,
  }));
}

export function getBodyTemplate(sex: BodyTemplateSex, view: BodyTemplateView): BodyTemplate {
  const template = BODY_TEMPLATES.find((candidate) => candidate.sex === sex && candidate.view === view);
  if (!template) {
    throw new Error(`Missing body template for ${sex}-${view}`);
  }
  return template;
}

export function getBodyZones(templateId: BodyTemplateId): BodyZone[] {
  return BODY_ZONES.filter((zone) => zone.templateId === templateId).sort((a, b) => a.zOrder - b.zOrder);
}

export function getBodyHitTarget(zoneId: string): BodyHitTarget | undefined {
  return BODY_HIT_TARGETS.find((target) => target.zoneId === zoneId);
}
