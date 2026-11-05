import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { readFile } from "node:fs/promises";
import { PHONE_ROUTE, choose, codes, expectStep, location, mockGeocoder, next, nextButton, nextUntil, answer, openLink, phoneLink, searchTown, startPhoneRoute, step, toolRoot, T, commandLines } from "./setup-helpers.mjs";
import { Z, badge, line, open, search, title, where } from "./zone-map-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  for (const [tag, province, lat, lon] of [
    ["yyg", "pe", 46.2382, -63.1311], ["yyt", "nl", 47.5605, -52.7128],
    ["yyr", "nl", 53.303, -60.326], ["yxy", "yt", 60.7212, -135.0568],
    ["yzf", "nt", 62.454, -114.3774], ["yfb", "nu", 63.7467, -68.517],
  ]) {
    test(`${locale || "en/"} ${tag} starter region is a placeholder, and configures without claiming MeshMapper approval`, async ({ page }) => {
      await open(page, lang);
      await search(page, `${lat}, ${lon}`);
      await expect(title(page)).toContainText(`${tag.toUpperCase()} · `);
      await expect(badge(page)).toHaveText(Z("badge.starter", lang));
      await expect(line(page)).toHaveText(Z("line.placeholder", lang));
      await expect(page.locator("[data-zone-meshmapper], a[href*='.meshmapper.net']")).toHaveCount(0);
      // The finder hands only the region to the setup tool, which opens on its first question.
      const configure = page.locator("[data-zone-setup]");
      expect(Object.fromEntries(new URL(await configure.getAttribute("href"), page.url()).searchParams)).toEqual({ tag, province });
      await configure.click();
      await expectStep(page, "type");
      // The same region in the tool: the flat list for a province outside ON/QC, and no radio line on the phone route.
      await openLink(page, phoneLink(tag, province, { lang }));
      const lines = await commandLines(page);
      expect(lines).toContain(`region def ${tag}|* ${province}|* can|* na`);
      expect(lines.join("\n")).not.toContain("onqc");
      expect(lines.some((line) => line.startsWith("set radio"))).toBe(false);
    });
  }
  test(`${locale || "en/"} older firmware gets explicit permissions and no unsupported advert command`, async ({ page }) => {
    for (const firmware of ["1.14", "1.15"]) {
      await openLink(page, phoneLink("yow", "on", { lang }), { firmware });
      const lines = await commandLines(page);
      expect(lines).toContain("region put yow");
      expect(lines).toContain("region allowf *");
      expect(lines.filter((line) => line.startsWith("region def "))).toEqual([]);
      if (firmware === "1.14") {
        expect(lines).toContain("region allowf yow");
        expect(lines.filter((line) => line.startsWith("region default"))).toEqual([]);
      } else expect(lines).toContain("region default yow");
    }
    // Firmware below 1.14 gets no commands: the version question says to update first and Next stays off.
    await page.goto(siteRoute(phoneLink("yow", "on", { lang })));
    await expectStep(page, "version");
    await choose(page, "older");
    await expect(page.locator("[data-setup-update]")).toHaveText(T("version.update", lang));
    await expect(nextButton(page)).toBeDisabled();
    await expect(codes(page)).toHaveCount(0);
  });

  test(`${locale || "en/"} historical drafts can be downloaded without uploading or deleting them`, async ({ page }) => {
    const key = `mcc-region-editor-draft:v1:${"a".repeat(64)}:35`;
    const draft = { schema: "mcc-region-editor-proposal/v1", baseMembershipSha256: "a".repeat(64), province: "35", target: "ott", reason: "Historical draft", changes: [{ DGUID: "2021S051235060001", to: "ott" }], savedAt: 1 };
    await page.addInitScript(({ key, draft }) => localStorage.setItem(key, JSON.stringify(draft)), { key, draft });
    const posts = [];
    page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
    await page.goto(siteRoute(`/${locale}config/editor/`));
    const downloadReady = page.waitForEvent("download");
    await page.locator("[data-legacy-draft-export]").click();
    const download = await downloadReady;
    const exported = JSON.parse(await readFile(await download.path(), "utf8"));
    expect(exported.drafts[0].reason).toBe(draft.reason);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual(draft);
    expect(posts).toEqual([]);
  });

  test(`${locale || "en/"} IATA bridge setup matches the ON/QC proposal`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await openLink(page, phoneLink("yow", "qc", { lang, role: "edge", extra: "neighbours=yul" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def yow|* yul|* qc|* onqc|* can|* na");
    expect(lines).toContain("region denyf *");
    expect(lines).toContain("region default yow");
    expect(lines.join("\n")).not.toContain("region def can on");
    expect(lines.some((line) => line.startsWith("set radio"))).toBe(false);
    expect(errors).toEqual([]);
  });

  test(`${locale || "en/"} Gatineau selects yow with qc, not a separate legacy region`, async ({ page }) => {
    await mockGeocoder(page);
    await openLink(page, `${toolRoot(lang)}?${PHONE_ROUTE}`, { to: "town" });
    await searchTown(page, "Gatineau");
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
    await expect(page.locator("[data-setup-region]")).toContainText("Québec");
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await page.locator("[data-setup-name]").fill("Gatineau_R1");
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("region def yow|* qc|* onqc|* can|* na");
    expect(lines).toContain("region allowf *");
    expect(lines.join("\n")).not.toMatch(/\bott\b/);
  });

  test(`${locale || "en/"} a shared IATA zone needs a province before commands are offered`, async ({ page }) => {
    await openLink(page, `${toolRoot(lang)}?${PHONE_ROUTE}&tag=yow&role=city&name=Test_R1`, { to: "town" });
    await expect(step(page)).toContainText(T("town.province", lang));
    await expect(nextButton(page)).toBeDisabled();
    await page.locator('[data-setup-choice="yow:on"]').click();
    await expect(nextButton(page)).toBeEnabled();
    // Picking the province sets the region again, which clears the name; no town was searched to suggest one.
    await nextUntil(page, "name");
    await page.locator("[data-setup-name]").fill("Test_R1");
    await next(page);
    await location(page);
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    for (const command of ["set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"]) {
      expect(lines).toContain(command);
    }
    expect(lines).toContain("region def yow|* on|* onqc|* can|* na");
  });

  test(`${locale || "en/"} the zone finder and the setup tool use the same MeshMapper zone`, async ({ page }) => {
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    await open(page, lang);
    await search(page, "45.4765, -75.7013");
    await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
    await expect(where(page)).toHaveText("45.4765, -75.7013 · Québec");
    await expect(page.locator("[data-zone-meshmapper]")).toHaveAttribute("href", "https://yow.meshmapper.net/");
    const configure = page.locator("[data-zone-setup]");
    expect(Object.fromEntries(new URL(await configure.getAttribute("href"), page.url()).searchParams)).toEqual({ tag: "yow", province: "qc" });
    await configure.click();
    await startPhoneRoute(page);
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
    await expect(page.locator("[data-setup-region]")).toContainText("Québec");
    expect(requests.some(url => url.includes("iata-boundaries.geojson"))).toBeTruthy();
    expect(requests.some(url => url.includes("canada-region-partition"))).toBeFalsy();
  });
}
