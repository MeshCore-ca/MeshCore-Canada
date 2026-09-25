import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { readFile } from "node:fs/promises";

for (const locale of ["", "fr/"]) {
  for (const [tag, province, lat, lon] of [
    ["yyg", "pe", 46.2382, -63.1311], ["yyt", "nl", 47.5605, -52.7128],
    ["yyr", "nl", 53.303, -60.326], ["yxy", "yt", 60.7212, -135.0568],
    ["yzf", "nt", 62.454, -114.3774], ["yfb", "nu", 63.7467, -68.517],
  ]) {
    test(`${locale || "en/"} ${tag} starter region resolves and configures without claiming MeshMapper approval`, async ({ page }) => {
      await page.goto(siteRoute(`/${locale}config/map/?lat=${lat}&lon=${lon}`));
      const detail = page.locator('[data-role="map-text-result"]');
      await expect(detail).toContainText(tag);
      await expect(detail).toContainText(locale ? "Région initiale de MeshCore Canada" : "MeshCore Canada starter region");
      await expect(detail.locator(`a[href="https://${tag}.meshmapper.net/"]`)).toHaveCount(0);
      await expect(detail.locator('a[href*="standard/#starter-regions"]')).toHaveAttribute("href", new RegExp(`/${locale}config/standard/#starter-regions$`));
      await detail.locator('.mcc-detail-actions a').click();
      await page.locator('[data-wizard-step="3"] [data-next-step]').click();
      const output = page.locator('[data-role="result"]');
      await expect(output).toContainText(`region def ${tag}|* ${province}|* can`);
      await expect(output).toContainText(locale ? "pas encore publiée dans MeshMapper" : "not yet published by MeshMapper");
      await expect(output).not.toContainText("onqc");
      await expect(output).not.toContainText("set radio");
    });
  }
  test(`${locale || "en/"} older firmware gets explicit permissions and no unsupported advert command`, async ({ page }) => {
    for (const firmware of ["1.14", "1.15"]) {
      await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=4&firmware=${firmware}&instructions=technical`));
      const result = page.locator('[data-role="result"]');
      await expect(result).toContainText("region put yow");
      await expect(result).toContainText("region allowf *");
      await expect(result.locator('[data-cmd^="region def "]')).toHaveCount(0);
      if (firmware === "1.14") {
        await expect(result).toContainText("region allowf yow");
        await expect(result).not.toContainText("region default");
        await expect(result).toContainText(locale ? "restent sans scope" : "stay unscoped");
      } else await expect(result).toContainText("region default yow");
    }
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=4&firmware=1.13`));
    await expect(page.locator('[data-role="result"]')).toContainText(locale ? "prise en charge" : "supported firmware");
    await expect(page.locator('[data-action="copy-commands"]')).toHaveCount(0);
  });

  test(`${locale || "en/"} ambiguous legacy city choices require review`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=ott&province=on&type=large&regions=capnat&step=4`));
    await expect(page.locator('[data-wizard-step="3"]')).toBeVisible();
    await expect(page.locator('[data-action="confirm-scope-migration"]')).toBeVisible();
    await expect(page.locator('[data-wizard-step="3"] [data-next-step]')).toBeDisabled();
    await page.locator('[data-action="confirm-scope-migration"]').check();
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    await expect(page.locator('[data-role="result"]')).toContainText("region def yow|* on|* onqc|* can");
    await expect(page.locator('[data-role="result"]')).not.toContainText("capnat");
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
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=qc&type=large&regions=yul&step=4&instructions=technical`));
    const result = page.locator('[data-role="result"]');
    await expect(result).toContainText("region def yow|* yul|* qc|* onqc|* can");
    await expect(result).toContainText("region denyf *");
    await expect(result).toContainText("region default yow");
    await expect(result).not.toContainText("region def can on");
    await expect(result).not.toContainText("set radio");
    expect(errors).toEqual([]);
  });

  test(`${locale || "en/"} Gatineau coordinates select yow with qc, not a separate legacy region`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?lat=45.4765&lon=-75.7013&province=on&step=4&instructions=technical`));
    await expect(page.locator('[data-role="result"]')).toContainText("region def yow|* qc|* onqc|* can");
    await expect(page.locator('[data-role="result"]')).toContainText("region allowf *");
    await expect(page.locator("#mcc-home-province")).toHaveValue("qc");
  });

  test(`${locale || "en/"} a shared IATA zone needs a province before commands are offered`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=yow&step=4`));
    await expect(page.locator('[data-wizard-step="2"]')).toBeVisible();
    await expect(page.locator("#mcc-home-province")).toHaveValue("");
    await expect(page.locator('[data-wizard-step="2"] [data-next-step]')).toBeDisabled();
    await expect(page.locator("#mcc-home-province")).toBeEnabled();
    await page.locator("#mcc-home-province").selectOption("on");
    await expect(page.locator('[data-wizard-step="2"] [data-next-step]')).toBeEnabled();
    await page.locator('[data-wizard-step="2"] [data-next-step]').click();
    await page.locator('[data-action="standard-defaults"]').check();
    await expect(page.locator("#mcc-hash-mode")).toHaveValue("2");
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    for (const command of ["set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16"]) {
      await expect(page.locator('[data-role="result"]')).toContainText(command);
    }
  });

  test(`${locale || "en/"} the map and configurator use the same MeshMapper zone`, async ({ page }) => {
    const requests = [];
    page.on("request", request => requests.push(request.url()));
    await page.goto(siteRoute(`/${locale}config/map/?lat=45.4765&lon=-75.7013`));
    const detail = page.locator('[data-role="map-text-result"]');
    await expect(detail).toContainText("yow");
    await expect(detail.locator('a[href="https://yow.meshmapper.net/"]')).toBeVisible();
    const configure = detail.locator('.mcc-detail-actions a[href*="province=qc"]');
    await expect(configure).toHaveCount(1);
    await configure.click();
    await expect(page.locator("#mcc-home-province")).toHaveValue("qc");
    expect(requests.some(url => url.includes("iata-boundaries.geojson"))).toBeTruthy();
    expect(requests.some(url => url.includes("canada-region-partition"))).toBeFalsy();
  });
}
