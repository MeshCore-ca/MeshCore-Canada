import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { proposalOperator } from "./activation-helpers.mjs";
import "../../docs/assets/regions/modules/iata-scopes.js";

const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));
const boundaries = JSON.parse(readFileSync("docs/assets/regions/iata-boundaries.geojson", "utf8"));
const engine = globalThis.MeshCoreIataScopes;
const onqc = catalog.seeds.filter(seed => seed.provinces.some(p => catalog.policy.meshScopes.onqc.includes(p)));
const place = (name, province, lat, lng) => ({ key: "geonames", category: "City", name, province, lat, lng });
const belleville = place("Belleville", "Ontario", 44.163, -77.383);
const geocoder = "https://geolocator.api.geo.ca/**";

async function search(page, value) {
  await page.locator('[data-scp-place]').fill(value);
  await page.locator('[data-scp-place]').press("Enter");
}
async function noCommands(page) {
  await expect(page.locator('[data-scp-output] code')).toHaveCount(0);
  await expect(page.locator('[data-scp-result]')).toBeHidden();
}

for (const locale of ["", "fr/"]) {
  const route = siteRoute(`/${locale}proposals/onqc-scopes/`);
  test(`${locale || "en/"} proposal lists every ON/QC region and shares exact YTR settings`, async ({ page }) => {
    const requests = [];
    page.on("request", request => { if (/geolocator|iata-boundaries|scope-jurisdictions/.test(request.url())) requests.push(request.url()); });
    await page.goto(route);
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await noCommands(page);
    expect(await page.locator('[data-scp-area] option[data-city]').evaluateAll(options => options.map(o => o.value).sort())).toEqual(
      onqc.flatMap(seed => seed.provinces.filter(p => ["on", "qc"].includes(p)).map(p => `${seed.tag}:${p}`)).sort()
    );
    expect(await page.locator('[data-scp-extra] option').evaluateAll(options => options.map(o => o.value).filter(Boolean).sort())).toEqual(onqc.map(seed => seed.tag).sort());
    await search(page, "YTR");
    await expect(page.locator('[data-scp-area]')).toHaveValue("ytr:on");
    await expect(page.locator('[data-scp-region-name]')).toHaveText("Quinte West (YTR) · Ontario");
    await expect(page.locator('[data-scp-tags] .scp-tag')).toHaveText(["ytr", "on", "onqc", "can", "na"]);
    await proposalOperator(page);
    for (const version of ["110", "114", "115", "116"]) {
      await page.locator('[data-scp-firmware]').selectOption(version);
      const fw = {110:"1.10",114:"1.14",115:"1.15",116:"1.16"}[version];
      await expect(page.locator('[data-scp-output="region"] code')).toHaveText(engine.commands(engine.profile(catalog, { activation: "activate", home:"ytr",province:"on"}), fw).concat("region save"));
      await expect(page.locator('[data-scp-output="standard"] code')).toHaveText(engine.standardCommands(fw));
    }
    await page.locator('[data-scp-type]').selectOption("edge");
    await page.locator('[data-scp-activate]').check();
    await expect(page.locator('[data-scp-extra] option[value="ytr"]')).toHaveJSProperty("disabled", true);
    await page.locator('[data-scp-extra]').selectOption("ygk");
    await page.locator('[data-scp-activate]').check();
    const commands = engine.commands(engine.profile(catalog, { activation: "activate", home:"ytr",province:"on",bridge:true,cities:["ygk"]}), "1.16").concat("region save");
    await expect(page.locator('[data-scp-output="region"] code')).toHaveText(commands);
    await expect(page.locator('[data-scp-map]')).toHaveAttribute("href", new RegExp(`/${locale}config/map/\\?tag=ytr&province=on$`));
    const share = await page.locator('[data-scp-share]').getAttribute("href");
    expect(Object.fromEntries(new URL(share).searchParams)).toEqual({tag:"ytr",province:"on",role:"repeater",firmware:"116",type:"edge",activation:"activate",neighbour:"ygk"});
    expect(new URL(share).hash).toBe("#your-region");
    await page.goto(share);
    await page.locator('[data-scp-activate]').check();
    await expect(page.locator('[data-scp-output="region"] code')).toHaveText(commands);
    await page.locator('[data-scp-result] a.md-button').click();
    await expect(page).toHaveURL(new RegExp(locale ? "#etape-4-reglages-de-region$" : "#step-4-region-settings$"));
    expect(requests).toEqual([]); // Manual/IATA choices need no geocoder or geometry.
    await expect(page.locator('#route-discovery')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });

  test(`${locale || "en/"} proposal resolves Belleville, Trenton and Gatineau without guessing provinces`, async ({ page }, testInfo) => {
    const rows = [belleville, place("Trenton","Ontario",44.099,-77.577), place("Gatineau","Québec",45.4765,-75.7013), place("Wingham","Ontario",43.8879,-81.3133)];
    await page.route(geocoder, route => {
      const requested = new URL(route.request().url()).searchParams.get("q");
      return route.fulfill({ json: rows.filter(row => row.name === requested) });
    });
    await page.goto(route);
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await proposalOperator(page,{activate:false});
    for (const [name, selection] of [["Belleville","ytr:on"],["Trenton","ytr:on"],["Gatineau","yow:qc"],["Wingham","ykf:on"]]) {
      await search(page, name);
      await expect(page.locator('[data-scp-area]')).toHaveValue(selection);
    }
    await expect(page.locator('[data-scp-region-source]')).toContainText(locale ? "Extension proposée" : "Proposed extension");
    await expect(page.locator('[data-scp-output="region"] code').first()).toContainText("ykf|* on|* onqc");
    const audit = await new AxeBuilder({page}).include('[data-scp-picker]').analyze();
    expect(audit.violations).toEqual([]);
    await search(page,"Belleville");
    await expect(page.locator('[data-scp-area]')).toHaveValue("ytr:on");
    await page.locator('[data-scp-picker]').screenshot({path:testInfo.outputPath("finder.png"),animations:"disabled"});
  });

  test(`${locale || "en/"} proposal requires a province or place choice and clears stale commands`, async ({ page }) => {
    await page.route(geocoder, route => route.fulfill({ json: [place("Cambridge","Ontario",43.397,-80.311), place("Cambridge Bay","Nunavut",69.113,-105.053)] }));
    await page.goto(route);
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await search(page,"YOW");
    await noCommands(page);
    await expect(page.locator('[data-scp-places] button')).toHaveCount(2);
    await page.locator('[data-scp-places] button').filter({hasText:"QC"}).click();
    await proposalOperator(page,{activate:false});
    await expect(page.locator('[data-scp-output="region"] code').first()).toContainText("yow|* qc|* onqc");
    await search(page, "Camb");
    await expect(page.locator('[data-scp-places] button')).toHaveCount(2);
    await noCommands(page);
    await page.locator('[data-scp-places] button').filter({hasText:"Nunavut"}).click();
    await expect(page.locator('[data-scp-status]')).toContainText(locale ? "hors du projet pilote" : "outside the ON/QC pilot");
    await noCommands(page);
    await search(page,"YYC");
    await noCommands(page);
    await search(page,"YOW, QC");
    await expect(page.locator('[data-scp-area]')).toHaveValue("yow:qc");
    await search(page,"YTR, QC");
    await noCommands(page);
  });

  test(`${locale || "en/"} proposal offers Quinte aliases during outages and ignores cancelled lookups`, async ({ page }) => {
    await page.route(geocoder, route => route.abort());
    await page.goto(route);
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await search(page,"Quinte");
    await expect(page.locator('[data-scp-places] button')).toHaveCount(1);
    await noCommands(page);
    await page.locator('[data-scp-places] button').click();
    await expect(page.locator('[data-scp-area]')).toHaveValue("ytr:on");
    await proposalOperator(page,{activate:false});
    await page.unroute(geocoder);
    let release;
    const held = new Promise(resolve => { release = resolve; });
    await page.route(geocoder, async route => { await held; await route.fulfill({json:[belleville]}); });
    const request = page.waitForRequest(geocoder);
    await search(page,"Belleville");
    await request;
    await page.locator('[data-scp-area]').selectOption("ygk:on");
    release();
    await expect(page.locator('[data-scp-output="region"] code').first()).toContainText("ygk|* on|* onqc");
    expect(new URL(page.url()).searchParams.get("tag")).toBe("ygk");
    await page.locator('[data-scp-place]').fill("not found");
    await noCommands(page);
    expect(new URL(page.url()).searchParams.has("tag")).toBe(false);
    await page.unroute(geocoder);
    await page.route(geocoder, route => route.fulfill({json:[]}));
    await page.locator('[data-scp-place]').press("Enter");
    await expect(page.locator('[data-scp-status]')).toContainText(locale ? "Aucun lieu trouvé" : "No place found");
    await noCommands(page);
    await page.locator('[data-scp-area]').selectOption("ysb:on");
    await expect(page.locator('[data-scp-region-source]')).toContainText(locale ? "Région proposée" : "Proposed MeshCore Canada region");
  });

  test(`${locale || "en/"} proposal never assigns a nearest zone across a boundary gap or overlap`, async ({ page }) => {
    await page.route(geocoder, route => route.fulfill({json:[belleville]}));
    const ytr = boundaries.features.find(f => f.properties.tag === "ytr" && f.properties.regionSource === "meshmapper");
    const overlap = structuredClone(ytr); overlap.properties.tag = "ygk";
    await page.route("**/iata-boundaries.geojson?*", route => route.fulfill({json:{type:"FeatureCollection",features:[ytr,overlap]}}));
    await page.goto(route);
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await search(page,"Belleville");
    await expect(page.locator('[data-scp-places] button')).toHaveCount(2);
    await noCommands(page);
    await page.locator('[data-scp-places] button').filter({hasText:"YTR"}).click();
    await expect(page.locator('[data-scp-area]')).toHaveValue("ytr:on");
    await page.unroute("**/iata-boundaries.geojson?*");
    await page.route("**/iata-boundaries.geojson?*", route => route.fulfill({json:{type:"FeatureCollection",features:[]}}));
    await page.reload();
    await expect(page.locator('[data-scp-picker]')).toBeVisible();
    await search(page,"Belleville");
    await expect(page.locator('[data-scp-status]')).toContainText(locale ? "Aucune région répertoriée" : "No listed region");
    await noCommands(page);
  });
}
