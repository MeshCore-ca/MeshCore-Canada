import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

// The "Which towns does this label reach?" example on the explainer page.
const pages = {
  en: {
    route: "/config/guide/",
    yes: "Passes it on",
    no: "Doesn't pass it on",
    group: /Label on the message/i,
    radio: {
      ytr: /^ytr\b/,
      on: /^on\b/,
      onqc: /^onqc\b/,
      can: /^can\b/,
      "*": /^No label/
    }
  },
  fr: {
    route: "/fr/config/guide/",
    yes: "Le relaie",
    no: "Ne le relaie pas",
    group: /Étiquette du message/i,
    radio: {
      ytr: /^ytr\b/,
      on: /^on\b/,
      onqc: /^onqc\b/,
      can: /^can\b/,
      "*": /^Aucune étiquette/
    }
  }
};

const TOWNS = ["Belleville", "Kingston", "Ottawa", "Gatineau", "Montréal", "Toronto"];
const expected = {
  ytr: ["Belleville"],
  on: ["Belleville", "Kingston", "Ottawa", "Toronto"],
  onqc: TOWNS,
  can: TOWNS,
  "*": TOWNS
};

async function openDemo(page, lang) {
  await page.goto(siteRoute(pages[lang].route), { waitUntil: "load" });
  const demo = page.locator("[data-scope-demo]");
  await expect(demo.getByRole("radio").first()).toBeVisible();
  return demo;
}

async function expectVerdicts(demo, lang, label) {
  const { yes, no } = pages[lang];
  for (const town of TOWNS) {
    const row = demo.getByRole("listitem").filter({ hasText: town });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(expected[label].includes(town) ? yes : no);
    // The words are never the same for both answers.
    await expect(row).not.toContainText(expected[label].includes(town) ? no : yes);
  }
}

