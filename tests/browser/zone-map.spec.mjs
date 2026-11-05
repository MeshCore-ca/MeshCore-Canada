import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { PLACES, mockGeocoder } from "./setup-helpers.mjs";
import { INTRO, LANGS, ONTARIO, QUEBEC, ROUTES, Z, badge, card, choices, line, linked, open, query, search, status, title, where, zonesDrawn } from "./zone-map-helpers.mjs";

// The "Find your zone" page at /config/map/. The shared helpers (and why the tests read the page's own
// words) are in zone-map-helpers.mjs.

for (const lang of LANGS) {
  test(`${lang} the page: a title, one line, the search, the map with its legend, and three footer links`, async ({ page }) => {
    await open(page, lang);
    // The heading's own words; the theme adds a ¶ permalink after them.
    expect(await page.locator("h1").evaluate((heading) => heading.firstChild.textContent)).toBe(lang === "fr" ? "Trouver votre zone" : "Find your zone");
    await expect(page.locator(".md-content article > p").first()).toHaveText(INTRO[lang]);
    await expect(page.getByLabel(Z("search.label", lang), { exact: true })).toHaveAttribute("placeholder", Z("search.placeholder", lang));
    await expect(page.getByRole("button", { name: Z("search.button", lang), exact: true })).toBeVisible();
    await expect(page.locator(".zm-hint")).toHaveText(Z("search.hint", lang));
    // The map is a labelled group, with the site's Leaflet, OpenStreetMap tiles and their credit.
    const map = page.getByRole("group", { name: Z("map.label", lang), exact: true });
    await expect(map).toBeVisible();
    await expect(map.locator(".leaflet-container")).toBeVisible();
    await expect(map.locator("img.leaflet-tile-loaded").first()).toBeAttached();
    const [before, after] = Z("map.credit", lang).split("{link}");
    const credit = map.locator(".leaflet-control-attribution");
    await expect(credit).toContainText(before.trim());
    await expect(credit).toContainText(after.trim());
    const osm = credit.locator("a[href='https://www.openstreetmap.org/copyright']");
    await expect(osm).toHaveText(`OpenStreetMap ${Z("link.new-tab", lang)}`);
    await expect(osm).toHaveAttribute("target", "_blank");
    await zonesDrawn(page);
    // Every zone is drawn: MeshMapper zones solid, placeholders dashed.
    expect(await page.locator("path[data-zone-source='meshmapper']").count()).toBeGreaterThan(20);
    expect(await page.locator("path[data-zone-source='meshcore-canada']").count()).toBeGreaterThan(20);
    await expect(page.locator("path[data-zone-source='meshmapper']").first()).not.toHaveAttribute("stroke-dasharray", /./);
    await expect(page.locator("path[data-zone-source='meshcore-canada']").first()).toHaveAttribute("stroke-dasharray", /\d/);
    // Nothing chosen yet: no card.
    await expect(card(page)).toHaveCount(0);
    // The old region map is gone from this page.
    await expect(page.locator("script[src*='regions/regions.js'], link[href*='regions/regions.css'], [data-mcc-regions]")).toHaveCount(0);
    const footer = page.locator(".md-content small");
    const words = lang === "fr"
      ? ["Comprendre les zones", "Télécharger les tracés des zones", "Sources de données"]
      : ["How zones work", "Download zone outlines", "Data sources"];
    await expect(footer.locator("a")).toHaveText(words);
    await expect(footer.locator("a").nth(0)).toHaveAttribute("href", /guide\/#scopes-and-regions$/);
    await expect(footer.locator("a").nth(1)).toHaveAttribute("href", /assets\/regions\/iata-boundaries\.geojson$/);
    await expect(footer.locator("a").nth(2)).toHaveAttribute("href", /assets\/regions\/NOTICE\.txt$/);
  });

  test(`${lang} the legend is always under the map, in words`, async ({ page }) => {
    await open(page, lang);
    const legend = page.getByRole("list", { name: Z("legend.label", lang), exact: true });
    await expect(legend).toBeVisible();
    await expect(legend.locator("li")).toHaveText([Z("legend.you", lang), Z("legend.mesh", lang), Z("legend.placeholder", lang)]);
    await expect(legend.locator(".zm-swatch")).toHaveCount(3);
    const mapBox = await page.locator("[data-zone-map-box]").boundingBox();
    const legendBox = await legend.boundingBox();
    expect(legendBox.y).toBeGreaterThanOrEqual(mapBox.y + mapBox.height - 1);
  });

  test(`${lang} a town search shows its zone: the card, the badge, the setup link and MeshMapper`, async ({ page }) => {
    const asked = await mockGeocoder(page);
    await open(page, lang);
    await search(page, "Belleville");
    await expect(title(page)).toHaveText("YTR · Quinte West");
    await expect(where(page)).toHaveText(`Belleville · ${ONTARIO[lang]}`);
    await expect(badge(page)).toHaveText(Z("badge.mesh", lang));
    await expect(line(page)).toHaveText(Z("line.mesh", lang, { code: "YTR" }));
    expect(asked).toContain("Belleville");
    // Set up a repeater here: the setup tool, relative, with the zone and province.
    const setup = page.locator("[data-zone-setup]");
    await expect(setup).toHaveText(Z("action.setup", lang));
    expect(await setup.getAttribute("href")).toBe("../?tag=ytr&province=on");
    // Open in MeshMapper: the zone's own page, in a new tab, which it says to screen readers.
    const meshmapper = page.locator("[data-zone-meshmapper]");
    await expect(meshmapper).toHaveAttribute("href", "https://ytr.meshmapper.net/");
    await expect(meshmapper).toHaveAttribute("target", "_blank");
    await expect(meshmapper).toHaveAttribute("rel", /noopener/);
    // The words and the new-tab note; the site's stylesheet adds the ↗ to every link that opens a new tab.
    await expect(meshmapper).toHaveText(`${Z("action.meshmapper", lang)} ${Z("link.new-tab", lang)}`);
    await expect(meshmapper.locator(".zm-sr")).toHaveText(Z("link.new-tab", lang));
    // The selection is in the address bar.
    await expect.poll(() => query(page)).toEqual({ tag: "ytr", province: "on" });
    // The map shows the zone up close, codes and all.
    await zonesDrawn(page);
    await expect(page.locator("path[data-zone='ytr']").first()).toHaveAttribute("stroke-width", "3");
    await expect(page.locator(".zm-label", { hasText: /^ytr$/i })).toBeVisible();
  });

  test(`${lang} a typed zone code needs no search; one in two provinces asks which`, async ({ page }) => {
    const asked = await mockGeocoder(page);
    await open(page, lang);
    await search(page, "YTR");
    await expect(title(page)).toHaveText("YTR · Quinte West");
    await expect(where(page)).toHaveText(ONTARIO[lang]);
    await search(page, "yow");
    await expect(status(page)).toHaveText(Z("status.province", lang));
    await expect(choices(page)).toHaveCount(2);
    await page.locator('[data-zone-choice="yow:qc"]').click();
    await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
    await expect(where(page)).toHaveText(QUEBEC[lang]);
    await expect(choices(page)).toHaveCount(0);
    expect(await page.locator("[data-zone-setup]").getAttribute("href")).toBe("../?tag=yow&province=qc");
    expect(asked).toEqual([]);
  });
}

test("a street address shows the zone it's in", async ({ page }) => {
  await mockGeocoder(page);
  await open(page, "en");
  await search(page, "111 Wellington Street, Ottawa");
  await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
  await expect(where(page)).toHaveText("111 Wellington Street, Ottawa · Ontario");
  await expect(badge(page)).toHaveText(Z("badge.mesh", "en"));
});

test("a province after the town narrows the search to it", async ({ page }) => {
  await mockGeocoder(page);
  await open(page, "en");
  // Without it, Saint-Jean is several places (see the test below); with it, only the one in Québec is left.
  await search(page, "Saint-Jean, QC");
  await expect(choices(page)).toHaveCount(0);
  await expect(title(page)).toContainText("YUL · ");
  await expect(where(page)).toHaveText("Saint-Jean-sur-Richelieu · Québec");
  expect(await page.locator("[data-zone-setup]").getAttribute("href")).toBe("../?tag=yul&province=qc");
});

test("a town is placed at the coordinates the place search gives, in French too", async ({ page }) => {
  await mockGeocoder(page, { ...PLACES, "Québec": [{ key: "geonames", category: "Ville", name: "Québec", province: "Québec", lat: 46.8139, lng: -71.2080 }] });
  await open(page, "fr");
  await search(page, "Québec");
  await expect(title(page)).toContainText("YQB · ");
  await expect(where(page)).toHaveText("Québec · Québec");
  await expect(badge(page)).toHaveText(Z("badge.mesh", "fr"));
  expect(await page.locator("[data-zone-setup]").getAttribute("href")).toBe("../?tag=yqb&province=qc");
});

test("coordinates are read here and never sent to the place search", async ({ page }) => {
  const asked = await mockGeocoder(page);
  await open(page, "fr");
  await search(page, "44.162812, -77.383241");
  await expect(title(page)).toHaveText("YTR · Quinte West");
  await expect(where(page)).toHaveText("44.1628, -77.3832 · Ontario");
  // Not in Canada (the longitude's minus sign forgotten), or not readable: a plain message, and still nothing sent.
  await search(page, "44.1628, 77.3832");
  await expect(status(page)).toHaveText(Z("status.outside", "fr"));
  // A new search replaces the last answer, so an old card can't sit under a new message.
  await expect(card(page)).toHaveCount(0);
  await search(page, "44.1628, -77.3832, 12");
  await expect(status(page)).toHaveText(Z("status.format", "fr"));
  // French decimal commas work too.
  await search(page, "44,1628; -77,3832");
  await expect(title(page)).toHaveText("YTR · Quinte West");
  expect(asked).toEqual([]);
});

test("several places, several zones, or a province mismatch: it asks which", async ({ page }) => {
  await mockGeocoder(page);
  await open(page, "en");
  // Several places with that name.
  await search(page, "Saint-Jean");
  await expect(status(page)).toHaveText(Z("status.places", "en"));
  await expect(choices(page)).toContainText(["Saint-Jean-sur-Richelieu", "Saint John", "St. John's"]);
  await choices(page).filter({ hasText: "Saint John" }).click();
  await expect(title(page)).toHaveText("YSJ · Saint John");
  await expect(choices(page)).toHaveCount(0);
  // Focus moves to what was found, not to the top of the page.
  await expect(title(page)).toBeFocused();
  // The search says Québec; the zone map puts this spot in Ontario.
  await search(page, "Ottawa");
  await expect(status(page)).toHaveText(Z("status.mismatch", "en"));
  await expect(choices(page)).toHaveCount(2);
  await page.locator('[data-zone-choice="yow:on"]').click();
  await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
  await expect(where(page)).toHaveText("Ottawa · Ontario");
});

test("nothing found, no zone there, or the place search down: a plain message", async ({ page }) => {
  await mockGeocoder(page);
  await open(page, "en");
  await search(page, "Nowhereville");
  await expect(status(page)).toHaveText(Z("status.nothing", "en"));
  await expect(card(page)).toHaveCount(0);
  // Seattle's coordinates, given a Canadian province so the search keeps it.
  await search(page, "Faraway");
  await expect(status(page)).toHaveText(Z("status.none", "en"));
  await page.unroute("https://geolocator.api.geo.ca/**");
  await page.route("https://geolocator.api.geo.ca/**", (route) => route.abort());
  await search(page, "Kingston");
  await expect(status(page)).toHaveText(Z("status.failed", "en"));
  expect(Z("status.failed", "en")).toMatch(/tap the map/);
  expect(Z("status.failed", "fr")).toMatch(/touchez la carte/);
});

for (const lang of LANGS) {
  test(`${lang} a placeholder says so: a starter region and a planning extension`, async ({ page }) => {
    await open(page, lang);
    // Charlottetown's region is a MeshCore Canada starter region.
    await search(page, "yyg");
    await expect(title(page)).toContainText("YYG · ");
    await expect(badge(page)).toHaveText(Z("badge.starter", lang));
    await expect(line(page)).toHaveText(Z("line.placeholder", lang));
    await expect(page.locator("[data-zone-meshmapper]")).toHaveCount(0);
    await page.locator("[data-zone-more] summary").click();
    await expect(page.locator("[data-zone-more]")).toContainText(Z("more.source.placeholder", lang));
    // The Wingham-area point is just outside Waterloo's MeshMapper zone.
    await search(page, "43.8678, -81.2619");
    await expect(title(page)).toHaveText("YKF · Waterloo");
    await expect(badge(page)).toHaveText(Z("badge.extension", lang));
    await expect(line(page)).toHaveText(Z("line.placeholder", lang));
    await expect(page.locator("[data-zone-meshmapper]")).toHaveCount(0);
  });

  test(`${lang} More about this region: local groups, where the outline comes from, the maintainer`, async ({ page }) => {
    await open(page, lang, "?tag=ytr&province=on");
    const more = page.locator("[data-zone-more]");
    await expect(more).not.toHaveAttribute("open", "");
    await expect(more.locator("summary")).toHaveText(Z("more", lang));
    await more.locator("summary").click();
    const group = more.getByRole("link", { name: "Quinte Mesh Network", exact: true });
    await expect(group).toHaveAttribute("href", "../../provinces/ontario/#community-quinte-mesh-network");
    await expect(more).toContainText(Z("more.groups", lang));
    await expect(more).toContainText(Z("more.source.mesh", lang));
    await expect(more.locator("li").last()).toHaveText(linked("more.no-maintainer", lang));
    const volunteer = more.getByRole("link", { name: Z("more.no-maintainer.link", lang), exact: true });
    const href = new URL(await volunteer.getAttribute("href"), page.url());
    expect(href.pathname).toBe(lang === "fr" ? "/fr/submit-idea/" : "/submit-idea/");
    expect(Object.fromEntries(href.searchParams)).toMatchObject({ region: "ytr", request: "maintainer" });
  });

  test(`${lang} the feedback link opens the idea form with the zone filled in`, async ({ page }) => {
    await open(page, lang, "?tag=ytr&province=on");
    const tell = page.locator(".zm-card__tell");
    await expect(tell).toHaveText(linked("tell", lang));
    const link = tell.getByRole("link", { name: Z("tell.link", lang), exact: true });
    const href = new URL(await link.getAttribute("href"), page.url());
    expect(Object.fromEntries(href.searchParams)).toEqual({
      region: "ytr", request: "boundary", source_page: `https://meshcore.ca/${lang === "fr" ? "fr/" : ""}config/map/`
    });
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/${lang === "fr" ? "fr/" : ""}submit-idea/\\?`));
    await expect(page.locator("#submission-context")).toHaveValue(new RegExp(`^${lang === "fr" ? "Région IATA : " : "IATA region: "}ytr\\n`));
    await expect(page.locator("#submission-category")).toHaveValue("Regional community information");
  });

  test(`${lang} the deep link opens with the zone selected and zoomed; unknown or old ones are ignored`, async ({ page }) => {
    await open(page, lang, "?tag=yow&province=qc");
    await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
    await expect(where(page)).toHaveText(QUEBEC[lang]);
    await zonesDrawn(page);
    // Zoomed in: the codes show.
    await expect(page.locator(".zm-label", { hasText: /^yow$/i })).toBeVisible();
    await expect(page.locator("path[data-zone='yow']").first()).toHaveAttribute("stroke-width", "3");
    // A province the zone isn't in falls back to one it is in.
    await open(page, lang, "?tag=ytr&province=qc");
    await expect(title(page)).toHaveText("YTR · Quinte West");
    await expect(where(page)).toHaveText(ONTARIO[lang]);
    // An unknown zone, an old code and old map parameters: nothing chosen, the map as usual.
    for (const old of ["?tag=zzz&province=on", "?tag=ott", "?tag=ott&province=on&type=large&regions=mtl&firmware=1.15", "?region=<b>x</b>"]) {
      await open(page, lang, old);
      await expect(card(page)).toHaveCount(0);
      await zonesDrawn(page);
      await expect(page.locator(".zm-label").first()).toBeHidden();
    }
  });

  test(`${lang} browse by province or territory: a zone picked there is selected and shown on the map`, async ({ page }) => {
    await open(page, lang);
    const browse = page.locator("[data-zone-browse]");
    await expect(browse.locator("summary")).toHaveText(Z("browse", lang));
    await browse.locator("summary").click();
    // Each province or territory with its zones, by name.
    const ontario = browse.locator(".zm-browse__province", { has: page.locator("strong", { hasText: /^Ontario$/ }) });
    await expect(ontario.getByRole("button", { name: Z("browse.zone", lang, { name: "Quinte West", code: "ytr" }), exact: true })).toBeVisible();
    await expect(browse.locator(".zm-browse__province strong")).toHaveCount(13);
    await ontario.getByRole("button", { name: Z("browse.zone", lang, { name: "Quinte West", code: "ytr" }), exact: true }).click();
    await expect(title(page)).toHaveText("YTR · Quinte West");
    await expect(where(page)).toHaveText(ONTARIO[lang]);
    await expect.poll(() => query(page)).toEqual({ tag: "ytr", province: "on" });
    // The page moves to the map, and keyboard users carry on from the card.
    await expect(page.locator("[data-zone-map-box]")).toBeInViewport();
    await expect(title(page)).toBeFocused();
  });

  test(`${lang} tapping a zone on the map selects it`, async ({ page }) => {
    await open(page, lang);
    await zonesDrawn(page);
    // Nunavut's region is the largest: find a spot on the map that is inside it and not under anything else.
    const zone = page.locator("path[data-zone='yfb']").first();
    await zone.scrollIntoViewIfNeeded();
    const spot = await zone.evaluate((path) => {
      const box = path.getBoundingClientRect();
      for (let y = box.top + 4; y < box.bottom; y += 6) {
        for (let x = box.left + 4; x < box.right; x += 6) {
          if (document.elementFromPoint(x, y) === path) return { x, y };
        }
      }
      return null;
    });
    expect(spot).not.toBeNull();
    await page.mouse.click(spot.x, spot.y);
    await expect(title(page)).toHaveText(lang === "fr" ? "YFB · Nunavut" : "YFB · Nunavut");
    await expect(where(page)).toHaveText("Nunavut");
    await expect(badge(page)).toHaveText(Z("badge.starter", lang));
    await expect.poll(() => query(page)).toEqual({ tag: "yfb", province: "nu" });
    await expect(page.locator("path[data-zone='yfb']").first()).toHaveAttribute("stroke-width", "3");
  });

  test(`${lang} axe finds no serious or critical issues, before and after a search`, async ({ page }) => {
    await mockGeocoder(page);
    await open(page, lang);
    await zonesDrawn(page);
    const scan = async (label) => {
      const result = await new AxeBuilder({ page }).include(".md-content").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const blocking = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact))
        .map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }));
      expect(blocking, `${lang} ${label}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
    };
    await scan("empty");
    await search(page, "Saint-Jean");
    await expect(choices(page)).toHaveCount(3);
    await scan("choices");
    await choices(page).filter({ hasText: "Saint John" }).click();
    await page.locator("[data-zone-more] summary").click();
    await page.locator("[data-zone-browse] summary").click();
    await scan("card, more and browse open");
  });
}

