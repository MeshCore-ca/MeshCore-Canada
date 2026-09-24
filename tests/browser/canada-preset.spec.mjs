import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} Canada preset guidance is current and the configurator remains opt-in`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}`));
    const row = page.locator(".mc-baseline-table tr").filter({ hasText: locale ? "Préréglage radio" : "Radio preset" });
    await expect(row.locator("td").last()).toHaveText("Canada");
    await expect(page.locator(".mc-preset-note")).toContainText(locale ? "3 octets" : "3-byte");
    await expect(page.locator(".mc-preset-note")).toContainText(locale ? "ne modifie pas" : "unchanged");
    await expect(page.locator('.mc-preset-note a[href*="issuecomment-5598886579"]')).toHaveCount(1);

    await page.goto(siteRoute(`/${locale}provinces/#canada-baseline`));
    await expect(page.locator("article.md-content__inner")).toContainText("USA/Canada (Recommended)");
    await expect(page.locator("article.md-content__inner")).toContainText("1.14");

    await page.goto(siteRoute(`/${locale}config/?tag=ott&step=3`));
    const note = page.locator('[data-role="canada-preset-note"]');
    await expect(note).toBeVisible();
    await expect(note).toContainText(locale ? "3 octets" : "3-byte");
    await expect(note).toContainText(locale ? "séparément" : "separately");
    await expect(note.locator("a")).toHaveAttribute("href", new RegExp(`/${locale}provinces/#canada-baseline$`));
    await expect(page.locator("#mcc-radio-profile")).toHaveValue("keep");
    await expect(page.locator("#mcc-hash-mode")).toHaveValue("keep");
    await page.locator("#mcc-radio-profile").selectOption("canada");
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    const output = page.locator('[data-role="result"]');
    await expect(output).toContainText("set radio 910.525,62.5,7,5");
    await expect(output).not.toContainText("set path.hash.mode");
    await page.locator('[data-go-step="3"]').click();
    await page.locator("#mcc-hash-mode").selectOption("2");
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    await expect(output).toContainText("set path.hash.mode 2");
    await expect(output).not.toContainText("set path.hash.mode 3");
  });
}
