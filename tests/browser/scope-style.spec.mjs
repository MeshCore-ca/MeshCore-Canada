import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const skin = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return Object.fromEntries(["color", "backgroundColor", "borderColor", "borderStyle", "borderRadius", "boxShadow"].map(key => [key, style[key]]));
});

for (const locale of ["", "fr/"]) for (const scheme of ["default", "slate"]) {
  test(`${locale || "en/"} ${scheme} region map uses the shared scope palette`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/`));
    await expect(page.locator('[data-role="map-input"]')).toBeVisible();
    await page.evaluate(scheme => document.body.setAttribute("data-md-color-scheme", scheme), scheme);
    await page.mouse.move(0, 0);
    const active = await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="true"]'));
    const neutral = await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="false"]'));
    expect(active.color).toBe(scheme === "slate" ? "rgb(125, 183, 255)" : "rgb(20, 88, 176)");
    expect(neutral.color).not.toBe(active.color);
    expect(neutral.boxShadow).not.toBe(active.boxShadow);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });
}
