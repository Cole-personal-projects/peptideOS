import { expect, test } from '@playwright/test';

test.describe('bottom navigation diagnostics', () => {
  test('emits sanitized diagnostics when bottom nav is tapped', async ({ page }) => {
    const diagnosticEvents: string[] = [];

    await page.route('**/api/client-diagnostics', async (route) => {
      const body = route.request().postDataJSON() as { event?: string; payload?: { label?: string } };
      if (body?.event) diagnosticEvents.push(`${body.event}:${body.payload?.label ?? ''}`);
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Start local setup' }).click();
    await page.getByRole('button', { name: 'I Understand' }).click({ timeout: 5_000 }).catch(() => undefined);
    await expect(page.getByRole('navigation')).toBeVisible();

    await page.getByRole('navigation').getByRole('link', { name: 'More' }).click();
    await expect(page).toHaveURL(/\/more$/);

    await expect
      .poll(() => diagnosticEvents)
      .toEqual(expect.arrayContaining(['bottom_nav_pointer_down:More', 'bottom_nav_click:More']));
  });
});
