import { expect, test } from '@playwright/test';

test.describe('library detail pages', () => {
  test('supports beginner and researcher detail modes across required tabs', async ({ page }) => {
    await page.goto('/library/bpc-157');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'BPC-157' })).toBeVisible();
    await expect(page.getByText('For research purposes only. This information is not medical advice.')).toBeVisible();

    await expect(page.getByText('A synthetic peptide derived from a protective protein')).toBeVisible();
    await expect(page.getByText('Body Protection Compound-157 is a pentadecapeptide')).toHaveCount(0);

    await page.getByRole('switch', { name: 'Researcher mode' }).click();
    await expect(page.getByText('Body Protection Compound-157 is a pentadecapeptide')).toBeVisible();

    for (const tabName of ['Protocols', 'Safety', 'Citations', 'Legal']) {
      await page.getByRole('tab', { name: tabName }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }

    await page.getByRole('tab', { name: 'Citations' }).click();
    await expect(page.getByText('Pentadecapeptide BPC 157 and its effects on a nitric oxide system')).toBeVisible();

    await page.getByRole('tab', { name: 'Legal' }).click();
    await expect(
      page.getByText('PeptideOS does not provide medical advice, diagnosis, or treatment.')
    ).toBeVisible();
  });

  test('preserves IU protocol display on IU-primary peptide detail pages', async ({ page }) => {
    await page.goto('/library/hgh');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'hGH (Somatropin)' })).toBeVisible();

    await page.getByRole('tab', { name: 'Protocols' }).click();
    await expect(page.getByText('Beginner: 1-2 IU daily')).toBeVisible();
    await expect(page.getByText('Intermediate: 3-4 IU daily')).toBeVisible();
  });
});
