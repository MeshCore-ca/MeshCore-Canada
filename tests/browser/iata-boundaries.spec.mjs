import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  for (const [town,tag,lat,lon] of [["reported Wingham point","ykf",43.8678,-81.2619],["Goderich","yxu",43.743,-81.71],["Kincardine","ylk",44.176,-81.636]]) {
    test(`${locale || "en/"} ${town} uses a labelled local extension, not YSB`, async ({page}) => {
      await page.goto(siteRoute(`/${locale}config/map/?lat=${lat}&lon=${lon}`));
      const result=page.locator('[data-role="map-text-result"]');
      await expect(result.locator('.mcc-deterministic-result')).toContainText(tag);
      await expect(result.locator('.mcc-deterministic-result')).not.toContainText("ysb");
      await expect(result.locator('.mcc-note-warning')).toContainText(locale ? "Extension proposée" : "planning extension");
      await expect(result.locator('.mc-region-profile')).toContainText(locale ? "Extension proposée par MeshCore Canada" : "MeshCore Canada planning extension");
      await expect(result.locator('a[href*="standard/#planning-extensions"]')).toHaveCount(1);
      await result.locator('.mcc-detail-actions a').click();
      await page.locator('[data-wizard-step="3"] [data-next-step]').click();
      const output=page.locator('[data-role="result"]');
      await expect(output).toContainText(`region def ${tag}|* on|* onqc|* can`);
      await expect(output.locator('.mc-region-profile')).toContainText(locale ? "Extension proposée" : "planning extension");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1)).toBeTruthy();
    });
  }
  test(`${locale || "en/"} published Waterloo stays published and a saved bad YSB link needs correction`, async ({page}) => {
    await page.goto(siteRoute(`/${locale}config/map/?lat=43.4643&lon=-80.5204`));
    const result=page.locator('[data-role="map-text-result"]');
    await expect(result.locator('.mcc-deterministic-result')).toContainText("ykf");
    await expect(result.locator('.mcc-note-warning')).toHaveCount(0);
    await expect(result.locator('.mc-region-profile')).toContainText("MeshMapper");
    await page.goto(siteRoute(`/${locale}config/?tag=ysb&lat=43.8678&lon=-81.2619&step=4`));
    await expect(page.locator('[data-role="status"]')).toContainText(locale ? "ne correspond pas" : "differs");
    await expect(page.locator('[data-go-step="4"]')).toBeDisabled();
    await expect(page.locator('[data-cmd^="region def"]')).toHaveCount(0);
  });
}
