import { expect, test } from '@playwright/test';

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

  test('shows non-blocking conflict warnings before saving a stack', async ({ page }) => {
    await page.goto('/stacks');

    await page.getByRole('button', { name: 'I Understand' }).click();
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
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review', exact: true })).toBeVisible();
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
    await page.getByRole('button', { name: 'Edit protocol' }).click();
    await page.getByLabel('Protocol name').fill('Edited Protocol Stack');
    await page.getByLabel('Description').fill('Updated protocol description');
    await page.getByLabel('Duration (days)').fill('28');
    await page.getByRole('textbox', { name: 'Notes' }).fill('Edited protocol notes');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('heading', { name: 'Edited Protocol Stack' })).toBeVisible();
    await expect(page.getByText('Updated protocol description')).toBeVisible();
    await expect(page.getByText('28 days total')).toBeVisible();
    await page.getByRole('tab', { name: 'Notes' }).click();
    await expect(page.getByText('Edited protocol notes')).toBeVisible();
  });
});
