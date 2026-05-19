import { expect, test } from '@playwright/test';

test.describe('stack builder', () => {
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
    await expect(page.getByRole('heading', { name: 'Peptides' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('checkbox', { name: 'TB-500' }).check();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
    await expect(page.getByText('250 mcg').first()).toBeVisible();
    await expect(page.getByText('1 mg').first()).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review' })).toBeVisible();
    await expect(page.getByText('Cut Recovery Stack')).toBeVisible();
    await expect(page.getByText('42 days', { exact: true })).toBeVisible();
    await expect(page.getByText('BPC-157').last()).toBeVisible();
    await expect(page.getByText('TB-500').last()).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('checkbox', { name: 'BPC-157' })).toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'TB-500' })).toBeChecked();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    await page.getByRole('button', { name: 'Create Stack' }).click();
    await expect(page.getByRole('heading', { name: 'New Stack' })).toHaveCount(0);
    await expect(page.getByText('Cut Recovery Stack')).toBeVisible();
  });
});
