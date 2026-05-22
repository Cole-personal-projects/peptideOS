import { describe, expect, test } from 'vitest';
import { getEmptyStateContent } from './empty-states';

describe('empty state content', () => {
  test('defines useful content for every core empty list state', () => {
    const keys = [
      'library-no-results',
      'stacks-empty',
      'log-day-empty',
      'log-timeline-empty',
      'inventory-active-empty',
      'inventory-sealed-empty',
      'inventory-history-empty',
    ] as const;

    keys.forEach((key) => {
      const content = getEmptyStateContent(key);

      expect(content.title.length).toBeGreaterThan(8);
      expect(content.description.length).toBeGreaterThan(20);
      expect(content.description).not.toMatch(/coming soon|placeholder|lorem/i);
    });
  });

  test('only actionable empty states expose CTA labels', () => {
    expect(getEmptyStateContent('stacks-empty').actionLabel).toBe('Create stack');
    expect(getEmptyStateContent('inventory-sealed-empty').actionLabel).toBe('Add vial');
    expect(getEmptyStateContent('inventory-history-empty').actionLabel).toBeUndefined();
  });
});
