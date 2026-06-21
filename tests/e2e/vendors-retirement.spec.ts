import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('retired vendors feature', () => {
  test('removes vendor navigation while preserving inventory source metadata', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('source-metadata-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'source-metadata-vial',
            name: 'Source metadata vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-14T00:00:00.000Z',
            source: 'PeptideSciences',
            lotNumber: 'SRC-2026-001',
            mg: 5,
            totalAmount: { value: 5, unit: 'mg' },
            bacWaterMl: 2,
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

    await page.goto('/more');

    await expect(page.getByRole('heading', { name: 'More' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Vendors/ })).toHaveCount(0);

    await page.getByRole('link', { name: /Inventory/ }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByText('Source').first()).toBeVisible();
    await expect(page.getByText('Vendor').first()).toHaveCount(0);
  });

  test('does not serve the retired vendors route', async ({ page }) => {
    await page.goto('/more/vendors');

    await expect(page.getByRole('heading', { name: 'Vendors' })).toHaveCount(0);
    await expect(page.getByText('This page could not be found.')).toBeVisible();
  });
});
