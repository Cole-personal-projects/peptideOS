import { describe, expect, it } from 'vitest';
import { buildActionableLibraryProfile } from './actionable-library-profile';
import { referenceCompounds } from './reference-compounds';

function compound(id: string) {
  const value = referenceCompounds.find((entry) => entry.id === id);
  if (!value) throw new Error(`Missing fixture compound ${id}`);
  return value;
}

describe('actionable library profiles', () => {
  it('builds complete user-facing action sections for every reviewed compound', () => {
    const profiles = referenceCompounds.map(buildActionableLibraryProfile);

    expect(profiles).toHaveLength(referenceCompounds.length);
    profiles.forEach((profile) => {
      expect(profile.headline).toBeTruthy();
      expect(profile.summary).toBeTruthy();
      expect(profile.primaryActions.length).toBeGreaterThanOrEqual(3);
      expect(profile.verifyBeforeUse.length).toBeGreaterThanOrEqual(3);
      expect(profile.trackInApp.length).toBeGreaterThanOrEqual(3);
      expect(profile.inventoryGuidance.length).toBeGreaterThanOrEqual(2);
      expect(profile.transparencyFlags.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('turns GLP-style labeled container data into concrete user actions without dosing advice', () => {
    const profile = buildActionableLibraryProfile(compound('tirzepatide'));

    expect(profile.primaryActions).toEqual(expect.arrayContaining([
      'Add the exact labeled container or pen to inventory',
      'Build a schedule from user-confirmed label details',
      'Log administrations, missed doses, notes, and inventory depletion',
    ]));
    expect(profile.verifyBeforeUse).toEqual(expect.arrayContaining([
      'Container label, lot, expiration, strength, and route',
      'Whether the item is a prefilled pen, vial, capsule, or other container',
    ]));
    expect(profile.transparencyFlags).toContain('Approved-label or label-adjacent citations may describe a regulated product, not an unlabeled research item.');
    expect(JSON.stringify(profile)).not.toMatch(/recommended dose|dose recommendation|should take/i);
  });

  it('prefers an actionable profile exported from the reference database', () => {
    const profile = buildActionableLibraryProfile({
      ...compound('tirzepatide'),
      actionableProfile: {
        headline: 'Database-authored headline',
        summary: 'Database-authored summary',
        evidenceLabel: 'Database Evidence',
        statusLabel: 'Database Status',
        mechanismClass: 'Database Mechanism',
        primaryActions: ['Database action'],
        verifyBeforeUse: ['Database verification'],
        trackInApp: ['Database tracking'],
        inventoryGuidance: ['Database inventory guidance'],
        transparencyFlags: ['Database transparency flag'],
      },
    });

    expect(profile).toEqual({
      compoundId: 'tirzepatide',
      headline: 'Database-authored headline',
      summary: 'Database-authored summary',
      evidenceLabel: 'Database Evidence',
      statusLabel: 'Database Status',
      mechanismClass: 'Database Mechanism',
      primaryActions: ['Database action'],
      verifyBeforeUse: ['Database verification'],
      trackInApp: ['Database tracking'],
      inventoryGuidance: ['Database inventory guidance'],
      transparencyFlags: ['Database transparency flag'],
    });
  });

  it('turns reconstituted peptide metadata into inventory and math guidance', () => {
    const profile = buildActionableLibraryProfile(compound('bpc-157'));

    expect(profile.inventoryGuidance).toEqual(expect.arrayContaining([
      'Record vial amount, container state, lot, source, date added, and expiration.',
      'Common vial amount presets: 5 mg.',
      'BAC water calculator presets: 1 mL, 2 mL.',
    ]));
    expect(profile.primaryActions).toContain('Calculate reconstitution math after vial amount and diluent volume are confirmed');
    expect(profile.trackInApp).toContain('Reconstitution date, concentration, active vial status, and remaining inventory');
  });

  it('keeps emerging research compounds useful while making evidence limits explicit', () => {
    const profile = buildActionableLibraryProfile(compound('mots-c'));

    expect(profile.trackInApp).toEqual(expect.arrayContaining([
      'Schedule adherence and skipped or missed administrations',
      'Subjective response notes, side-effect notes, and trend observations',
    ]));
    expect(profile.transparencyFlags).toEqual(expect.arrayContaining([
      'Research-use entries are tracking references, not medical guidance.',
      'Source strength varies by compound; review citations before relying on a claim.',
    ]));
  });
});
