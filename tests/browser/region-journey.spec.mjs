import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} other provinces keep local policy outside the ON/QC pilot`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/?tag=yyc&province=ab`));
    await expect(page.locator('[data-role="map-text-result"]')).toContainText(locale ? "hors du projet pilote" : "outside the ON/QC pilot");
  });
}
