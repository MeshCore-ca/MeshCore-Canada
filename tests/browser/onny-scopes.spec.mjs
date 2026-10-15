import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} guide shares optional onny and resets activation approval`, async ({ page }) => {
    const errors = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=ykf&province=on&role=repeater&type=edge&neighbour=yyz&onny=1`));
    const toggle = page.locator('[data-scp-onny]');
    const commands = page.locator('[data-scp-output="region"] code');
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();
    await expect(commands).toHaveText(["region def ykf|* yyz|* on|* onqc|* can|* na|* onny", "region save"]);
    await expect(page.locator('[data-scp-share]')).toHaveAttribute("href", /onny=1/);
    await expect(page.locator('[data-scp-tags]')).toContainText(locale ? "Facultative" : "Optional");
    await page.locator('[data-scp-activation]').selectOption("activate");
    await page.locator('[data-scp-activate]').check();
    await expect(commands).toHaveCount(4);
    await toggle.uncheck();
    await expect(page.locator('[data-scp-activate]')).not.toBeChecked();
    await expect(commands).toHaveCount(0);
    await page.locator('[data-scp-activation]').selectOption("prepare");
    await expect(commands.first()).not.toContainText("onny");
    await page.locator('[data-scp-type]').selectOption("city");
    await expect(toggle).toBeVisible();
    await toggle.check();
    await expect(commands.first()).toHaveText("region def ykf|* on|* onqc|* can|* na|* onny");
    expect(errors).toEqual([]);
  });

  test(`${locale || "en/"} configurator exposes the same opt-in scope`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ykf&province=on&type=large&regions=yyz&external=ontario-new-york&step=4&instructions=technical`));
    await expect(page.locator('[data-role="result"]')).toContainText("region def ykf|* yyz|* on|* onqc|* can|* na|* onny");
    await expect(page.locator('[data-role="result"]')).not.toContainText("region denyf *");
  });

  test(`${locale || "en/"} retired conflicting external selection requires review`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ykf&province=on&type=large&external=california&step=4`));
    await expect(page.locator('[data-wizard-step="3"]')).toBeVisible();
    await expect(page.locator('[data-action="confirm-scope-migration"]')).toBeVisible();
    await expect(page.locator('[data-wizard-step="3"] [data-next-step]')).toBeDisabled();
    await expect(page.locator('[data-wizard-step="3"]')).toContainText("external:california");
  });

  test(`${locale || "en/"} city repeaters can carry onny without becoming edge repeaters`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ykf&province=on&external=ontario-new-york&step=4&instructions=technical`));
    await expect(page.locator('[data-role="result"]')).toContainText("region def ykf|* on|* onqc|* can|* na|* onny");
    await expect(page.locator('[data-role="result"]')).not.toContainText("region denyf *");
  });
}