test("a link opens the map at its zone before the outlines are in, and keeps that view when the zone fits", async ({ page }) => {
  // Hold the big outline file back: the map should already be at the zone, from the small catalogue.
  let release;
  const held = new Promise((resolve) => { release = resolve; });
  await page.route("**/assets/regions/iata-boundaries.geojson*", async (route) => { await held; await route.continue(); });
  const zooms = [];
  page.on("request", (request) => {
    const tile = /tile\.openstreetmap\.org\/(\d+)\//.exec(request.url());
    if (tile) zooms.push(Number(tile[1]));
  });
  // A laptop-sized map, where Quinte West fits at the first zoom; on a short phone screen it is refitted.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(siteRoute("/config/map/?tag=ytr&province=on"));
  await expect.poll(() => zooms.length).toBeGreaterThan(0);
  expect(Math.min(...zooms), "no tiles for the whole of Canada first").toBeGreaterThanOrEqual(7);
  // The map shows its tiles while the outlines are still on their way, and draws no zone yet.
  await expect(page.locator("img.leaflet-tile-loaded").first()).toBeAttached();
  await expect(page.locator("path[data-zone]")).toHaveCount(0);
  const before = zooms.length;
  release();
  await expect(title(page)).toHaveText("YTR · Quinte West");
  await zonesDrawn(page);
  await expect(page.locator(".zm-label", { hasText: /^ytr$/i })).toBeVisible();
  // Quinte West fits in that first view, so no second set of tiles was needed.
  await page.waitForTimeout(300);
  expect(zooms.slice(before).filter((zoom) => zoom !== zooms[0])).toEqual([]);
});

