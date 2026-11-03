import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { T, confirmStep, nextUntil, toolRoot, commandLines, version } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} Canada preset guidance is current and the setup tool writes the Canada radio line`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}`));
    const row = page.locator(".mc-baseline-table tr").filter({ hasText: locale ? "Préréglage radio" : "Radio preset" });
    await expect(row.locator("td").last()).toHaveText("Canada");
    await expect(page.locator(".mc-preset-note")).toContainText(locale ? "3 octets" : "3-byte");
    await expect(page.locator(".mc-preset-note")).toContainText(locale ? "ne modifie pas" : "unchanged");
    await expect(page.locator('.mc-preset-note a[href*="issuecomment-5598886579"]')).toHaveCount(1);

    await page.goto(siteRoute(`/${locale}provinces/#canada-baseline`));
    await expect(page.locator("article.md-content__inner")).toContainText("USA/Canada (Recommended)");
    await expect(page.locator("article.md-content__inner")).toContainText("1.14");

    // The setup tool: flashing a new board writes the Canada radio line and the 3-byte ID setting.
    const lang = locale ? "fr" : "en";
    await page.goto(siteRoute(`${toolRoot(lang)}?type=repeater&board=esp32&status=new&tag=yow&province=on&role=city&name=Test_R1`));
    await confirmStep(page, "flash");
    await version(page, "v1.16.0");
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("set radio 910.525,62.5,7,5");
    expect(lines).toContain("set path.hash.mode 2");
    expect(lines).not.toContain("set path.hash.mode 3");
    await expect(page.locator('[data-setup-command="radio"]')).toContainText(T("why.radio", lang));
    await expect(page.locator('[data-setup-command="hash"]')).toContainText(T("why.hash", lang));
  });
}
