import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const standardCommands = ["set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"];

for (const locale of ["", "fr/"]) {
  test.describe(`${locale || "en/"} companion scope guidance without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });
    test("all companion entry points tell people to set a default scope now", async ({ page }) => {
      for (const path of ["start/companion/", "meshcore/flash-companion/", "config/standard/"]) {
        await page.goto(siteRoute(`/${locale}${path}`));
        const note = page.locator(".admonition.note").filter({ hasText: locale ? /portée par défaut/i : /set your default scope/i });
        await expect(note).toBeVisible();
        await expect(note).toContainText("onqc");
        await expect(note).toContainText(locale ? /code de votre province/ : /your province['’]s code/);
        await expect(page.locator("article")).not.toContainText(/Phase 2|phase 2|January 2027|janvier 2027/);
        if (path !== "meshcore/flash-companion/") {
          await expect(page.locator("article")).toContainText("Network Settings");
          await expect(page.locator("article")).toContainText("Default Region Scope");
        }
      }
    });
  });

  test(`${locale || "en/"} ON/QC standards stay opt-in and the review explains the selected mode`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=3&instructions=technical`));
    const step = page.locator('[data-wizard-step="3"]');
    const option = step.locator('[data-action="standard-defaults"]');
    await expect(option).not.toBeChecked();
    await step.locator('[data-next-step]').click();
    const result = page.locator('[data-role="result"]');
    await expect(result.locator('[data-onqc-settings-summary]')).toContainText(locale ? "non inclus" : "not included");
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
    await expect(result.locator('[data-onqc-settings-summary]')).toHaveCount(0);
    await expect(result).toContainText("region def yyc|* ab|* can");
    for (const command of standardCommands) await expect(result.locator(`[data-cmd="${command}"]`)).toHaveCount(0);
  });
}