test("the outline file is downloaded once, for the map and for every search", async ({ page }) => {
  await mockGeocoder(page);
  const downloads = [];
  page.on("request", (request) => { if (request.url().includes("/iata-boundaries.geojson")) downloads.push(request.url()); });
  await open(page, "en");
  await zonesDrawn(page);
  await search(page, "Belleville");
  await expect(title(page)).toHaveText("YTR · Quinte West");
  await search(page, "44.1628, -77.3832");
  await expect(where(page)).toHaveText("44.1628, -77.3832 · Ontario");
  expect(downloads).toHaveLength(1);
});

for (const lang of LANGS) {
  for (const [scheme, action] of [["default", "rgb(20, 88, 176)"], ["slate", "rgb(125, 183, 255)"]]) {
    test(`${lang} ${scheme} colours: the controls and the card use the site's palette and stay readable`, async ({ page }) => {
      await open(page, lang, "?tag=ytr&province=on");
      await expect(title(page)).toHaveText("YTR · Quinte West");
      await zonesDrawn(page);
      await page.locator(`input[data-md-color-scheme="${scheme}"]`).evaluate((element) => element.click());
      const find = page.getByRole("button", { name: Z("search.button", lang), exact: true });
      // The main buttons are the site's action colour, in light and dark.
      await expect(find).toHaveCSS("background-color", action);
      await expect(page.locator("[data-zone-setup]")).toHaveCSS("background-color", action);
      await find.focus();
      await find.hover();
      const contrast = await new AxeBuilder({ page }).include("[data-zone-map]").withRules(["color-contrast"]).analyze();
      expect(contrast.violations).toEqual([]);
      // The page sits on the site's own background, not one of its own.
      await expect(page.locator("body")).toHaveCSS("background-color", scheme === "default" ? "rgb(246, 248, 251)" : "rgb(15, 22, 35)");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
    });
  }
}

