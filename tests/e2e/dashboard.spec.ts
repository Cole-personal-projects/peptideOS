import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { addTestVial } from './helpers/inventory';

test.describe('dashboard polish', () => {
  test('shows briefing and adherence widgets after first-run accept', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening)/ })).toBeVisible();
    await expect(page.getByText("Today's Briefing")).toBeVisible();
    await expect(page.getByText('Dose completion')).toBeVisible();
    await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible();
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Adherence')).toBeVisible();
    await expect(page.getByLabel('Recent adherence')).toBeVisible();
  });

  test('labels scheduled dose states and recent scheduled completions clearly', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-05-23T12:00:00-07:00'));
    await addTestVial(page, {
      name: 'BPC-157 active vial',
      compound: 'BPC-157',
      status: 'active',
    });

    await page.goto('/stacks');

    await page.getByRole('button', { name: 'New stack' }).click();
    await page.getByLabel('Stack Name').fill('Dashboard Actionability Stack');
    await page.getByLabel('Duration (days)').fill('2');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Create Stack' }).click();

    await page.getByRole('link', { name: /Dashboard Actionability Stack/ }).click();
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();

    await expect(page.getByText('Due today')).toBeVisible();
    await expect(page.getByText('Pending action', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Complete' }).first().click();
    await page.getByRole('combobox').filter({ hasText: 'Select active vial' }).click();
    await page.getByRole('option', { name: /BPC-157 active vial/ }).click();
    await page.getByRole('button', { name: 'Upper Left Abdomen' }).click();
    await page.getByRole('button', { name: 'Complete dose' }).click();

    await expect(page.getByText('Taken today', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Completed scheduled dose')).toBeVisible();
  });

  test('gives a stack-building action when there are no due doses', async ({ page }, testInfo) => {
    const exportPath = testInfo.outputPath('empty-dashboard-data.json');
    await writeFile(exportPath, JSON.stringify({
      schemaVersion: 2,
      exportedAt: '2026-05-23T00:00:00.000Z',
      data: {
        vials: [],
        doses: [],
        stacks: [],
        schedules: [],
        scheduleLogs: [],
        compounds: [],
        settings: {
          hasSeenDisclaimer: true,
          hasCompletedOnboarding: true,
          userMode: 'researcher',
          biometricLock: false,
          darkMode: true,
        },
      },
    }));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();
    await page.getByLabel('Import Data File').setInputFiles(exportPath);
    await expect(page.getByRole('status')).toContainText('Data restored from backup.');

    await page.goto('/');

    await expect(page.getByText('No doses due today')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Build a stack' })).toBeVisible();
  });
});
