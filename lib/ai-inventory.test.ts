import { describe, expect, test } from 'vitest';
import { parsedInventoryToVialDraft, type ParsedInventoryIntake } from './ai-inventory';
import type { ProtocolCompoundInput } from './ai-protocol';

const compounds: ProtocolCompoundInput[] = [
  {
    id: 'kpv',
    name: 'KPV',
    defaultRoute: 'subq',
    supportedRoutes: ['subq'],
    defaultDoseUnit: 'mg',
  },
];

describe('parsedInventoryToVialDraft', () => {
  test('builds a sealed kit vial draft from parsed inventory intake', () => {
    const parsed: ParsedInventoryIntake = {
      compoundName: 'KPV',
      vialAmountValue: 10,
      vialAmountUnit: 'mg',
      containerType: 'lyophilized-vial',
      packageUnit: 'kit',
      packageQuantity: 1,
    };

    expect(parsedInventoryToVialDraft(parsed, compounds, new Date('2026-06-15T08:00:00.000Z'))).toEqual({
      draft: {
        name: 'KPV kit',
        peptideId: 'kpv',
        dateAdded: '2026-06-15',
        containerType: 'lyophilized-vial',
        totalAmountValue: 10,
        totalAmountUnit: 'mg',
        packageUnit: 'kit',
        packageQuantity: 1,
      },
      unmatchedCompound: null,
    });
  });

  test('returns no draft when compound matching or vial amount is missing', () => {
    expect(parsedInventoryToVialDraft({
      compoundName: 'Unknown',
      vialAmountValue: 10,
      vialAmountUnit: 'mg',
      containerType: 'lyophilized-vial',
      packageUnit: 'kit',
      packageQuantity: 1,
    }, compounds)).toEqual({
      draft: null,
      unmatchedCompound: 'Unknown',
    });

    expect(parsedInventoryToVialDraft({
      compoundName: 'KPV',
      vialAmountValue: null,
      vialAmountUnit: null,
      containerType: null,
      packageUnit: null,
      packageQuantity: null,
    }, compounds)).toEqual({
      draft: null,
      unmatchedCompound: null,
    });
  });
});
