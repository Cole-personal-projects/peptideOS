import { describe, expect, test } from 'vitest';
import { initialAppData } from './mock-data';

describe('initial app data', () => {
  test('starts fresh users without simulated user-owned records', () => {
    expect(initialAppData.peptides.length).toBeGreaterThan(0);
    expect(initialAppData.compounds.length).toBeGreaterThan(0);
    expect(initialAppData.vials).toEqual([]);
    expect(initialAppData.doses).toEqual([]);
    expect(initialAppData.stacks).toEqual([]);
    expect(initialAppData.schedules).toEqual([]);
    expect(initialAppData.scheduleLogs).toEqual([]);
    expect(initialAppData.reconstitutionCalculations).toEqual([]);
  });
});