for (const lang of ["en", "fr"]) {
  test.describe(`${lang} scope example`, () => {
    test("starts on ytr and shows the six towns", async ({ page }) => {
      const demo = await openDemo(page, lang);
      await expect(demo.getByRole("group", { name: pages[lang].group })).toBeVisible();
      await expect(demo.getByRole("radio")).toHaveCount(5);
      await expect(demo.getByRole("radio", { name: pages[lang].radio.ytr })).toBeChecked();
      await expect(demo.getByRole("listitem")).toHaveCount(6);
      await expectVerdicts(demo, lang, "ytr");
      // Montréal keeps its accent in both languages.
      await expect(demo.getByRole("listitem").filter({ hasText: "Montréal" })).toHaveCount(1);
    });

    for (const label of ["ytr", "on", "onqc", "can", "*"]) {
      test(`choosing ${label} marks the right towns`, async ({ page }) => {
        const demo = await openDemo(page, lang);
        await demo.getByRole("radio", { name: pages[lang].radio[label] }).check();
        await expectVerdicts(demo, lang, label);
        await expect(demo.locator("[aria-live='polite']")).toContainText(/\S/);
      });
    }

    test("the result sits in a polite live region and its sentence follows the label", async ({ page }) => {
      const demo = await openDemo(page, lang);
      const live = demo.locator("[aria-live='polite']");
      await expect(live).toHaveCount(1);
      await expect(live.getByRole("listitem")).toHaveCount(6);
      const sentence = live.locator("p");
      await expect(sentence).toContainText("ytr");
      await demo.getByRole("radio", { name: pages[lang].radio.on }).check();
      await expect(sentence).toContainText(/\bon\b/);
      await expect(sentence).not.toContainText("ytr");
    });

    test("works from the keyboard: Tab into the group, arrow keys change the label", async ({ page, browserName }) => {
      const demo = await openDemo(page, lang);
      // Start on the example's heading link, the last stop before the group, then Tab once.
      await page.locator("#scope-demo .headerlink").focus();
      await page.keyboard.press("Tab");
      if (!(await demo.evaluate((node) => node.contains(document.activeElement)))) {
        // Safari on a Mac skips radio buttons when you press Tab (Option+Tab reaches them): that is the
        // browser's own setting, not the page. Everywhere else Tab must land in the group.
        expect(browserName, "Tab must reach the group").toBe("webkit");
        await demo.getByRole("radio", { name: pages[lang].radio.ytr }).focus();
      }
      // One Tab stop for the whole group, on the selected label.
      await expect(demo.getByRole("radio", { name: pages[lang].radio.ytr })).toBeFocused();
      await expectVerdicts(demo, lang, "ytr");

      await page.keyboard.press("ArrowDown");
      await expect(demo.getByRole("radio", { name: pages[lang].radio.on })).toBeChecked();
      await expect(demo.getByRole("radio", { name: pages[lang].radio.on })).toBeFocused();
      await expectVerdicts(demo, lang, "on");

      await page.keyboard.press("ArrowRight");
      await expect(demo.getByRole("radio", { name: pages[lang].radio.onqc })).toBeChecked();
      await expectVerdicts(demo, lang, "onqc");

      await page.keyboard.press("ArrowUp");
      await expect(demo.getByRole("radio", { name: pages[lang].radio.on })).toBeChecked();
      await page.keyboard.press("ArrowLeft");
      await expect(demo.getByRole("radio", { name: pages[lang].radio.ytr })).toBeChecked();
      await expectVerdicts(demo, lang, "ytr");

      // The last label ("no label") is reached by arrowing down the list.
      for (let presses = 0; presses < 4; presses += 1) await page.keyboard.press("ArrowDown");
      await expect(demo.getByRole("radio", { name: pages[lang].radio["*"] })).toBeChecked();
      await expectVerdicts(demo, lang, "*");

      // The whole group is one Tab stop: the next Tab leaves it.
      await page.keyboard.press("Tab");
      expect(await demo.evaluate((node) => node.contains(document.activeElement))).toBe(false);
    });

    test("has no serious or critical axe violations", async ({ page }) => {
      const demo = await openDemo(page, lang);
      const blocking = async (builder) => {
        const result = await builder.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        return result.violations
          .filter((violation) => ["serious", "critical"].includes(violation.impact))
          .map((violation) => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            targets: violation.nodes.map((node) => node.target)
          }));
      };
      // The whole page as it loads, with every rule on, like the site-wide check in accessibility.spec.mjs.
      const wholePage = await blocking(new AxeBuilder({ page }));
      expect(wholePage, JSON.stringify(wholePage, null, 2)).toEqual([]);
      // Then the example itself after each kind of answer. Choosing a label scrolls the page, which
      // makes the theme's header title fade in; that fade is not part of the example.
      for (const label of ["ytr", "on", "*"]) {
        await demo.getByRole("radio", { name: pages[lang].radio[label] }).check();
        const found = await blocking(new AxeBuilder({ page }).include("[data-scope-demo]"));
        expect(found, `${label}: ${JSON.stringify(found, null, 2)}`).toEqual([]);
      }
    });

    test("fetches the region catalogue and none of the big boundary files", async ({ page }) => {
      const requested = [];
      page.on("request", (request) => requested.push(new URL(request.url()).pathname));
      await openDemo(page, lang);
      expect(requested.some((path) => path.endsWith("/assets/regions/iata-regions.json"))).toBe(true);
      expect(requested.filter((path) => /\.geojson$/.test(path))).toEqual([]);
    });

    test("fits the screen without sideways scrolling", async ({ page }) => {
      const demo = await openDemo(page, lang);
      const overflow = await demo.evaluate((node) => {
        const own = node.getBoundingClientRect();
        const wide = Array.from(node.querySelectorAll("*")).filter((child) => child.getBoundingClientRect().right > own.right + 1);
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide: wide.map((child) => child.tagName) };
      });
      expect(overflow.page).toBeLessThanOrEqual(0);
      expect(overflow.wide).toEqual([]);
    });

    test("no table on the page needs sideways scrolling on a phone, even without hyphenation", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openDemo(page, lang);
      // Browsers only hyphenate with a dictionary installed, so check the worst case: whole words only.
      await page.addStyleTag({ content: "*, *::before, *::after { hyphens: manual !important; }" });
      const wide = await page.evaluate(() =>
        Array.from(document.querySelectorAll(".md-typeset__scrollwrap"))
          .filter((wrap) => wrap.scrollWidth > wrap.clientWidth)
          .map((wrap) => wrap.querySelector("th").textContent.trim())
      );
      expect(wide, "tables wider than the screen").toEqual([]);
    });

    test("says it could not load, in plain words, when the catalogue is missing", async ({ page }) => {
      await page.route("**/assets/regions/iata-regions.json*", (route) => route.fulfill({ status: 404, body: "" }));
      await page.goto(siteRoute(pages[lang].route), { waitUntil: "load" });
      const demo = page.locator("[data-scope-demo]");
      await expect(demo.getByRole("alert")).toContainText(lang === "fr" ? /ne s’est pas chargé/ : /didn't load/);
      await expect(demo.getByRole("radio")).toHaveCount(0);
    });
  });

  test.describe(`${lang} scope example without JavaScript`, () => {
    test.use({ javaScriptEnabled: false });

    test("the page still reads fine and says what is missing", async ({ page }) => {
      await page.goto(siteRoute(pages[lang].route), { waitUntil: "load" });
      await expect(page.locator("#scopes-and-regions")).toBeVisible();
      await expect(page.locator("[data-scope-demo]")).toBeEmpty();
      await expect(page.getByText(lang === "fr" ? /a besoin de JavaScript/ : /needs JavaScript/)).toBeVisible();
    });
  });
}
