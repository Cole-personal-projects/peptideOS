import { describe, expect, test } from 'vitest';
import {
  buildReferenceLibrarySnapshotFromRecords,
  parseReferenceLibraryRecord,
  validateReferenceLibraryRecord,
} from './reference-library-record';
import { validateReferenceSnapshot } from './reference-library-snapshot';

describe('lean reference library records', () => {
  test('builds a valid app snapshot from an approved compound YAML record', () => {
    const record = parseReferenceLibraryRecord(validAhkCuYaml('approved'));

    const snapshot = buildReferenceLibrarySnapshotFromRecords([record], {
      exportedAt: '2026-06-19T00:00:00.000Z',
    });

    expect(validateReferenceSnapshot(snapshot)).toEqual([]);
    expect(snapshot.compounds).toHaveLength(1);
    expect(snapshot.compounds[0]).toMatchObject({
      id: 'ahk-cu',
      name: 'AHK-Cu',
      defaultRoute: 'topical',
      supportedRoutes: ['topical'],
      source: 'bundled',
      curationStatus: 'reviewed',
      referenceProfile: {
        biohackerBrief: {
          headline: 'Topical copper peptide tracked for skin and hair research.',
        },
        evidenceTier: 'preclinical',
      },
    });
  });

  test('rejects source-backed claims that do not cite a source', () => {
    const record = parseReferenceLibraryRecord(validAhkCuYaml('draft'));
    record.claims[0].source_ids = [];

    expect(validateReferenceLibraryRecord(record)).toContain(
      'ahk-cu: claim "claim-identity" requires source_ids unless evidence_level is unknown or theoretical',
    );
  });

  test('rejects risks and claims outside supported routes', () => {
    const record = parseReferenceLibraryRecord(validAhkCuYaml('draft'));
    record.risks.by_route.subq = {
      known_contraindications: [],
      caution_populations: [],
      negative_stack_flags: [],
      formulation_risks: ['Unsupported injectable risk copy should not appear here.'],
      unknowns: [],
    };
    record.claims[0].route_scope = ['subq'];

    expect(validateReferenceLibraryRecord(record)).toEqual(expect.arrayContaining([
      'ahk-cu: risks.by_route "subq" must be listed in forms.supported_routes',
      'ahk-cu: claim "claim-identity" route_scope "subq" must be listed in forms.supported_routes',
    ]));
  });

  test('rejects personal-use recommendation language', () => {
    const record = parseReferenceLibraryRecord(validAhkCuYaml('draft'));
    record.app_profile.summary = 'Users should take this as a treatment recommendation.';

    expect(validateReferenceLibraryRecord(record)).toContain(
      'ahk-cu: contains banned recommendation language',
    );
  });
});

function validAhkCuYaml(status: 'draft' | 'approved' | 'rejected') {
  return `
schema_version: 1
compound_id: ahk-cu
status: ${status}
updated_at: "2026-06-19"

identity:
  name: AHK-Cu
  aliases:
    - Alanine-histidine-lysine copper
  non_aliases:
    - GHK-Cu
  compound_type: peptide
  categories:
    - skin-hair

forms:
  primary_route: topical
  supported_routes:
    - topical
  excluded_routes:
    - route: subq
      reason: No source-backed route evidence in reviewed sources.
  form_factors:
    - Topical serum
  verification_fields:
    - concentration
    - carrier base

positioning:
  why_use_this_compound:
    - People track it when comparing topical copper-peptide products for skin and hair appearance goals.
  who_is_tracking_this:
    - Users maintaining a topical cosmetic research log.
  common_user_goals:
    - Track local skin or scalp response over time.

evidence:
  tier: preclinical
  mechanism_targets:
    - copper peptide signaling
    - dermal extracellular matrix research
  claim_summary:
    - AHK-Cu is discussed as a topical copper peptide in skin and hair research contexts.
  evidence_gaps:
    - Human controlled outcome data for topical AHK-Cu product use is limited in reviewed sources.

risks:
  by_route:
    topical:
      known_contraindications: []
      caution_populations: []
      negative_stack_flags: []
      formulation_risks:
        - Irritation potential depends on the topical formula, carrier, and user sensitivity.
      unknowns:
        - Long-term cosmetic product outcomes vary by formulation and were not standardized in reviewed sources.

tracking:
  useful_logs:
    - application site
    - skin or scalp response notes
  inventory_fields:
    - concentration
    - carrier base
    - lot
  peppi_actions:
    - Add a labeled AHK-Cu topical container to inventory.
    - Track application-site notes and photos over time.

app_profile:
  headline: Topical copper peptide tracked for skin and hair research.
  summary: AHK-Cu is a copper-binding tripeptide derivative most relevant to PeptideOS as a topical skin-hair tracking compound, not as a default injectable protocol compound.
  why_people_care:
    - It gives users a way to distinguish AHK-Cu topical products from GHK-Cu and log cosmetic response over time.
  what_to_verify:
    - Confirm the label says AHK-Cu and not GHK-Cu.
    - Confirm route, concentration, carrier base, and expiration details from the product label.
  what_to_track:
    - Application site, local response, photos, product lot, and consistency of use.
  reality_check: The app should treat AHK-Cu as topical-first unless a reviewed source supports another route.

sources:
  - id: src-pubchem-ahk-cu
    title: PubChem Compound Summary for AHK-Cu
    url: https://pubchem.ncbi.nlm.nih.gov/
    source_type: database
    publisher: PubChem
    year: 2026
  - id: src-copper-peptides-review
    title: Copper peptides and skin biology review
    url: https://pmc.ncbi.nlm.nih.gov/
    source_type: review
    publisher: PubMed Central
    year: 2024

claims:
  - id: claim-identity
    text: AHK-Cu is a copper-binding peptide identity used in topical skin and hair research contexts.
    claim_type: identity
    evidence_level: identity
    route_scope:
      - topical
    source_ids:
      - src-pubchem-ahk-cu
    confidence: high
    limitations: []
  - id: claim-formulation
    text: Topical tolerability and user experience depend on the finished formulation and carrier base.
    claim_type: formulation
    evidence_level: theoretical
    route_scope:
      - topical
    source_ids: []
    confidence: medium
    limitations:
      - Formula-specific claims require product-specific source review.
`;
}
