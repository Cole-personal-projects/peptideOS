import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('log dose sheet body picker', () => {
  test('supports compact body-map site selection and route filtering', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await expect(page.getByRole('heading', { name: 'Log Dose' })).toBeVisible();
    await expect(page.locator('[data-body-map-ready="true"]')).toBeVisible();
    await expect(page.getByRole('img', { name: 'male front injection site map' })).toBeVisible();

    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await expect(page.getByRole('status', { name: 'Selected site summary' })).toContainText('Upper Left Abdomen');

    await page.getByRole('tab', { name: 'IM' }).click();
    await expect(page.getByRole('button', { name: 'Upper Left Abdomen' })).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Left Anterior Deltoid' })).toBeVisible();
  });

  test('applies compound-aware dose preset chips without changing units', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'TB-500' }).click();

    await page.getByRole('button', { name: 'TB-500 2mg' }).click();
    await expect(page.getByPlaceholder('e.g., 250')).toHaveValue('2');
    await expect(page.getByRole('combobox').filter({ hasText: 'mg' })).toBeVisible();
  });

  test('logs IU-primary doses and renders the saved dose in IU', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('hgh-active-vial-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'hgh-active-vial',
            name: 'hGH active vial',
            peptideId: 'hgh',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-14T00:00:00.000Z',
            source: 'Pharmacy',
            lotNumber: 'HGH-2024-010',
            mg: 3.33,
            totalAmount: { value: 9.99, unit: 'iu' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-14T00:00:00.000Z',
            expirationDate: '2026-07-12T00:00:00.000Z',
            status: 'active',
          },
        ],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        reconstitutionCalculations: [],
        userCompounds: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'beginner',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('alertdialog', { name: 'Restore this PeptideOS backup?' })).toBeVisible();
    await page.getByRole('button', { name: 'Restore backup' }).click();
    await expect(page.getByRole('status')).toContainText('Data restored from backup');

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'Quick actions' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('combobox').filter({ hasText: 'Select compound' }).click();
    await page.getByRole('option', { name: 'hGH (Somatropin)' }).click();
    await page.getByRole('combobox').filter({ hasText: 'Select vial' }).click();
    await page.getByRole('option', { name: /HGH-2024-010/ }).click();

    await page.getByRole('button', { name: 'hGH 2 IU (beginner)' }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Log Dose' }).click();

    await page.getByRole('link', { name: 'Log' }).click();
    await expect(page.getByRole('heading', { name: 'Dose Log' })).toBeVisible();
    await expect(page.getByText('hGH (Somatropin)').first()).toBeVisible();
    await expect(page.getByText('2 IU').first()).toBeVisible();
  });
});
