import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

// Shared by the specs that drive the "Find your zone" page at /config/map/. Every word comes from
// zone-map.js's own table, so the tests read the same table instead of copying sentences. Tiles come
// from site-fixtures.mjs (a 1×1 PNG for every OpenStreetMap tile) and the place search from
// setup-helpers.mjs's geo.ca mock.
vm.runInThisContext(readFileSync("docs/assets/setup/zone-map.js", "utf8"), { filename: "zone-map.js" });
export const Z = (key, lang, vars) => globalThis.MeshCoreZoneMap.t(key, lang, vars);
// A string with {link}, as it reads on the page.
export const linked = (key, lang, extra = "") => Z(key, lang).replace("{link}", Z(`${key}.link`, lang) + extra);

export const ROUTES = { en: "/config/map/", fr: "/fr/config/map/" };
export const LANGS = ["en", "fr"];
export const INTRO = {
  en: "See which zone (IATA code) a place is in, and whether it's a MeshMapper zone or a placeholder.",
  fr: "Voyez dans quelle zone (code IATA) se trouve un endroit, et s’il s’agit d’une zone MeshMapper ou d’une zone provisoire."
};
export const ONTARIO = { en: "Ontario", fr: "Ontario" };
export const QUEBEC = { en: "Québec", fr: "Québec" };

export const card = (page) => page.locator("[data-zone-card]");
export const title = (page) => page.locator("[data-zone-card] h2");
export const where = (page) => page.locator("[data-zone-where]");
export const badge = (page) => page.locator("[data-zone-badge]");
export const line = (page) => page.locator("[data-zone-line]");
export const status = (page) => page.locator("[data-zone-status]");
export const choices = (page) => page.locator("[data-zone-choice]");

export async function open(page, lang, query = "") {
  await page.goto(siteRoute(ROUTES[lang] + query));
  // The zones are drawn once the browse list is filled: the data is in.
  await expect(page.locator("[data-zone-pick]").first()).toBeAttached();
}
export async function search(page, text) {
  await page.locator("[data-zone-search]").fill(text);
  await page.locator("[data-zone-search]").press("Enter");
}
export async function zonesDrawn(page) {
  await expect(page.locator("path[data-zone]").first()).toBeAttached();
}
export const query = (page) => Object.fromEntries(new URL(page.url()).searchParams);
