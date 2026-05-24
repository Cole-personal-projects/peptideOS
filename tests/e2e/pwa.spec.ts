import { expect, test } from '@playwright/test';

test.describe('PWA readiness', () => {
  test('registers a service worker and serves the offline fallback for uncached routes', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'I Understand' }).click();

    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller && registration.active) {
        await new Promise<void>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
          registration.active?.postMessage({ type: 'claim' });
          setTimeout(resolve, 1000);
        });
      }
    });
    await page.reload();
    await expect(page.evaluate(() => Boolean(navigator.serviceWorker.controller))).resolves.toBe(true);

    await context.setOffline(true);
    await page.goto('/uncached-offline-route');

    await expect(page.getByRole('heading', { name: 'PeptideOS is offline' })).toBeVisible();
    await expect(page.getByText(/stored locally/i)).toBeVisible();
  });

  test('exposes installable manifest metadata', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.ok()).toBe(true);
    const manifest = await response?.json() as {
      name: string;
      display: string;
      icons: Array<{ src: string; sizes: string }>;
    };

    expect(manifest.name).toBe('PeptideOS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  });
});
