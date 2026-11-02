import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { expectStep, openLink, phoneLink, commandLines } from "./setup-helpers.mjs";

// Source lines wrap, so let any run of whitespace stand for the single spaces.
const sentence = text => new RegExp(text.trim().split(/\s+/).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+"));

for (const locale of ["", "fr/"]) {
  test.describe(`${locale || "en/"} companion scope guidance without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });
    test("all companion entry points tell people to set a default scope now", async ({ page }) => {
      for (const path of ["start/companion/", "meshcore/flash-companion/", "config/guide/"]) {
        await page.goto(siteRoute(`/${locale}${path}`));
        const note = page.locator(".admonition.note").filter({ hasText: locale ? /portée par défaut/i : /set your default scope/i });
        await expect(note).toBeVisible();
        await expect(note).toContainText("onqc");
        await expect(note).toContainText(locale ? /code de votre province/ : /your province['’]s code/);
        await expect(note).toContainText(locale ? sentence("Les répéteurs de bordure ne relaient pas les messages sans portée") : /Edge repeaters don['’]t\s+pass on messages that have no\s+scope/);
        await expect(page.locator("article")).not.toContainText(/Phase 2|phase 2|January 2027|janvier 2027/);
        if (path !== "meshcore/flash-companion/") {
          await expect(page.locator("article")).toContainText("Network Settings");
          await expect(page.locator("article")).toContainText("Default Region Scope");
        }
      }
    });

    test("the companion guide shows the default scope steps with working screenshots", async ({ page }) => {
      await page.goto(siteRoute(`/${locale}start/companion/`));
      const shots = page.locator('article img[src*="onqc-scopes/companion-0"]');
      await expect(shots).toHaveCount(6);
      for (let index = 0; index < 6; index += 1) {
        const shot = shots.nth(index);
        await expect(shot).toHaveAttribute("alt", /.{20,}/);
        // Fetch the file the page points to; the test server drops browser image loads when two workers run at once.
        const response = await page.request.get(new URL(await shot.getAttribute("src"), page.url()).href);
        expect(response.ok()).toBe(true);
        expect(response.headers()["content-type"]).toContain("image/webp");
      }
      await expect(page.locator("#" + (locale ? "regler-votre-portee-par-defaut" : "set-your-default-scope"))).toBeVisible();
    });
  });

  test(`${locale || "en/"} the ON/QC label is not added for other provinces`, async ({ page }) => {
    await openLink(page, phoneLink("yyc", "ab", { lang: locale ? "fr" : "en" }));
    const lines = await commandLines(page);
    expect(lines).toContain("region def yyc|* ab|* can|* na");
    expect(lines.join("\n")).not.toContain("onqc");
  });
}