test("the card is read out: it sits in a live region, and the search status is a status", async ({ page }) => {
  await open(page, "en");
  await expect(page.locator("[data-zone-result]")).toHaveAttribute("aria-live", "polite");
  await expect(status(page)).toHaveAttribute("role", "status");
  await search(page, "ytr");
  await expect(page.locator("[data-zone-result] [data-zone-card]")).toHaveCount(1);
  await expect(card(page)).toHaveAttribute("aria-labelledby", await title(page).getAttribute("id"));
});

test("keyboard only: search, choose and browse without the map", async ({ page, browserName }) => {
  // Safari moves Tab only between form fields unless "Press Tab to highlight each item" is on, so there the
  // buttons are focused directly; Enter on them is still the keyboard's.
  const tabTo = async (locator, presses) => {
    if (browserName === "webkit") await locator.focus();
    else for (let count = 0; count < presses; count += 1) await page.keyboard.press("Tab");
    await expect(locator).toBeFocused();
  };
  await open(page, "en");
  await page.locator("[data-zone-search]").focus();
  await page.keyboard.type("yow");
  await page.keyboard.press("Enter");
  await expect(choices(page)).toHaveCount(2);
  // Focus stays in the box; the choices come after the Find button.
  await expect(page.locator("[data-zone-search]")).toBeFocused();
  await tabTo(choices(page).first(), 2);
  await page.keyboard.press("Enter");
  await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
  await expect(title(page)).toBeFocused();
  // The map isn't a tab stop; its zoom buttons are.
  expect(await page.locator(".leaflet-container").evaluate((element) => element.hasAttribute("tabindex"))).toBe(false);
  const summary = page.locator("[data-zone-browse] summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  await tabTo(page.locator("[data-zone-pick]").first(), 1);
  await page.keyboard.press("Enter");
  await expect(card(page)).toHaveAttribute("data-zone-card", await page.locator("[data-zone-pick]").first().getAttribute("data-zone-pick").then((value) => value.split(":")[0]));
});

test("on a phone: no sideways scroll, a map about half the screen, and the card scrolled into view", async ({ page }) => {
  await mockGeocoder(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "fr");
  await zonesDrawn(page);
  const share = await page.locator("[data-zone-map-box]").evaluate((element) => element.getBoundingClientRect().height / window.innerHeight);
  expect(share).toBeGreaterThan(0.45);
  expect(share).toBeLessThan(0.62);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await search(page, "Belleville");
  await expect(title(page)).toHaveText("YTR · Quinte West");
  await expect(title(page)).toBeInViewport();
  await page.locator("[data-zone-more] summary").click();
  await page.locator("[data-zone-browse] summary").click();
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test("the map didn't load: it says so, and the search and the list still work", async ({ page }) => {
  await page.route("**/regions/vendor/leaflet/leaflet.js", (route) => route.abort());
  await open(page, "en");
  await expect(page.locator("[data-zone-map-failed]")).toHaveText(Z("map.failed", "en"));
  await expect(page.locator("[data-zone-map-box]")).toHaveCount(0);
  await search(page, "ytr");
  await expect(title(page)).toHaveText("YTR · Quinte West");
});

test("the tiles didn't load: the map is replaced by one line, and the search and the list still work", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await open(page, "en");
  await expect(page.locator("[data-zone-map-failed]")).toHaveText(Z("map.failed", "en"));
  await expect(page.locator("[data-zone-map-box]")).toHaveCount(0);
  await search(page, "ytr");
  await expect(title(page)).toHaveText("YTR · Quinte West");
});

test("the zones didn't load: a plain message", async ({ page }) => {
  await page.route("**/assets/regions/iata-regions.json*", (route) => route.abort());
  await page.goto(siteRoute(ROUTES.en));
  await expect(status(page)).toHaveText(Z("status.load-failed", "en"));
});

test("without JavaScript: one line pointing at How repeaters work", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(siteRoute(ROUTES.en));
  await expect(page.locator("noscript")).toHaveCount(1);
  await expect(page.locator("article").getByRole("link", { name: "How repeaters work", exact: true })).toHaveAttribute("href", /guide\/#scopes-and-regions$/);
  await context.close();
});
