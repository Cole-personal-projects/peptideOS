import { expect, test } from '@playwright/test';

test.describe('library detail pages', () => {
  test('supports beginner and researcher compound detail modes across required tabs', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();
    await expect(page.getByText('For research purposes only. This information is not medical advice.')).toBeVisible();

    await expect(page.getByText('A synthetic pentadecapeptide commonly tracked')).toBeVisible();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toHaveCount(0);

    await page.getByRole('switch', { name: 'Researcher mode' }).click();
    await expect(page.getByText('BPC-157 is described in preclinical literature')).toBeVisible();

    for (const tabName of ['Safety', 'Citations', 'Legal']) {
      await page.getByRole('tab', { name: tabName }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Citations' }).click();
    await expect(page.getByText('Stable Gastric Pentadecapeptide BPC 157 and Wound Healing')).toBeVisible();

    await page.getByRole('tab', { name: 'Legal' }).click();
    await expect(
      page.getByText('PeptideOS does not provide medical advice, diagnosis, or treatment.')
    ).toBeVisible();
  });

  test('preserves IU display on hGH compound detail pages', async ({ page }) => {
    await page.goto('/library/hgh-somatropin');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH / Somatropin' })).toBeVisible();
    await expect(page.getByText('IU')).toBeVisible();
  });

  test('creates, edits, persists, and deletes a custom compound', async ({ page }) => {
    await page.goto('/library');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Add compound' }).click();
    await page.getByLabel('Name').fill('Custom Focus Blend');
    await page.getByLabel('Type', { exact: true }).selectOption('small-molecule');
    await page.getByLabel('Category', { exact: true }).selectOption('cognitive');
    await page.getByLabel('Route', { exact: true }).selectOption('oral');
    await page.getByLabel('Unit', { exact: true }).selectOption('mg');
    await page.getByLabel('Summary').fill('Private focus tracking note.');
    await page.getByRole('button', { name: 'Save compound' }).click();

    await expect(page.getByRole('link', { name: /Custom Focus Blend/ })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('link', { name: /Custom Focus Blend/ })).toBeVisible();

    await page.getByRole('link', { name: /Custom Focus Blend/ }).click();
    await page.getByRole('button', { name: 'Edit compound' }).click();
    await page.getByLabel('Name').fill('Custom Focus Blend Edited');
    await page.getByLabel('Summary').fill('Edited private focus tracking note.');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Custom Focus Blend Edited' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit compound' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByRole('link', { name: /Custom Focus Blend Edited/ })).toHaveCount(0);
  });
});
