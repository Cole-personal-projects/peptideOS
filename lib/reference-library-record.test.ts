import { describe, expect, test } from 'vitest';
import {
  buildReferenceLibrarySnapshotFromRecords,
  parseReferenceLibraryRecord,
  validateReferenceLibraryRecord,
} from './reference-library-record';
import { validateReferenceSnapshot } from './reference-library-snapshot';

describe('lean reference library records', () => {
  test('builds protocol-ready compound intelligence from a v2 YAML record', () => {
    const record = parseReferenceLibraryRecord(validRetatrutideV2Yaml('approved'));

    const snapshot = buildReferenceLibrarySnapshotFromRecords([record], {
      exportedAt: '2026-06-19T00:00:00.000Z',
    });
    const retatrutide = snapshot.compounds[0] as any;

    expect(validateReferenceSnapshot(snapshot)).toEqual([]);
    expect(retatrutide).toMatchObject({
      id: 'retatrutide',
      name: 'Retatrutide',
      category: 'metabolic',
      compoundType: 'glp-1',
      defaultRoute: 'subq',
      defaultDoseUnit: 'mg',
      concentrationMode: 'reconstituted',
      reconstitutionDefaults: {
        typicalVialAmounts: [{ value: 5, unit: 'mg' }, { value: 10, unit: 'mg' }],
        typicalBacWaterMl: [1, 2],
      },
      inventoryProfile: {
        containerTypes: ['lyophilized-vial'],
        defaultPackageUnit: 'vial',
        requiredFields: expect.arrayContaining(['vial amount', 'lot number', 'source']),
      },
      protocolTemplates: [
        expect.objectContaining({
          id: 'retatrutide-triple-agonist',
          name: 'Triple Agonist',
          category: 'weight-loss',
          difficulty: 'advanced',
          schedule: expect.objectContaining({
            frequency: 'weekly',
            weekdays: [5],
            timesOfDay: ['08:00'],
          }),
          doseChips: [
            { value: 1, unit: 'mg', label: '1' },
            { value: 2, unit: 'mg', label: '2' },
            { value: 4, unit: 'mg', label: '4' },
            { value: 8, unit: 'mg', label: '8' },
            { value: 12, unit: 'mg', label: '12' },
          ],
          titration: [
            { doseValue: 0.5, doseUnit: 'mg', durationWeeks: 4 },
            { doseValue: 1, doseUnit: 'mg', durationWeeks: 4 },
            { doseValue: 2, doseUnit: 'mg', durationWeeks: 4 },
            { doseValue: 4, doseUnit: 'mg', durationWeeks: 4 },
            { doseValue: 8, doseUnit: 'mg', durationWeeks: 4 },
          ],
        }),
      ],
      peppiActions: expect.arrayContaining([
        expect.objectContaining({ id: 'build-retatrutide-protocol', type: 'build_protocol_preview' }),
      ]),
    });
  });

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

  test('carries record-specific storage into the app compound', () => {
    const record = parseReferenceLibraryRecord(validAhkCuYaml('approved'));

    const snapshot = buildReferenceLibrarySnapshotFromRecords([record], {
      exportedAt: '2026-06-19T00:00:00.000Z',
    });

    expect(snapshot.compounds[0].storage).toContain(
      'Finished topical AHK-Cu products: record and follow label storage instructions.',
    );
    expect(snapshot.compounds[0].storage).toContain(
      'Do not infer refrigerated vial handling unless the label or supplier documentation states it.',
    );
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

  test('rejects v2 protocol templates that do not interoperate with the compound record', () => {
    const record = parseReferenceLibraryRecord(validRetatrutideV2Yaml('draft'));
    record.protocol_templates![0].compound_ids = ['tirzepatide'];
    record.protocol_templates![0].schedule.frequency = 'daily';
    record.protocol_templates![0].schedule.weekdays = [5];
    record.inventory_profile!.default_vial_count = 0;
    record.calculator_profile!.typical_vial_amounts = [];

    expect(validateReferenceLibraryRecord(record)).toEqual(expect.arrayContaining([
      'retatrutide: protocol template "retatrutide-triple-agonist" must include compound_id',
      'retatrutide: protocol template "retatrutide-triple-agonist" weekly weekdays are only valid with weekly frequency',
      'retatrutide: inventory_profile.default_vial_count must be at least 1',
      'retatrutide: calculator_profile.typical_vial_amounts is required when reconstitution_compatible is true',
    ]));
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

handling:
  storage:
    - "Finished topical AHK-Cu products: record and follow label storage instructions."
    - "Raw AHK-Cu cosmetic ingredient: capture supplier COA/SDS/container storage language before treating it as inventory-ready."
    - "Do not infer refrigerated vial handling unless the label or supplier documentation states it."

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

function validRetatrutideV2Yaml(status: 'draft' | 'approved' | 'rejected') {
  return `
schema_version: 2
compound_id: retatrutide
status: ${status}
updated_at: "2026-06-19"

identity:
  name: Retatrutide
  aliases:
    - LY3437943
  non_aliases: []
  compound_type: glp-1

classification:
  primary_category: metabolic
  category_group: GLP-1
  secondary_categories:
    - fat-loss
  protocol_categories:
    - weight-loss

forms:
  primary_route: subq
  supported_routes:
    - subq
  excluded_routes:
    - route: oral
      reason: No oral Retatrutide product or route is established in reviewed sources.
  primary_unit: mg
  concentration_mode: reconstituted
  form_factors:
    - Lyophilized research vial
  verification_fields:
    - vial amount
    - lot number
    - source

positioning:
  why_use_this_compound:
    - Track a triple incretin agonist research compound in a GLP-1 workflow.
  who_is_tracking_this:
    - Users comparing GLP-1, GIP, and glucagon agonist research logs.
  common_user_goals:
    - Track appetite, weight trend, tolerability, HR, HRV, and sleep context.

mechanism:
  plain_english: Triple GLP-1, GIP, and glucagon receptor agonist.
  targets:
    - GLP-1 receptor
    - GIP receptor
    - glucagon receptor

evidence:
  tier: human_strong
  mechanism_targets:
    - GLP-1 receptor
    - GIP receptor
    - glucagon receptor
  claim_summary:
    - Published phase 2 obesity data reported dose-related body-weight reductions.
  evidence_gaps:
    - Retatrutide is investigational and not FDA approved.

risks:
  by_route:
    subq:
      known_contraindications: []
      caution_populations: []
      negative_stack_flags:
        - Review overlap with other incretin or appetite-suppressing compounds before saving a stack.
      formulation_risks:
        - Research-market vials can introduce identity, sterility, endotoxin, storage, and concentration uncertainty.
      unknowns:
        - Long-term safety for non-trial research-market products is not established.

storage:
  handling:
    - Verify storage from the exact vial label or supplier documentation.
    - Do not infer approved-product storage instructions for research-market vials.

tracking:
  useful_logs:
    - body weight
    - appetite
    - resting heart rate
    - HRV
    - sleep
    - gastrointestinal tolerability
  inventory_fields:
    - vial amount
    - lot number
    - source
    - COA
  peppi_actions:
    - Build a Retatrutide protocol preview from a selected template.

calculator_profile:
  reconstitution_compatible: true
  typical_vial_amounts:
    - value: 5
      unit: mg
    - value: 10
      unit: mg
  typical_bac_water_ml:
    - 1
    - 2
  syringe_types:
    - u100-1ml
  notes:
    - Calculator math is for user-confirmed vial amount and diluent only.

inventory_profile:
  container_types:
    - lyophilized-vial
  default_package_unit: vial
  default_vial_count: 1
  required_fields:
    - vial amount
    - lot number
    - source
  optional_fields:
    - COA
    - expiration

protocol_templates:
  - id: retatrutide-triple-agonist
    name: Triple Agonist
    category: weight-loss
    difficulty: advanced
    summary: Retatrutide-focused weekly tracking template for GLP-1, GIP, and glucagon receptor agonist logs.
    compound_ids:
      - retatrutide
    default_compound_id: retatrutide
    dose_chips:
      - value: 1
        unit: mg
        label: "1"
      - value: 2
        unit: mg
        label: "2"
      - value: 4
        unit: mg
        label: "4"
      - value: 8
        unit: mg
        label: "8"
      - value: 12
        unit: mg
        label: "12"
    default_dose:
      value: 4
      unit: mg
    schedule:
      frequency: weekly
      weekdays:
        - 5
      times_of_day:
        - "08:00"
    titration:
      - dose_value: 0.5
        dose_unit: mg
        duration_weeks: 4
      - dose_value: 1
        dose_unit: mg
        duration_weeks: 4
      - dose_value: 2
        dose_unit: mg
        duration_weeks: 4
      - dose_value: 4
        dose_unit: mg
        duration_weeks: 4
      - dose_value: 8
        dose_unit: mg
        duration_weeks: 4
    warnings:
      - Monitor resting heart rate, HRV, sleep, and gastrointestinal tolerability as user-entered tracking signals.
    important_notes:
      - Start from user-confirmed instructions; PeptideOS does not prescribe dose escalation.

peppi_actions:
  - id: build-retatrutide-protocol
    type: build_protocol_preview
    label: Build Retatrutide protocol preview
    requires_confirmation: true
  - id: add-retatrutide-inventory
    type: create_inventory_from_label
    label: Add Retatrutide vial from label
    requires_confirmation: true

app_profile:
  headline: Triple incretin agonist tracked in GLP-1 research workflows.
  summary: Retatrutide is an investigational GLP-1, GIP, and glucagon receptor agonist that PeptideOS tracks through user-confirmed inventory, schedule, tolerability, and trend data.
  why_people_care:
    - It targets three incretin-related receptors instead of one or two.
  what_to_verify:
    - Verify vial identity, amount, lot, source, route, and storage from the physical product.
  what_to_track:
    - Weight trend, appetite, GI tolerability, resting heart rate, HRV, sleep, and missed entries.
  reality_check: Published clinical research is not the same as a user-sourced research vial.

sources:
  - id: src-retatrutide-phase2
    title: Triple-Hormone-Receptor Agonist Retatrutide for Obesity
    url: https://www.nejm.org/doi/full/10.1056/NEJMoa2301972
    source_type: publication
    publisher: New England Journal of Medicine
    year: 2023
  - id: src-retatrutide-trial
    title: ClinicalTrials.gov Retatrutide Phase 3 Program
    url: https://clinicaltrials.gov/
    source_type: trial
    publisher: ClinicalTrials.gov
    year: 2026

claims:
  - id: claim-triple-agonist
    text: Retatrutide is described in reviewed clinical literature as a GLP-1, GIP, and glucagon receptor agonist.
    claim_type: mechanism
    evidence_level: human_strong
    route_scope:
      - subq
    source_ids:
      - src-retatrutide-phase2
    confidence: high
    limitations: []
  - id: claim-investigational
    text: Retatrutide remains investigational and is not represented here as an FDA-approved product.
    claim_type: regulatory
    evidence_level: human_limited
    route_scope:
      - subq
    source_ids:
      - src-retatrutide-trial
    confidence: high
    limitations:
      - Trial registry context does not validate user-sourced products.
`;
}
