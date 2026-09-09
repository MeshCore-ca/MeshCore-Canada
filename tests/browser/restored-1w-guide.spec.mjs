import { expect, test } from "./site-fixtures.mjs";
import AxeBuilder from "@axe-core/playwright";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} restored 1 W guide has usable parts, photos, wiring, and downloads`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}hardware/repeater-solar-1w-diy-build/`));
    await expect(page.locator("h1")).toContainText("Ikoka Stick");
    await expect(page.locator(".mc-guide-status, .mc-page-status")).toHaveCount(0);
    const parts = page.locator(".mc-table-wrap table").first();
    await expect(parts.locator("tbody tr")).toHaveCount(16);
    await expect(parts).toContainText("M3x35");
    await expect(parts).toContainText("M3x5");
    expect(await parts.evaluate(table => parseFloat(getComputedStyle(table).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await parts.locator("tbody td").first().evaluate(cell => parseFloat(getComputedStyle(cell).paddingLeft))).toBeGreaterThanOrEqual(8);
    await expect(page.locator('article a[href$=".3mf"]')).toHaveCount(1);
    await expect(page.locator('article a[href$=".stl"]')).toHaveCount(2);
    const assemblyCount = await page.locator("#assembly-steps").evaluate(heading => {
      let count = 0;
      for (let element = heading.nextElementSibling; element && element.tagName !== "H2"; element = element.nextElementSibling) {
        if (element.tagName === "OL") count += element.children.length;
      }
      return count;
    });
    expect(assemblyCount).toBe(28);
    const photos = page.locator("img.mc-build-photo");
    await expect(photos).toHaveCount(9);
    for (const photo of await photos.all()) {
      await expect(photo).toHaveAttribute("width", /^[1-9]\d+$/);
      await expect(photo).toHaveAttribute("height", /^[1-9]\d+$/);
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      expect(await photo.locator("..").getAttribute("href")).toMatch(/repeater-solar-1w-diy-build-\d+\.(jpg|svg)$/);
    }
    await expect(page.locator("pre")).toContainText("TELEM_INA3221_ADDRESS=0x40");
    await expect(page.locator("pre")).toContainText("TELEM_INA3221_SHUNT_VALUE=0.05");
    const diagram = page.locator(".mc-build-diagram");
    await expect(diagram).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    expect(layout.content).toBeLessThanOrEqual(layout.width + 1);
  });

  test(`${locale || "en/"} restored 1 W guide remains accessible`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}hardware/repeater-solar-1w-diy-build/`));
    await expect(page.locator(".mc-build-table table").first()).toHaveClass(/mc-table--responsive/);
    const audit = await new AxeBuilder({ page }).include("article").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}
