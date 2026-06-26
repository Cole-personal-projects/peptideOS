import { expect, test } from '@playwright/test';

test.describe('account settings', () => {
  test('keeps signed-out users in local-only mode with account controls visible', async ({ page }) => {
    await page.goto('/more/settings');

    await page.getByRole('button', { name: 'I Understand' }).click();

    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByText('Local-only mode')).toBeVisible();
    await expect(page.getByText('Your data remains on this device until you sign in and turn on Cloud mode.')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send sign-in link' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Verification code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Verify sign-in code' })).toBeVisible();
    await expect(page.getByText('Reference library', { exact: true })).toBeVisible();
    await expect(page.getByText(/Bundled fallback \d{4}\.\d{2}\.\d+/)).toBeVisible();
    await expect(page.getByText('Cloud mode', { exact: true })).toBeVisible();
    await expect(page.getByRole('switch').first()).toBeDisabled();
    await expect(page.getByText('Cloud save')).toBeVisible();
    await expect(page.getByText('Cloud retrieve')).toBeVisible();
    await expect(page.getByText('App version')).toBeVisible();
    await expect(page.getByText('v1.0.0')).toBeVisible();
    await expect(page.getByText('Build')).toBeVisible();
    await expect(page.getByText('peptideos-shell-v4')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save to cloud' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Retrieve from cloud' })).toBeDisabled();
    await expect(page.getByText('Content mode')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Beginner' })).toBeVisible();
    await page.getByRole('button', { name: 'Experienced' }).click();
    await expect(page.getByText('Experienced tracker')).toBeVisible();
    await expect(page.getByText('Biometric Lock')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Research Purposes Only' })).toHaveCount(0);
  });

  test('applies light and dark theme choices to the PWA shell', async ({ page }) => {
    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await page.getByRole('button', { name: 'Light' }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
    await expect(page.getByRole('switch', { name: 'Use dark theme' })).not.toBeChecked();

    await page.getByRole('button', { name: 'Dark' }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
    await expect(page.getByRole('switch', { name: 'Use dark theme' })).toBeChecked();
  });

  test('navigates from settings to dashboard without route error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/more/settings');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => {});
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();

    await expect(page.getByRole('heading', { name: 'PeptideOS' })).toBeVisible();
    await expect(page.getByText("This page couldn't load")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('opens settings after deleting a protocol without route error', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/stacks');
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => {});
    await page.getByRole('button', { name: 'New protocol' }).click();
    await page.getByLabel('Protocol Name').fill('Settings Delete Regression');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('checkbox', { name: 'BPC-157' }).check();
    await page.getByRole('button', { name: 'Create Protocol' }).click();
    await page.getByRole('link', { name: /Settings Delete Regression/ }).click();
    await page.getByRole('button', { name: 'Protocol settings' }).click();
    await page.getByRole('button', { name: 'Delete protocol' }).click();
    await page.getByRole('button', { name: 'Delete now' }).click();
    await expect(page.getByRole('heading', { name: 'Protocols' })).toBeVisible();

    await page.getByRole('link', { name: 'More' }).click();
    await page.getByRole('link', { name: /Settings/ }).click();

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText("This page couldn't load")).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('anchors settings content in a stable readable column on full-screen iPad', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await page.goto('/more/settings');

    await page.getByRole('button', { name: 'I Understand' }).click();

    const settingsContent = page.getByTestId('settings-content');
    await expect(settingsContent).toBeVisible();

    const box = await settingsContent.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(768);
    expect(box?.x).toBeGreaterThan(120);

    const pageMetrics = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      initialScrollX: window.scrollX,
    }));
    expect(pageMetrics.bodyScrollWidth).toBeLessThanOrEqual(pageMetrics.viewportWidth);
    expect(pageMetrics.documentScrollWidth).toBeLessThanOrEqual(pageMetrics.viewportWidth);
    expect(pageMetrics.initialScrollX).toBe(0);

    await page.evaluate(() => window.scrollTo(80, window.scrollY));
    await expect.poll(() => page.evaluate(() => window.scrollX)).toBe(0);
  });
});
