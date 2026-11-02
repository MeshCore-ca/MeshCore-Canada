import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { codes, expectStep, phoneLink } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
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

  test(`${locale || "en/"} setup tool exposes the same opt-in scope`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=ontario-new-york" })));
    await expectStep(page, "commands");
    const lines = await codes(page).allTextContents();
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na|* onny");
    // An edge repeater still blocks unlabelled messages; the shared label doesn't change that.
    expect(lines).toContain("region denyf *");
  });

  test(`${locale || "en/"} a retired cross-border network in a link is dropped, not applied`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=california" })));
    await expectStep(page, "commands");
    const lines = await codes(page).allTextContents();
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na");
    expect(lines.join("\n")).not.toMatch(/california|us-ca|\bus\b|onny/);
  });

  test(`${locale || "en/"} city repeaters can carry onny without becoming edge repeaters`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, extra: "external=ontario-new-york" })));
    await expectStep(page, "commands");
    const lines = await codes(page).allTextContents();
    expect(lines).toContain("region def ykf|* on|* onqc|* can|* na|* onny");
    expect(lines).toContain("region allowf *");
    expect(lines).not.toContain("region denyf *");
  });
}
