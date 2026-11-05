import { expect, test } from "./site-fixtures.mjs";
import { expectStep, openLink, phoneLink, commandLines } from "./setup-helpers.mjs";
import { LANGS, Z, badge, card, line, open, search, title } from "./zone-map-helpers.mjs";

// Boundary cases on the "Find your zone" page: a spot inside a zone, just outside one (MeshCore Canada's
// planning extension), and where each of them leads in the setup tool.
for (const lang of LANGS) {
  test(`${lang} a spot in Chatham-Kent gives its zone under its published name`, async ({ page }) => {
    await open(page, lang);
    await search(page, "42.406519, -82.188273");
    await expect(title(page)).toHaveText("XCM · Chatham-Kent");
    await expect(card(page)).not.toContainText("undefined");
    await expect(badge(page)).toHaveText(Z("badge.mesh", lang));
  });

  for (const [town, tag, lat, lon] of [["reported Wingham point", "ykf", 43.8678, -81.2619], ["Goderich", "yxu", 43.743, -81.71], ["Kincardine", "ylk", 44.176, -81.636]]) {
    test(`${lang} ${town} is a labelled local extension of ${tag}, not YSB`, async ({ page }) => {
      await open(page, lang);
      await search(page, `${lat}, ${lon}`);
      await expect(title(page)).toContainText(`${tag.toUpperCase()} · `);
      await expect(card(page)).not.toContainText(/ysb/i);
      await expect(badge(page)).toHaveText(Z("badge.extension", lang));
      await expect(line(page)).toHaveText(Z("line.placeholder", lang));
      // MeshCore Canada's own outline, so there is no MeshMapper page to open.
      await expect(page.locator("[data-zone-meshmapper]")).toHaveCount(0);
      const configure = page.locator("[data-zone-setup]");
      expect(Object.fromEntries(new URL(await configure.getAttribute("href"), page.url()).searchParams)).toEqual({ tag, province: "on" });
      await configure.click();
      await expectStep(page, "type");
      // The same region in the setup tool.
      await openLink(page, phoneLink(tag, "on", { lang }));
      expect(await commandLines(page)).toContain(`region def ${tag}|* on|* onqc|* can|* na`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
    });
  }

  test(`${lang} published Waterloo stays published`, async ({ page }) => {
    await open(page, lang);
    await search(page, "43.4643, -80.5204");
    await expect(title(page)).toContainText("YKF · ");
    await expect(badge(page)).toHaveText(Z("badge.mesh", lang));
    await expect(line(page)).toHaveText(Z("line.mesh", lang, { code: "YKF" }));
    await expect(page.locator("[data-zone-meshmapper]")).toHaveAttribute("href", "https://ykf.meshmapper.net/");
  });
}
