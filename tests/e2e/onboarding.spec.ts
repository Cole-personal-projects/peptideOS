import { expect, test } from '@playwright/test';

test.describe('first-launch onboarding', () => {
  test('supports setup mode selection applies researcher defaults library', async ({ page }) => {
    await page.goto('/');

    const welcome = page.getByRole('alertdialog', { name: 'Research Purposes Only' });
    await expect(welcome.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(welcome.getByText('Dose', { exact: true })).toBeVisible();
    await expect(welcome.getByText('Sites', { exact: true })).toBeVisible();
    await expect(welcome.getByText('Vials', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toBeVisible();
    await page.getByRole('button', { name: 'Set up profile' }).click();

    await expect(page.getByRole('heading', { name: 'Choose content depth' })).toBeVisible();
    await page.getByRole('radio', { name: 'Researcher' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Core workflows' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Ready to track' })).toBeVisible();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);

    await page.goto('/library');
    await expect(page.getByText('Researcher Mode: Showing detailed information')).toBeVisible();
    await expect(page.getByText(/stable gastric-derived peptide studied in tissue-repair.*inflammation models/i)).toBeVisible();

    await page.getByRole('link', { name: /BPC-157 Healing Reference/ }).click();
    await expect(page.getByText(/stable gastric-derived peptide studied in tissue-repair.*inflammation models/i)).toBeVisible();
  });

  test('guides a new user into a first active protocol with a due dose', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-23T12:00:00-07:00'));
    await page.goto('/');

    await page.getByRole('button', { name: 'Set up profile' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText('First protocol', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Start protocol' }).click();

    await expect(page.getByRole('heading', { name: 'New Protocol' })).toBeVisible();
    await page.getByLabel('Protocol Name').fill('First Protocol Path');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Search compounds').fill('bpc');
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Create Protocol' }).click();

    await expect(page.getByRole('heading', { name: 'Protocol Created' })).toBeVisible();
    await page.getByRole('link', { name: /First Protocol Path/ }).click();
    await page.getByRole('button', { name: 'Protocol settings' }).click();
    await page.getByRole('button', { name: 'Start' }).click();

    await expect(page.getByRole('heading', { name: 'Upcoming Doses' })).toBeVisible();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText('BPC-157').first()).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
  });
});
