import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const standardCommands = ["set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"];

for (const locale of ["", "fr/"]) {
  const phaseClosed = locale ? "La phase 2 n’est pas ouverte" : "Phase 2 is not open";
  const earliest = locale ? "janvier 2027" : "January 2027";
  test.describe(`${locale || "en/"} companion rollout guidance without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });
    test("all companion entry points keep Phase 2 closed until an announcement", async ({ page }) => {
      for (const path of ["start/companion/", "meshcore/flash-companion/", "config/standard/"]) {
        await page.goto(siteRoute(`/${locale}${path}`));
        const notice = page.locator('.admonition.warning').filter({ hasText: phaseClosed });
        await expect(notice).toBeVisible();
        await expect(notice).toContainText(earliest);
        await expect(notice).toContainText(locale ? "sans portée" : "unscoped");
        await expect(notice).toContainText("Default Region Scope");
        await expect(page.locator('article')).toContainText(locale ? "Quand la phase 2 sera annoncée" : "When Phase 2 is announced");
      }
    });
  });

  test(`${locale || "en/"} ON/QC standards stay opt-in and the review explains the selected mode`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=3&instructions=technical`));
    const step = page.locator('[data-wizard-step="3"]');
    const option = step.locator('[data-action="standard-defaults"]');
    await expect(option).not.toBeChecked();
    await expect(step.locator('[data-onqc-rollout]')).toContainText(phaseClosed);
    await expect(step.locator('[data-onqc-rollout]')).toContainText(earliest);
    await expect(step.locator('[data-onqc-rollout] a')).toHaveAttribute("href", new RegExp(`/${locale}proposals/onqc-scopes/#${locale ? "ordre-de-deploiement" : "rollout-order"}$`));
    await step.locator('[data-next-step]').click();
    const result = page.locator('[data-role="result"]');
    await expect(result.locator('[data-onqc-settings-summary]')).toContainText(locale ? "non inclus" : "not included");
    await expect(result.locator('[data-onqc-rollout]')).toContainText(phaseClosed);
    for (const command of standardCommands) await expect(result.locator(`[data-cmd="${command}"]`)).toHaveCount(0);

    await page.locator('[data-go-step="3"]').click();
    await option.check();
    await step.locator('[data-next-step]').click();
    await expect(result.locator('[data-onqc-settings-summary]')).not.toContainText(locale ? "non inclus" : "not included");
    for (const command of standardCommands) await expect(result.locator(`[data-cmd="${command}"]`)).toHaveCount(1);
    await expect(result.locator('[data-cmd="set flood.max.unscoped 3"]')).toHaveCount(0);
    await expect(result.locator('[data-cmd^="set radio"]')).toHaveCount(0);

    await page.locator('[data-go-step="3"]').click();
    await option.uncheck();
    await step.locator('[data-next-step]').click();
    await expect(result.locator('[data-onqc-settings-summary]')).toContainText(locale ? "non inclus" : "not included");
    for (const command of standardCommands) await expect(result.locator(`[data-cmd="${command}"]`)).toHaveCount(0);
  });

  test(`${locale || "en/"} ON/QC rollout guidance and settings do not apply to other provinces`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=yyc&province=ab&step=3&defaults=onqc&instructions=technical`));
    await expect(page.locator('[data-role="standard-settings"]')).toBeHidden();
    await expect(page.locator('[data-role="onqc-guidance"]')).toBeHidden();
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    const result = page.locator('[data-role="result"]');
    await expect(result.locator('[data-onqc-rollout]')).toHaveCount(0);
    await expect(result.locator('[data-onqc-settings-summary]')).toHaveCount(0);
    await expect(result).toContainText("region def yyc|* ab|* can");
    for (const command of standardCommands) await expect(result.locator(`[data-cmd="${command}"]`)).toHaveCount(0);
  });
}
