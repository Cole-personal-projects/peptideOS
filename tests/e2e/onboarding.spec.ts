import { expect, test } from '@playwright/test';

test.describe('first-launch onboarding', () => {
  test('guides first-time users once and applies researcher defaults', async ({ page }) => {
    await page.goto('/');

    const setup = page.getByRole('alertdialog', { name: 'One-time setup' });
    await expect(setup.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(setup.getByText('Purpose', { exact: true })).toBeVisible();
    await expect(setup.getByText('Depth', { exact: true })).toBeVisible();
    await expect(setup.getByText('Workflow', { exact: true })).toBeVisible();
    await expect(setup.getByText('Ready', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Start setup' }).click();
    await expect(page.getByRole('heading', { name: 'Choose content depth' })).toBeVisible();
    await page.getByRole('radio', { name: 'Researcher' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    const workflow = page.getByRole('alertdialog', { name: 'What you will use first' });
    await expect(workflow.getByRole('heading', { name: 'What you will use first' })).toBeVisible();
    await expect(workflow.getByText('Protocols', { exact: true })).toBeVisible();
    await expect(workflow.getByText('Stock', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Ready to track' })).toBeVisible();
    await page.getByRole('button', { name: 'Enter PeptideOS' }).click();

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'One-time setup' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'One-time setup' })).toHaveCount(0);

    await page.goto('/library');
    await expect(page.getByText('Researcher Mode: Showing detailed information')).toBeVisible();
    await expect(page.getByText(/stable gastric-derived peptide studied in tissue-repair.*inflammation models/i)).toBeVisible();
  });
});
