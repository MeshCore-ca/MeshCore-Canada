import { expect, test } from "./site-fixtures.mjs";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { siteRoute } from "./site-route.mjs";

const communityCount = JSON.parse(
  readFileSync(new URL("../../data/communities.json", import.meta.url), "utf8"),
).communities.length;
const overview = { activeObservers: 12, activeIatas: 4, totalPackets: 900, windowHours: 24 };
const types = [{ nodeType: 2, count: 50 }, { nodeType: 1, count: 20 }, { nodeType: 3, count: 3 }, { nodeType: 4, count: 2 }];

async function mockNetwork(page, requests = []) {
  await page.route("https://dev.meshcore.ca/api/v1/stats/**", route => {
    requests.push(route.request().url());
    return route.fulfill({ json: route.request().url().endsWith("overview") ? overview : types });
  });
}

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} Cambridge finds nearby communities without a matching listing`, async ({ page }) => {
    await mockNetwork(page);
    const lookups = [];
    await page.route("https://geolocator.api.geo.ca/**", route => {
      lookups.push(route.request().url());
      return route.fulfill({ json: [
        { key: "geonames", name: "Cambridge Bay", province: "Nunavut", category: "Hamlet", lat: 69.113889, lng: -105.05278 },
        { key: "geonames", name: "Cambridge", province: "Ontario", category: locale ? "Ville" : "City", lat: 43.397222, lng: -80.311389 }
      ] });
    });
    await page.goto(siteRoute(`/${locale}provinces/`));
    await expect(page.locator(".mc-page-status")).toHaveCount(0);
    await expect(page.locator(".admonition.note")).toContainText(locale ? "Ces renseignements pourraient être périmés" : "This information could be out of date!");
    await page.locator("#community-search").fill("Cambridge");
    expect(lookups).toHaveLength(0);
    await page.locator("#community-search").press("Enter");
    await expect(page.locator("[data-community-count]")).toContainText("5");
    await expect(page.locator("[data-community-count]")).toContainText("Cambridge, Ontario");
    const cards = page.locator("[data-community-card]:visible");
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toHaveAttribute("id", "directory-gta-lora-meshes");
    await expect(cards.first().locator("[data-community-distance]")).toContainText("km");
    const query = new URL(lookups[0]);
    expect(query.searchParams.get("keys")).toBe("geonames");
    expect(query.searchParams.get("lang")).toBe(locale ? "fr" : "en");
    await page.locator("[data-community-show-all]").click();
    await expect(cards).toHaveCount(communityCount);
    await page.locator("[data-community-clear]").first().click();
    await expect(page.locator("#community-search")).toHaveValue("");
    await expect(cards).toHaveCount(communityCount);
    await expect(cards.first()).toHaveAttribute("id", "directory-bc-mesh");
    expect(lookups).toHaveLength(1);
  });

  test(`${locale || "en/"} city lookup failure keeps ordinary directory filters usable`, async ({ page }) => {
    await mockNetwork(page);
    await page.route("https://geolocator.api.geo.ca/**", route => route.abort());
    await page.goto(siteRoute(`/${locale}provinces/`));
    await page.locator("#community-search").fill("Cambridge");
    await page.locator("[data-community-locate]").click();
    await expect(page.locator("[data-community-lookup]")).toContainText(locale ? "indisponible" : "unavailable");
    await page.locator("[data-community-clear]").first().click();
    await page.locator("#community-search").fill("YQL");
    await expect(page.locator("[data-community-card]:visible")).toHaveCount(1);
    await expect(page.locator("[data-community-card]:visible")).toContainText("YQLMesh");
  });

  test(`${locale || "en/"} homepage motif and first-step browsing links remain accessible`, async ({ page }) => {
    await mockNetwork(page);
    await page.goto(siteRoute(`/${locale}`));
    const hero = page.locator(".mc-home-hero");
    await expect(hero).toBeVisible();
    await expect.poll(() => hero.locator("img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    expect((await hero.boundingBox()).height).toBeLessThan(300);
    await expect(page.locator(".mc-preset-note")).toContainText(locale ? "3 octets" : "3-byte");
    await page.goto(siteRoute(`/${locale}hardware/`));
    await expect(page.locator(".mc-guide-status")).toHaveCount(0);
    await page.goto(siteRoute(`/${locale}config/`));
    const step = page.locator('[data-wizard-step="1"]');
    const map = step.locator('[data-action="view-map"]');
    const editor = step.locator('a[href*="/config/editor/"]');
    await expect(map).toBeVisible();
    await expect(editor).toBeVisible();
    await expect(map).toHaveAttribute("href", new RegExp(`/${locale}config/map/$`));
    await expect(editor).toHaveAttribute("href", new RegExp(`/${locale}config/editor/$`));
  });

  test(`${locale || "en/"} compact header totals are cached, readable, and keyboard accessible`, async ({ page }) => {
    const requests = [];
    await mockNetwork(page, requests);
    await page.goto(siteRoute(`/${locale}`));
    const network = page.locator("[data-network-summary]");
    await expect(network).toHaveAttribute("data-network-state", "ready");
    await expect(network.locator("[data-network-total]")).toHaveText("75");
    await network.locator("summary").focus();
    await network.locator("summary").press("Enter");
    await expect(network).toHaveAttribute("open", "");
    await expect(network.locator('[data-network-count="repeaters"]')).toHaveText("50");
    await expect(network.locator('[data-network-count="observers"]')).toHaveText("12");
    for (const scheme of ["default", "slate"]) {
      await page.locator(`input[data-md-color-scheme="${scheme}"]`).evaluate(element => element.click());
      const result = await new AxeBuilder({ page }).include("[data-network-summary]").withRules(["color-contrast"]).analyze();
      expect(result.violations).toEqual([]);
    }
    await network.locator("summary").focus();
    await network.locator("summary").press("Escape");
    await expect(network).not.toHaveAttribute("open", "");
    await page.goto(siteRoute(`/${locale}hardware/`));
    await expect(page.locator("[data-network-summary]")).toHaveAttribute("data-network-state", "ready");
    expect(requests).toHaveLength(2);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBeFalsy();
  });
}

test("unavailable header statistics never appear as zero active devices", async ({ page }) => {
  await page.route("https://dev.meshcore.ca/api/v1/stats/**", route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto(siteRoute("/"));
  const network = page.locator("[data-network-summary]");
  await expect(network).toHaveAttribute("data-network-state", "unavailable");
  await network.locator("summary").click();
  await expect(network.locator("[data-network-total]")).toHaveText("—");
  await expect(network.locator('[data-network-count="repeaters"]')).toHaveText("—");
  await expect(network.locator('a[href="https://dev.meshcore.ca/"]')).toBeVisible();
});
