import { expect, test } from '@playwright/test';

test.describe('mobile custom compound entry', () => {
  test('keeps save compound action reachable on short screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 520 });
    await page.goto('/library');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => undefined);

    await page.getByRole('button', { name: 'Add compound' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add compound' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('e.g., KPV or custom blend').fill('Mobile Save Test');

    const topSaveButton = dialog.getByRole('button', { name: 'Save' });
    await expect(topSaveButton).toBeVisible();
    await topSaveButton.click();

    await expect(page.getByRole('link', { name: /Mobile Save Test/ })).toBeVisible();
  });

  test('keeps footer save compound action inside the visible dialog', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 520 });
    await page.goto('/library');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => undefined);

    await page.getByRole('button', { name: 'Add compound' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add compound' });
    await expect(dialog).toBeVisible();

    const saveButton = dialog.getByRole('button', { name: 'Save compound' });
    await expect(saveButton).toBeVisible();
    const metrics = await saveButton.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        top: rect.top,
        viewportHeight: window.innerHeight,
      };
    });

    expect(metrics.top).toBeGreaterThanOrEqual(0);
    expect(metrics.bottom).toBeLessThanOrEqual(metrics.viewportHeight);
  });
});
