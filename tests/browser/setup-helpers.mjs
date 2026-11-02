import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect } from "./site-fixtures.mjs";

// Shared by the specs that drive the guided setup tool at /config/. Every word the tool
// shows comes from setup-text.js, so the tests read the same table instead of copying sentences.
vm.runInThisContext(readFileSync("docs/assets/setup/setup-text.js", "utf8"), { filename: "setup-text.js" });
const text = globalThis.MeshCoreSetupText;
export const T = (key, lang, vars) => text.t(key, lang, vars);
// What a string reads as on the page: backticks become <code>, {link} becomes the link's text.
export const plain = (key, lang, vars) => T(key, lang, vars).replace(/`/g, "").replace("{link}", () => T(`${key}.link`, lang));
export const firstSentence = (value) => value.split(/(?<=[.!?:])\s/)[0];
// A string whose {link} opens in a new tab, which the link says to screen readers.
export const linked = (key, lang) => T(key, lang).replace(/`/g, "").replace("{link}", () => `${T(`${key}.link`, lang)} ${T("link.new-tab", lang)}`);

// Geocoder replies by query, in the shape https://geolocator.api.geo.ca/ sends.
const row = (name, province, lat, lng, category = "City") => ({ key: "geonames", category, name, province, lat, lng });
export const PLACES = {
  "Belleville": [row("Belleville", "Ontario", 44.16281, -77.38324)],
  "Kingston": [row("Kingston", "Ontario", 44.22976, -76.48098)],
  "Guelph": [row("Guelph", "Ontario", 43.5448, -80.2482)],
  // The Québec side of the Ottawa-Gatineau zone.
  "Gatineau": [row("Gatineau", "Québec", 45.4765, -75.7013)],
  "Saint-Jean": [row("Saint-Jean-sur-Richelieu", "Québec", 45.30713, -73.26259)],
  "Saint John": [row("Saint John", "New Brunswick", 45.27271, -66.06766)],
  "St. John's": [row("St. John's", "Newfoundland and Labrador", 47.56494, -52.70931)],
  // The search says Québec; the region map puts this spot in Ontario.
  "Ottawa": [row("Ottawa", "Québec", 45.4215, -75.6972)],
  // A spot no region covers (Seattle's coordinates, given a Canadian province so the search keeps it).
  "Faraway": [row("Faraway", "British Columbia", 47.6062, -122.3321)]
};

export async function mockGeocoder(page, places = PLACES) {
  const queries = [];
  await page.route("https://geolocator.api.geo.ca/**", (route) => {
    const query = new URL(route.request().url()).searchParams.get("q");
    queries.push(query);
    return route.fulfill({ json: places[query] || [] });
  });
  return queries;
}

export const step = (page) => page.locator("[data-setup-step]");
export const nextButton = (page) => page.locator("[data-setup-next]");
export const progress = (page) => page.locator("[data-setup-progress]");
export const codes = (page) => page.locator("[data-setup-command] code");
// The command lines on the commands screen. A link that holds every answer renders that screen at
// once, with a loading panel while the region data arrives, so wait for the first line before reading:
// allTextContents() on its own does not wait and can return nothing.
export async function commandLines(page) {
  await expect(codes(page).first()).toBeVisible();
  return codes(page).allTextContents();
}

export async function expectStep(page, id) {
  await expect(page.locator(`[data-setup-step="${id}"]`)).toBeVisible();
  // One question per screen.
  await expect(step(page)).toHaveCount(1);
}
export async function next(page) {
  await expect(nextButton(page)).toBeEnabled();
  await nextButton(page).click();
}
export async function choose(page, value) {
  await page.locator(`[data-setup-step] [data-setup-choice="${value}"]`).click();
}
export async function answer(page, id, value) {
  await expectStep(page, id);
  await choose(page, value);
  await next(page);
}
export async function confirmStep(page, id) {
  await expectStep(page, id);
  await expect(nextButton(page)).toBeDisabled();
  await page.locator("[data-setup-confirm]").check();
  await next(page);
}
export async function version(page, reply) {
  await expectStep(page, "version");
  await page.locator("[data-setup-version]").fill(reply);
  await next(page);
}
export async function searchTown(page, query) {
  await page.locator("[data-setup-town]").fill(query);
  await page.locator("[data-setup-town]").press("Enter");
}
export async function town(page, query, tag) {
  await expectStep(page, "town");
  await searchTown(page, query);
  await expect(page.locator("[data-setup-region]")).toContainText(tag);
  await next(page);
}
// Presses Next until the tool reaches `id`; every earlier step has to be answered already.
export async function nextUntil(page, id) {
  for (let count = 0; count < 15 && (await page.locator(`[data-setup-step="${id}"]`).count()) === 0; count += 1) {
    await next(page);
  }
  await expectStep(page, id);
}
// The commands between `region` and `region save`.
export function scopeLines(list) {
  return list.slice(list.indexOf("region"), list.indexOf("region save") + 1);
}

// A running repeater changed from the phone: no flash steps and no radio line, so a link
// that holds the rest of the answers opens on the commands.
export const PHONE_ROUTE = "type=repeater&board=heltec-v3&status=running&reflash=0&firmware=1.16";
export const toolRoot = (lang) => (lang === "fr" ? "/fr/config/" : "/config/");
// A complete phone-route link for a region, so it opens on the commands. `extra` is more answers
// as a query string, for example "neighbours=yul".
export function phoneLink(tag, province, { lang = "en", firmware = "1.16", role = "city", extra = "" } = {}) {
  return `${toolRoot(lang)}?${PHONE_ROUTE.replace("firmware=1.16", `firmware=${firmware}`)}&tag=${tag}&province=${province}&role=${role}&name=Test_R1${extra ? `&${extra}` : ""}`;
}
// Types the first answers of the phone route, ending on the town step.
export async function startPhoneRoute(page, reply = "v1.16.2") {
  await answer(page, "type", "repeater");
  await answer(page, "board", "heltec-v3");
  await answer(page, "status", "running");
  await answer(page, "reflash", "no");
  await version(page, reply);
  await expectStep(page, "town");
}
