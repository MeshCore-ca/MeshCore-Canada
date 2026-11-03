import { expect, test } from "./site-fixtures.mjs";
import { openLink, phoneLink, commandLines } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  test(`${locale || "en/"} setup tool exposes the same opt-in scope`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=onny" }));
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
    await openLink(page, phoneLink("ykf", "on", { lang, extra: "external=onny" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* on|* onqc|* can|* na|* onny");
    expect(lines).toContain("region allowf *");
    expect(lines).not.toContain("region denyf *");
  });

  test(`${locale || "en/"} setup tool exposes the Québec–New York opt-in scope the same way`, async ({ page }) => {
    await openLink(page, phoneLink("yul", "qc", { lang, extra: "external=qcny" }));
    const city = await commandLines(page);
    expect(city).toContain("region def yul|* qc|* onqc|* can|* na|* qcny");
    expect(city).toContain("region allowf *");
    expect(city).not.toContain("region denyf *");
  });

  test(`${locale || "en/"} an edge repeater in Québec carries qcny, and Ontario's onny is not applied there`, async ({ page }) => {
    await openLink(page, phoneLink("yul", "qc", { lang, role: "edge", extra: "neighbours=yow&external=qcny,onny" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def yul|* yow|* qc|* onqc|* can|* na|* qcny");
    expect(lines).toContain("region denyf *");
    expect(lines.join("\n")).not.toMatch(/onny/);
  });

  test(`${locale || "en/"} Québec–Vermont is carried the same way, beside Québec–New York`, async ({ page }) => {
    await openLink(page, phoneLink("yul", "qc", { lang, extra: "external=qcvt" }));
    expect(await commandLines(page)).toContain("region def yul|* qc|* onqc|* can|* na|* qcvt");
    await openLink(page, phoneLink("yul", "qc", { lang, extra: "external=qcvt,qcny" }));
    const both = await commandLines(page);
    // Listed in the order the file lists them, whatever order the link had.
    expect(both).toContain("region def yul|* qc|* onqc|* can|* na|* qcny|* qcvt");
    expect(both).toContain("region allowf *");
  });

  test(`${locale || "en/"} a link made before the scopes came from a file still applies onny and qcny`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, extra: "external=ontario-new-york" }));
    expect(await commandLines(page)).toContain("region def ykf|* on|* onqc|* can|* na|* onny");
    await openLink(page, phoneLink("yul", "qc", { lang, role: "edge", extra: "neighbours=yow&external=quebec-new-york" }));
    expect(await commandLines(page)).toContain("region def yul|* yow|* qc|* onqc|* can|* na|* qcny");
  });

  test(`${locale || "en/"} the US networks the tool used to offer are dropped from a link, not applied`, async ({ page }) => {
    await openLink(page, phoneLink("ykf", "on", { lang, role: "edge", extra: "neighbours=yyz&external=ohio,pennsylvania,western-new-york" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def ykf|* yyz|* on|* onqc|* can|* na");
    expect(lines.join("\n")).not.toMatch(/\bus\b|us-|onny/);
    await openLink(page, phoneLink("yka", "bc", { lang, role: "edge", extra: "neighbours=yvr&external=washington,oregon" }));
    const bc = await commandLines(page);
    expect(bc.filter((line) => line.startsWith("region def "))).toEqual(["region def yka|* yvr|* bc|* can|* na"]);
  });
}
