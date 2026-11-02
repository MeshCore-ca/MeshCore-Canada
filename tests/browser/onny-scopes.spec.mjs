import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { expectStep, phoneLink, commandLines } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  test(`${locale || "en/"} setup tool exposes the same opt-in scope`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=ontario-new-york" })));
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na|* onny");
    // An edge repeater still blocks unlabelled messages; the shared label doesn't change that.
    expect(lines).toContain("region denyf *");
  });

  test(`${locale || "en/"} a retired cross-border network in a link is dropped, not applied`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=california" })));
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na");
    expect(lines.join("\n")).not.toMatch(/california|us-ca|\bus\b|onny/);
  });

  test(`${locale || "en/"} city repeaters can carry onny without becoming edge repeaters`, async ({ page }) => {
    await page.goto(siteRoute(phoneLink("ykf", "on", { lang, extra: "external=ontario-new-york" })));
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* on|* onqc|* can|* na|* onny");
    expect(lines).toContain("region allowf *");
    expect(lines).not.toContain("region denyf *");
  });
}
