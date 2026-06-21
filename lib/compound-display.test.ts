import { describe, expect, test } from 'vitest';
import {
  formatCompoundDisplayLabel,
  libraryCategoryOptions,
  libraryCompoundTypeOptions,
} from './compound-display';

describe('compound display helpers', () => {
  test('formats hyphenated option values as readable labels', () => {
    expect(formatCompoundDisplayLabel('growth-hormone')).toBe('Growth Hormone');
    expect(formatCompoundDisplayLabel('glp-1')).toBe('GLP-1');
  });

  test('keeps all option available for category and compound filters', () => {
    expect(libraryCategoryOptions[0]).toBe('all');
    expect(libraryCompoundTypeOptions[0]).toBe('all');
  });
});
