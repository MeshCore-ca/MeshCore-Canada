import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const skin = locator => locator.evaluate(element => {
  const style = getComputedStyle(element);
  return Object.fromEntries(["color", "backgroundColor", "borderColor", "borderStyle", "borderRadius", "boxShadow"].map(key => [key, style[key]]));
});

for (const locale of ["", "fr/"]) for (const scheme of ["default", "slate"]) {
  test(`${locale || "en/"} ${scheme} region tools share the proposal palette and controls`, async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", {
      configurable: true, value: { writeText: async text => { window.__copiedCommand = text; } }
    }));
    const setTheme = async () => {
      await page.evaluate(scheme => document.body.setAttribute("data-md-color-scheme", scheme), scheme);
      await page.mouse.move(0, 0);
    };
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await setTheme();
    await expect(page.locator('.scp-tag[data-level="city"]').first()).toHaveCSS("color", scheme === "slate" ? "rgb(125, 183, 255)" : "rgb(20, 88, 176)");
    const tags = {};
    for (const level of ["city", "prov", "mesh", "future"]) tags[level] = await skin(page.locator(`.scp-tag[data-level="${level}"]`).first());
    const neutralButton = await skin(page.locator('[data-scp-choice="old"]'));
    await page.locator('[data-scp-choice="clean"]').click();
    const activeButton = await skin(page.locator('[data-scp-choice="clean"]'));
    const card = await skin(page.locator('.scp-card').first());
    const commandBackground = await page.locator('.scp-cmd').first().evaluate(element => getComputedStyle(element).backgroundColor);
    const commandColor = await page.locator('.scp-cmd code').first().evaluate(element => getComputedStyle(element).color);

    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=4&instructions=technical`));
    const result = page.locator('[data-role="result"]');
    await expect(result.locator('.mcc-command-line').first()).toBeVisible();
    await setTheme();
    for (const level of Object.keys(tags)) {
      expect(await skin(result.locator(`.mcc-tag-pill[data-level="${level}"]`))).toEqual(tags[level]);
    }
    const setupCard = await skin(page.locator('[data-wizard-step="4"]'));
    for (const key of ["backgroundColor", "borderColor", "borderRadius", "boxShadow"]) expect(setupCard[key]).toBe(card[key]);
    const copyAll = result.locator('.mcc-copy-all');
    expect(await skin(copyAll)).toEqual(activeButton);
    const copy = result.locator('.mcc-command-line').first();
    await expect(copy).toHaveCSS("background-color", commandBackground);
    await expect(copy.locator('span').first()).toHaveCSS("color", commandColor);
    await copy.focus();
    expect(await copy.evaluate(element => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
    const command = await copy.getAttribute("data-cmd");
    await copy.press("Enter");
    await expect.poll(() => page.evaluate(() => window.__copiedCommand)).toBe(command);
    await expect(page.locator('[data-mcc-copy-status]')).toContainText(locale ? "Copié" : "Copied");
    const audit = await new AxeBuilder({ page }).include('[data-mcc-regions]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations.filter(item => ["serious", "critical"].includes(item.impact)).map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();

    await page.goto(siteRoute(`/${locale}config/map/`));
    await expect(page.locator('[data-role="map-input"]')).toBeVisible();
    await setTheme();
    expect(await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="true"]'))).toEqual(activeButton);
    expect(await skin(page.locator('.mcc-map-mode-switch button[aria-pressed="false"]'))).toEqual(neutralButton);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });
}
