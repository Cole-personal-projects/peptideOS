import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import packageJson from '../package.json';
import { validateReferenceSnapshot } from './reference-library-snapshot';

describe('lean reference library record commands', () => {
  test('validates record files and builds a snapshot from approved records only', () => {
    const workDir = mkdtempSync(join(tmpdir(), 'peptideos-lean-library-'));
    const recordsDir = join(workDir, 'compounds');
    const outputPath = join(workDir, 'app-snapshot.json');

    try {
      mkdirSync(recordsDir, { recursive: true });
      writeFileSync(join(recordsDir, 'ahk-cu.yml'), validAhkCuYaml('approved'), 'utf8');
      writeFileSync(join(recordsDir, 'draft-compound.yml'), validAhkCuYaml('draft', 'draft-compound', 'Draft Compound'), 'utf8');

      expect(packageJson.scripts['library:validate-records']).toBe(
        'node tools/reference-library/validate-records.mjs --input reference-library/compounds',
      );
      expect(packageJson.scripts['library:build-records']).toBe(
        'node tools/reference-library/build-records.mjs --input reference-library/compounds --output app/generated/reference-library.snapshot.json',
      );

      const validation = spawnSync('node', [
        'tools/reference-library/validate-records.mjs',
        '--input',
        recordsDir,
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(validation.status).toBe(0);
      expect(validation.stderr).toBe('');
      expect(validation.stdout).toContain('Validated 2 reference library records');

      const build = spawnSync('node', [
        'tools/reference-library/build-records.mjs',
        '--input',
        recordsDir,
        '--output',
        outputPath,
        '--exported-at',
        '2026-06-19T00:00:00.000Z',
      ], {
        cwd: process.cwd(),
        encoding: 'utf8',
      });

      expect(build.status).toBe(0);
      expect(build.stderr).toBe('');
      expect(build.stdout).toContain('Built 1 approved reference library compounds');

      const snapshot = JSON.parse(readFileSync(outputPath, 'utf8'));
      expect(validateReferenceSnapshot(snapshot)).toEqual([]);
      expect(snapshot.exportedAt).toBe('2026-06-19T00:00:00.000Z');
      expect(snapshot.compounds.map((compound: { id: string }) => compound.id)).toEqual(['ahk-cu']);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});

function validAhkCuYaml(status: 'draft' | 'approved', compoundId = 'ahk-cu', name = 'AHK-Cu') {
  return `
schema_version: 1
compound_id: ${compoundId}
status: ${status}
updated_at: "2026-06-19"

identity:
  name: ${name}
  aliases: []
  non_aliases: []
  compound_type: peptide
  categories: [skin-hair]

forms:
  primary_route: topical
  supported_routes: [topical]
  excluded_routes:
    - route: subq
      reason: No source-backed route evidence in reviewed sources.
  form_factors: [Topical serum]
  verification_fields: [concentration, carrier base]

positioning:
  why_use_this_compound:
    - Track topical copper-peptide product details over time.
  who_is_tracking_this:
    - Users maintaining a topical cosmetic research log.
  common_user_goals:
    - Compare product response notes.

evidence:
  tier: preclinical
  mechanism_targets: [copper peptide signaling]
  claim_summary:
    - ${name} is tracked as a topical copper-peptide research compound.
  evidence_gaps:
    - Human controlled outcome data for topical products is limited in reviewed sources.

risks:
  by_route:
    topical:
      known_contraindications: []
      caution_populations: []
      negative_stack_flags: []
      formulation_risks:
        - Irritation potential depends on finished topical formulation.
      unknowns:
        - Formula-specific outcomes vary by product.

tracking:
  useful_logs: [application site, response notes]
  inventory_fields: [concentration, carrier base, lot]
  peppi_actions:
    - Add a labeled topical container to inventory.

app_profile:
  headline: Topical copper peptide tracked for skin and hair research.
  summary: ${name} is represented as a topical-first compound record for inventory, label verification, and response tracking.
  why_people_care:
    - It helps users keep product identity and topical response notes separate from other copper peptides.
  what_to_verify:
    - Confirm route, concentration, carrier base, and lot from the label.
  what_to_track:
    - Application site, local response, photos, and product lot.
  reality_check: The app should treat this as topical-first unless reviewed sources support another route.

sources:
  - id: src-${compoundId}
    title: Source summary for ${name}
    url: https://pubchem.ncbi.nlm.nih.gov/
    source_type: database
    publisher: PubChem
    year: 2026

claims:
  - id: claim-${compoundId}
    text: ${name} is tracked in this record as a topical-first copper peptide identity.
    claim_type: identity
    evidence_level: identity
    route_scope: [topical]
    source_ids: [src-${compoundId}]
    confidence: high
    limitations: []
`;
}
