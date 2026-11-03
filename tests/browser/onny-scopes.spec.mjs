import { expect, test } from "./site-fixtures.mjs";
import { openLink, phoneLink, commandLines } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  test(`${locale || "en/"} setup tool exposes the same opt-in scope`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=ontario-new-york" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na|* onny");
    // An edge repeater still blocks unlabelled messages; the shared label doesn't change that.
    expect(lines).toContain("region denyf *");
  });

  test(`${locale || "en/"} a retired cross-border network in a link is dropped, not applied`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=california" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na");
    expect(lines.join("\n")).not.toMatch(/california|us-ca|\bus\b|onny/);
  });

  test(`${locale || "en/"} city repeaters can carry onny without becoming edge repeaters`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, extra: "external=ontario-new-york" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* on|* onqc|* can|* na|* onny");
    expect(lines).toContain("region allowf *");
    expect(lines).not.toContain("region denyf *");
  });

  test(`${locale || "en/"} setup tool exposes the Québec–New York opt-in scope the same way`, async ({ page }) => {
    await openLink(page, phoneLink("yul", "qc", { lang, extra: "external=quebec-new-york" }));
    const city = await commandLines(page);
    expect(city).toContain("region def yul|* qc|* onqc|* can|* na|* qcny");
    expect(city).toContain("region allowf *");
    expect(city).not.toContain("region denyf *");
  });

  test(`${locale || "en/"} an edge repeater in Québec carries qcny, and Ontario's onny is not applied there`, async ({ page }) => {
    await openLink(page, phoneLink("yul", "qc", { lang, role: "edge", extra: "neighbours=yow&external=quebec-new-york,ontario-new-york" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def yul|* yow|* qc|* onqc|* can|* na|* qcny");
    expect(lines).toContain("region denyf *");
    expect(lines.join("\n")).not.toMatch(/onny/);
  });
}
