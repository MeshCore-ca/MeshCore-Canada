import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { proposalOperator } from "./activation-helpers.mjs";

const skin = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return Object.fromEntries(["color", "backgroundColor", "borderColor", "borderStyle", "borderRadius", "boxShadow"].map(key => [key, style[key]]));
});

for (const locale of ["", "fr/"]) for (const scheme of ["default", "slate"]) {
  test(`${locale || "en/"} ${scheme} region map shares the proposal palette and controls`, async ({ page }) => {
    const setTheme = async () => {
      await page.evaluate(scheme => document.body.setAttribute("data-md-color-scheme", scheme), scheme);
      await page.mouse.move(0, 0);
    };
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await proposalOperator(page);
    await setTheme();
    await expect(page.locator('.scp-tag[data-level="city"]').first()).toHaveCSS("color", scheme === "slate" ? "rgb(125, 183, 255)" : "rgb(20, 88, 176)");
    const neutralButton = await skin(page.locator('[data-scp-choice="old"]'));
    await page.locator('[data-scp-choice="clean"]').click();
    const activeButton = await skin(page.locator('[data-scp-choice="clean"]'));

    await page.goto(siteRoute(`/${locale}config/map/`));
    await expect(page.locator('[data-role="map-input"]')).toBeVisible();
    await setTheme();
    expect(await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="true"]'))).toEqual(activeButton);
    expect(await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="false"]'))).toEqual(neutralButton);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });
}
