import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('stack builder', () => {
  test('applies a stack template and still allows editing before save', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();

    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await page.getByRole('button', { name: /Use Healing Recovery Demo/ }).click();

    await expect(page.getByLabel('Stack Name')).toHaveValue('Healing Recovery Demo');
    await expect(page.getByLabel('Duration (days)')).toHaveValue('42');
    await page.getByLabel('Stack Name').fill('Edited Template Stack');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('checkbox', { name: 'BPC-157' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'TB-500' })).toBeChecked();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('2.5 mg').first()).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Edited Template Stack')).toBeVisible();
    await page.getByRole('button', { name: 'Create Stack' }).click();
    await expect(page.getByText('Edited Template Stack')).toBeVisible();
  });

  test('shows non-blocking conflict warnings before saving a stack', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('active-stack-conflict-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 4,
      exportedAt: '2026-06-14T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [
          {
            id: 'existing-bpc-stack',
            name: 'Existing BPC Stack',
            description: '',
            peptides: [
              {
                peptideId: 'bpc-157',
                doseValue: 250,
                doseUnit: 'mcg',
                frequency: 'daily',
                route: 'subq',
                timing: 'Morning',
              },
            ],
            startDate: '2026-06-14T00:00:00.000Z',
            durationDays: 14,
            status: 'active',
            notes: '',
          },
        ],
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
    await page.getByRole('button', { name: 'New stack' }).click();

    await page.getByLabel('Stack Name').fill('Overlap Review Stack');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Review warnings' })).toBeVisible();
    await expect(page.getByText('Review active stack overlap')).toBeVisible();
    await expect(page.getByText(/BPC-157 is already present in active stack/)).toBeVisible();

    await page.getByRole('button', { name: 'Create Stack' }).click();
    await expect(page.getByText('Overlap Review Stack')).toBeVisible();
  });

  test('creates a stack through the multi-step builder while preserving draft state', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();

    await expect(page.getByRole('heading', { name: 'New Stack' })).toBeVisible();
    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Basics' })).toBeVisible();

    await page.getByLabel('Stack Name').fill('Cut Recovery Stack');
    await page.getByLabel('Description').fill('Short recovery protocol');
    await page.getByLabel('Duration (days)').fill('42');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compounds' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('checkbox', { name: 'TB-500' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('1 mg').first()).toBeVisible();
    await page.locator('input[type="time"]').first().fill('10:30');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
    await expect(page.getByText('Cut Recovery Stack')).toBeVisible();
    await expect(page.getByText('42 days', { exact: true })).toBeVisible();
    await expect(page.getByText('BPC-157').last()).toBeVisible();
    await expect(page.getByText('TB-500').last()).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
    await expect(page.locator('input[type="time"]').first()).toHaveValue('10:30');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('checkbox', { name: 'BPC-157' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'TB-500' })).toBeChecked();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('button', { name: 'Create Stack' }).click();
    await expect(page.getByRole('heading', { name: 'New Stack' })).toHaveCount(0);
    await expect(page.getByText('Cut Recovery Stack')).toBeVisible();
    await page.getByRole('link', { name: /Cut Recovery Stack/ }).click();
    await expect(page.getByText('Daily · 10:30 AM')).toBeVisible();
  });

  test('edits protocol basics after a stack is created', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Editable Protocol Stack');
    await page.getByLabel('Description').fill('Original protocol description');
    await page.getByLabel('Duration (days)').fill('21');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('button', { name: 'Create Stack' }).click();

await page.getByRole('link', { name: /Editable Protocol Stack/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Edit protocol' }).click();
    await page.getByLabel('Protocol name').fill('Edited Protocol Stack');
    await page.getByLabel('Description').fill('Updated protocol description');
    await page.getByLabel('Duration (days)').fill('28');
    await page.getByRole('textbox', { name: 'Notes' }).fill('Edited protocol notes');
    await page.getByRole('button', { name: 'Save changes' }).click();

await expect(page.getByRole('heading', { name: 'Edited Protocol Stack' })).toBeVisible();
await expect(page.getByText('Updated protocol description')).toBeVisible();
await expect(page.getByText('Week 1 of 4')).toBeVisible();
await expect(page.getByText('Edited protocol notes')).toBeVisible();
  });

  test('deletes a saved protocol after confirmation', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Delete Me Protocol Stack');
    await page.getByLabel('Description').fill('Temporary protocol');
    await page.getByLabel('Duration (days)').fill('14');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('button', { name: 'Create Stack' }).click();

await page.getByRole('link', { name: /Delete Me Protocol Stack/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Delete protocol' }).click();

    const dialog = page.getByRole('alertdialog', { name: 'Delete protocol?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete protocol' }).click();

    await expect(page).toHaveURL(/\/stacks$/);
    await expect(page.getByRole('link', { name: /Delete Me Protocol Stack/ })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('link', { name: /Delete Me Protocol Stack/ })).toHaveCount(0);
  });
});
