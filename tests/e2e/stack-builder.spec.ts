import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.describe('protocol builder', () => {
  test('applies a protocol template and still allows editing before save', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New protocol' }).click();

    await expect(page.getByRole('heading', { name: 'Templates' })).toBeVisible();
    await page.getByRole('button', { name: /Use Healing Recovery Demo/ }).click();

    await expect(page.getByLabel('Protocol Name')).toHaveValue('Healing Recovery Demo');
    await expect(page.getByLabel('Duration (days)')).toHaveValue('42');
    await page.getByLabel('Protocol Name').fill('Edited Template Protocol');
await page.getByRole('button', { name: 'Next' }).click();

await expect(page.getByRole('checkbox', { name: 'BPC-157' })).toBeChecked();
await expect(page.getByRole('checkbox', { name: 'TB-500' })).toBeChecked();
await expect(page.getByText('250 mcg').first()).toBeVisible();
await expect(page.getByText('2.5 mg').first()).toBeVisible();
await expect(page.getByText('Edited Template Protocol')).toBeVisible();
await page.getByRole('button', { name: 'Create Protocol' }).click();
    await expect(page.getByText('Edited Template Protocol')).toBeVisible();
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
            name: 'Existing BPC Protocol',
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
    await page.getByRole('button', { name: 'New protocol' }).click();

    await page.getByLabel('Protocol Name').fill('Overlap Review Protocol');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('checkbox', { name: 'BPC-157' }).check();

await expect(page.getByRole('heading', { name: 'Review warnings' })).toBeVisible();
    await expect(page.getByText('Review active protocol overlap')).toBeVisible();
    await expect(page.getByText(/BPC-157 is already present in active protocol/)).toBeVisible();

    await page.getByRole('button', { name: 'Create Protocol' }).click();
    await expect(page.getByText('Overlap Review Protocol')).toBeVisible();
  });

  test('creates a stack through the multi-step builder while preserving draft state', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
await page.getByRole('button', { name: 'New protocol' }).click();

await expect(page.getByRole('heading', { name: 'New Protocol' })).toBeVisible();
await expect(page.getByText('Step 1 of 2')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Configure' })).toBeVisible();

    await page.getByLabel('Protocol Name').fill('Cut Recovery Protocol');
    await page.getByLabel('Description').fill('Short recovery protocol');
await page.getByLabel('Duration (days)').fill('42');
await page.getByRole('button', { name: 'Next' }).click();

await expect(page.getByText('Step 2 of 2')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Add Peptides' })).toBeVisible();
const stepTwoBounds = await page.evaluate(() => {
  const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
  const addPeptidesHeading = Array.from(document.querySelectorAll<HTMLElement>('h2')).find((heading) => heading.textContent?.trim() === 'Add Peptides');
  const scheduleHeading = Array.from(document.querySelectorAll<HTMLElement>('h2')).find((heading) => heading.textContent?.trim() === 'Schedule');
  const elements = [dialog, addPeptidesHeading, scheduleHeading].filter(Boolean) as HTMLElement[];
  return elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewportWidth: window.innerWidth };
  });
});
for (const bounds of stepTwoBounds) {
  expect(bounds.left, `builder element should not drift left: ${JSON.stringify(bounds)}`).toBeGreaterThanOrEqual(0);
  expect(bounds.right, `builder element should not overflow right: ${JSON.stringify(bounds)}`).toBeLessThanOrEqual(bounds.viewportWidth);
}
await page.getByRole('checkbox', { name: 'BPC-157' }).check();
await page.getByRole('checkbox', { name: 'TB-500' }).check();

await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
await expect(page.getByText('250 mcg').first()).toBeVisible();
await expect(page.getByText('1 mg').first()).toBeVisible();
await page.locator('input[type="time"]').first().fill('10:30');

await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
    await expect(page.getByText('Cut Recovery Protocol')).toBeVisible();
    await expect(page.getByText('42 days', { exact: true })).toBeVisible();
    await expect(page.getByText('BPC-157').last()).toBeVisible();
    await expect(page.getByText('TB-500').last()).toBeVisible();

await page.getByRole('button', { name: 'Back' }).click();
await expect(page.getByRole('heading', { name: 'Configure' })).toBeVisible();
await page.getByRole('button', { name: 'Next' }).click();
await expect(page.locator('input[type="time"]').first()).toHaveValue('10:30');
await expect(page.getByRole('checkbox', { name: 'BPC-157' })).toBeChecked();
await expect(page.getByRole('checkbox', { name: 'TB-500' })).toBeChecked();

    await page.getByRole('button', { name: 'Create Protocol' }).click();
    await expect(page.getByRole('heading', { name: 'New Protocol' })).toHaveCount(0);
    await expect(page.getByText('Cut Recovery Protocol')).toBeVisible();
    await page.getByRole('link', { name: /Cut Recovery Protocol/ }).click();
    await expect(page.getByText('Daily · 10:30 AM')).toBeVisible();
  });

  test('edits protocol basics after a stack is created', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New protocol' }).click();
    await page.getByLabel('Protocol Name').fill('Editable Protocol Protocol');
    await page.getByLabel('Description').fill('Original protocol description');
    await page.getByLabel('Duration (days)').fill('21');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('checkbox', { name: 'BPC-157' }).check();
await page.getByRole('button', { name: 'Create Protocol' }).click();

await page.getByRole('link', { name: /Editable Protocol Protocol/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Edit protocol' }).click();
    await page.getByLabel('Protocol name').fill('Edited Protocol Protocol');
    await page.getByLabel('Description').fill('Updated protocol description');
    await page.getByLabel('Duration (days)').fill('28');
    await page.getByRole('textbox', { name: 'Notes' }).fill('Edited protocol notes');
    await page.getByRole('button', { name: 'Save changes' }).click();

await expect(page.getByRole('heading', { name: 'Edited Protocol Protocol' })).toBeVisible();
await expect(page.getByText('Updated protocol description')).toBeVisible();
await expect(page.getByText('Week 1 of 4')).toBeVisible();
await expect(page.getByText('Edited protocol notes')).toBeVisible();
  });

  test('deletes a saved protocol after confirmation', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByRole('button', { name: 'New protocol' }).click();
    await page.getByLabel('Protocol Name').fill('Delete Me Protocol Protocol');
    await page.getByLabel('Description').fill('Temporary protocol');
    await page.getByLabel('Duration (days)').fill('14');
await page.getByRole('button', { name: 'Next' }).click();
await page.getByRole('checkbox', { name: 'BPC-157' }).check();
await page.getByRole('button', { name: 'Create Protocol' }).click();

await page.getByRole('link', { name: /Delete Me Protocol Protocol/ }).click();
await page.getByRole('button', { name: 'Protocol settings' }).click();
await page.getByRole('button', { name: 'Delete protocol' }).click();

    await expect(page.getByText('Delete this protocol?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete now' }).click();

    await expect(page).toHaveURL(/\/stacks$/);
    await expect(page.getByRole('link', { name: /Delete Me Protocol Protocol/ })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('link', { name: /Delete Me Protocol Protocol/ })).toHaveCount(0);
  });
});
