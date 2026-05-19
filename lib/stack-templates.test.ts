import { describe, expect, it } from 'vitest';
import { getStackTemplateById, stackTemplates, templateToStackDraft } from './stack-templates';

describe('stack templates', () => {
  it('exposes conservative starter templates including an IU-native option', () => {
    expect(stackTemplates).toHaveLength(3);
    expect(stackTemplates.map((template) => template.id)).toEqual([
      'healing-recovery-demo',
      'metabolic-reset-demo',
      'gh-support-demo',
    ]);
    expect(getStackTemplateById('gh-support-demo')?.peptides).toContainEqual(
      expect.objectContaining({ peptideId: 'hgh', doseValue: 2, doseUnit: 'iu' }),
    );
  });

  it('maps a template to an editable stack draft while preserving native dose units', () => {
    const draft = templateToStackDraft('healing-recovery-demo');

    expect(draft).toEqual({
      name: 'Healing Recovery Demo',
      description: 'Research-oriented recovery stack starter using existing demo compounds.',
      durationDays: 42,
      peptides: [
        expect.objectContaining({ peptideId: 'bpc-157', doseValue: 250, doseUnit: 'mcg' }),
        expect.objectContaining({ peptideId: 'tb-500', doseValue: 2.5, doseUnit: 'mg' }),
      ],
    });
  });

  it('returns null for unknown templates', () => {
    expect(getStackTemplateById('missing-template')).toBeNull();
    expect(templateToStackDraft('missing-template')).toBeNull();
  });
});
