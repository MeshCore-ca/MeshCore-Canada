import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const removals = ["region remove ott", "region remove on-alg", "region remove on", "region remove can", "region save", "region"];

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} proposal cleanup choices and optional explanations work together`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
    const ask = page.locator('[data-scp-ask]');
    const old = page.locator('[data-scp-branch="old"]');
    const clean = page.locator('[data-scp-branch="clean"]');
    const yes = ask.locator('[data-scp-choice="old"]');
    const no = ask.locator('[data-scp-choice="clean"]');
    await expect(ask).toBeVisible();
    await expect(yes).toHaveText(locale ? "Oui, d’autres noms" : "Yes, other names");
    await expect(old).toBeHidden();
    await expect(clean).toBeHidden();
    await expect(page.locator('[data-scp-ask-nojs]')).toBeHidden();

    await no.click();
    await expect(no).toHaveAttribute("aria-pressed", "true");
    await expect(clean).toBeVisible();
    await expect(old).toBeHidden();
    await clean.locator('a').click();
    await expect(page).toHaveURL(new RegExp(locale ? "#etape-3-reglages-standard-de-meshcore-canada$" : "#step-3-standard-meshcore-canada-settings$"));

    await yes.click();
    await expect(yes).toHaveAttribute("aria-pressed", "true");
    await expect(no).toHaveAttribute("aria-pressed", "false");
    await expect(clean).toBeHidden();
    await expect(old).toBeVisible();
    await expect(old.locator('ol.scp-cmds code')).toHaveText(removals);
    await expect(old.locator('.scp-copy').first()).toHaveAttribute("aria-label", `${locale ? "Copier" : "Copy"}: region remove ott`);

    const explanation = page.locator('details.scp-more').first();
    await expect(explanation.locator('figure')).toBeHidden();
    await explanation.locator('summary').click();
    await expect(explanation.locator('figure')).toBeVisible();
    await explanation.locator('summary').click();
    await expect(explanation.locator('figure')).toBeHidden();
    const neighbours = page.locator('a[href^="https://onqc.meshmapper.net/?preset=all"]');
    await expect(neighbours).toHaveCount(1);
    expect(new URL(await neighbours.getAttribute("href")).searchParams.get("l")).toBe("rep.nbr.nz.nzb.rb");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();

    // The independent cleanup question must survive a catalogue outage too.
    await page.route("**/iata-regions.json", route => route.abort());
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/scp-js/);
    await yes.click();
    await expect(old).toBeVisible();
    await expect(old.locator('ol.scp-cmds code')).toHaveText(removals);
    await expect(page.locator('[data-scp-nojs]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test.describe(`${locale || "en/"} proposal without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("keeps cleanup instructions and native expandable explanations available", async ({ page }) => {
      await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
      await expect(page.locator('[data-scp-ask]')).toBeHidden();
      await expect(page.locator('[data-scp-ask-nojs]')).toBeVisible();
      await expect(page.locator('[data-scp-branch="clean"]')).toBeHidden();
      const old = page.locator('[data-scp-branch="old"]');
      await expect(old).toBeVisible();
      await expect(old.locator('ol.scp-cmds code')).toHaveText(removals);
      await expect(page.locator('[data-scp-picker]')).toBeHidden();
      await expect(page.locator('[data-scp-nojs]').first()).toBeVisible();
      const explanation = page.locator('details.scp-more').first();
      await expect(explanation.locator('figure')).toBeHidden();
      await explanation.locator('summary').click();
      await expect(explanation.locator('figure')).toBeVisible();
    });
  });
}
