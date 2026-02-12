import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/play', '/recordings', '/settings', '/about'];

for (const route of routes) {
  test(`@axe ${route} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForSelector('main#main', { timeout: 8_000 });

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) => {
      return violation.impact === 'serious' || violation.impact === 'critical';
    });

    expect(blocking).toEqual([]);
  });
}
