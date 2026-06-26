import { expect, test } from '@playwright/test';

test.describe('mobile custom compound entry', () => {
  test('keeps save compound action reachable on short screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await page.goto('/library');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => undefined);

    await page.getByRole('button', { name: 'Add compound' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add compound' });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder('e.g., KPV or custom blend').fill('Mobile Save Test');

    const saveButton = dialog.getByRole('button', { name: 'Save compound' });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    await expect(page.getByRole('link', { name: /Mobile Save Test/ })).toBeVisible();
  });
});
