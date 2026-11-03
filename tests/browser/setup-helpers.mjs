import { readFileSync } from "node:fs";
import vm from "node:vm";
import { expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

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
  "150 Mile House": [row("150 Mile House", "British Columbia", 52.1055556, -121.9277778, "Community")],
  "Picton": [row("Picton", "Ontario", 44.0061111, -77.1436111, "Community")],
  // A spot no region covers (Seattle's coordinates, given a Canadian province so the search keeps it).
  "Faraway": [row("Faraway", "British Columbia", 47.6062, -122.3321)]
};

// Street-address replies (`keys=locate`). A civic address is tagged INTERPOLATED_POSITION; the
// same reply carries towns, lakes and whole streets, which the tool leaves out.
const locate = (name, province, lat, lng, tag = "INTERPOLATED_POSITION", category = "Street") => ({ key: "locate", category, name, province, lat, lng, bbox: null, tag: [tag] });
export const ADDRESSES = {
  "111 Wellington Street, Ottawa": [
    locate("111 Wellington Street, City Of Ottawa, Ontario", "Ontario", 45.42312333800001, -75.698764764),
    locate("Guelph, Wellington, Ontario (City)", "Ontario", 43.5339991, -80.2316544, "LOCATION", "City")
  ],
  "1 Rue Notre-Dame Est, Montréal": [
    locate("1 Rue Notre-Dame Est, Lorrainville, Quebec", "Quebec", 47.353875, -79.3534323),
    locate("1 Rue Notre-Dame Est, Montréal, Quebec", "Quebec", 45.5065186, -73.5554019)
  ],
  // No town typed: both are what was typed.
  "1 Rue Notre-Dame Est": [
    locate("1 Rue Notre-Dame Est, Lorrainville, Quebec", "Quebec", 47.353875, -79.3534323),
    locate("1 Rue Notre-Dame Est, Montréal, Quebec", "Quebec", 45.5065186, -73.5554019)
  ],
  // Live: the only civic address the geocoder offers is in another street, town and province.
  "22 Oak Street, Picton": [locate("22 Picton Court, Winnipeg, Manitoba", "Manitoba", 49.83930382473434, -97.0846334605357)],
  // Same number, street name and town, but a Drive, not an Avenue.
  "5 Maple Avenue, Belleville": [locate("5 Maple Drive, City Of Belleville, Ontario", "Ontario", 44.18, -77.4)],
  // A town with a number in its name: only whole streets match, so the town search runs next.
  "150 Mile House": [locate("150 Mile Frontage Road, 150 Mile House, British Columbia", "British Columbia", 52.1063076, -121.9285773, "INTERPOLATED_CENTROID")]
};

// Answers town searches from `places` and street-address searches from `addresses`.
// Returns the queries asked, in order; an address search is listed as "locate:<query>".
export async function mockGeocoder(page, places = PLACES, addresses = ADDRESSES) {
  const queries = [];
  await page.route("https://geolocator.api.geo.ca/**", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const query = params.get("q");
    if (params.get("keys") === "locate") {
      queries.push(`locate:${query}`);
      return route.fulfill({ json: addresses[query] || [] });
    }
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
// Answers the firmware question ("1.14", "1.15" or "1.16"). Only a board that is left as it is is asked.
export async function version(page, firmware) {
  await expectStep(page, "version");
  await choose(page, firmware);
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
// The map location step, after the name: the pin starts where the town step found the place (or in the
// middle of the region), so Next is ready as it is.
export const pinBox = (page, axis) => page.locator(`[data-setup-pin="${axis}"]`);
export async function location(page) {
  await expectStep(page, "location");
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

// A running repeater changed from the phone: no flash steps and no radio line.
export const PHONE_ROUTE = "type=repeater&board=esp32&status=running&reflash=0";
export const toolRoot = (lang) => (lang === "fr" ? "/fr/config/" : "/config/");
// A phone-route link for a region that holds every answer a link can carry. `extra` is more
// answers as a query string, for example "neighbours=yul". Open it with openLink.
export function phoneLink(tag, province, { lang = "en", role = "city", extra = "" } = {}) {
  return `${toolRoot(lang)}?${PHONE_ROUTE}&tag=${tag}&province=${province}&role=${role}&name=Test_R1${extra ? `&${extra}` : ""}`;
}
// A link never carries the firmware version, so a phone-route link opens on the version question
// at the latest. This opens it, picks `firmware`, and presses Next until `to` (the commands,
// unless said otherwise).
export async function openLink(page, path, { firmware = "1.16", to = "commands" } = {}) {
  await page.goto(siteRoute(path));
  await version(page, firmware);
  await nextUntil(page, to);
}
// Types the first answers of the phone route, ending on the town step.
export async function startPhoneRoute(page, firmware = "1.16") {
  await answer(page, "type", "repeater");
  await answer(page, "board", "esp32");
  await answer(page, "status", "running");
  await answer(page, "reflash", "no");
  await version(page, firmware);
  await expectStep(page, "town");
}
