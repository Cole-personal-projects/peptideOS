import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('inventory metrics', () => {
  test('starts fresh users with empty inventory tabs', async ({ page }) => {
    await page.goto('/more/inventory');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
    await expect(page.getByText('No active vials')).toBeVisible();

    await page.getByRole('tab', { name: /Sealed/ }).click();
    await expect(page.getByText('No sealed vials')).toBeVisible();
    await expect(page.getByRole('link', { name: /Ipamorelin bedtime vial/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /hGH active vial/ })).toHaveCount(0);
  });

  test('shows remaining amount and expiration metrics on inventory cards', async ({ page }, testInfo) => {
    await page.clock.setFixedTime(new Date('2026-06-14T12:00:00-07:00'));
    const exportPath = testInfo.outputPath('inventory-metrics-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [
          {
            id: 'vial-hgh-metrics',
            name: 'hGH active vial',
            peptideId: 'hgh',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-06-12T00:00:00.000Z',
            source: 'Pharmacy',
            lotNumber: 'HGH-2026-010',
            mg: 3.33,
            totalAmount: { value: 9.99, unit: 'iu' },
            bacWaterMl: 1,
            reconstitutedDate: '2026-06-12T00:00:00.000Z',
            expirationDate: '2026-07-10T00:00:00.000Z',
            status: 'active',
          },
          {
            id: 'vial-bpc-metrics',
            name: 'BPC-157 active vial',
            peptideId: 'bpc-157',
            containerType: 'lyophilized-vial',
            dateAdded: '2026-05-17T00:00:00.000Z',
            source: 'PeptideSciences',
            lotNumber: 'BPC-2026-001',
            mg: 5,
            totalAmount: { value: 5, unit: 'mg' },
            bacWaterMl: 2,
            reconstitutedDate: '2026-05-31T00:00:00.000Z',
            expirationDate: '2026-06-28T00:00:00.000Z',
            status: 'active',
          },
        ],
        doses: [
          {
            id: 'dose-bpc-metrics-used',
            peptideId: 'bpc-157',
            vialId: 'vial-bpc-metrics',
            dateTime: '2026-06-13T08:00:00.000Z',
            doseValue: 5,
            doseUnit: 'mg',
            route: 'subq',
            site: 'abdomen-upper-left',
            notes: '',
            completed: true,
          },
        ],
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
    await expect(page.getByRole('status')).toContainText('Data restored from backup.');

    await page.goto('/more/inventory');

    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    const hghCard = page.locator('a[href="/more/inventory/vial-hgh-metrics"]');
    await expect(hghCard).toContainText('hGH (Somatropin)');
    await expect(hghCard).toContainText('Remaining');
    await expect(hghCard).toContainText('9.99 IU');
    await expect(hghCard).toContainText('Expiration');
    await expect(hghCard).toContainText('26 days left');

    const bpcCard = page.locator('a[href="/more/inventory/vial-bpc-metrics"]');
    await expect(bpcCard).toContainText('Remaining');
    await expect(bpcCard).toContainText('0 mg');
    await expect(bpcCard).toContainText('Source');
    await expect(bpcCard).not.toContainText('Vendor');
  });
});
