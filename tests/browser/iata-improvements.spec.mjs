import { test, expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { readFileSync } from "node:fs";
import "../../docs/assets/regions/modules/iata-scopes.js";
const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} ambiguous city search asks for the province and respects the choice`, async ({ page }) => {
    await page.route("https://geolocator.api.geo.ca/**", route => route.fulfill({ json: [
      { key:"geonames", name:"Saint-Jean", province:"Québec", category:"Ville", lat:45.307,lng:-73.262 },
      { key:"geonames", name:"Saint-Jean", province:"New Brunswick", category:"City", lat:45.273,lng:-66.063 },
      { key:"geonames", name:"Saint-Jean", province:"Newfoundland and Labrador", category:"City", lat:47.56,lng:-52.71 }
    ] }));
    await page.goto(siteRoute(`/${locale}config/map/`));
    const input=page.locator('[data-role="map-input"]');
    await input.fill("Saint-Jean"); await page.locator('[data-action="map-locate"]').click();
    await expect(page.locator('[data-role="map-status"] button')).toHaveCount(3);
    await page.locator('[data-role="map-status"] button').filter({hasText:"New Brunswick"}).click();
    const result=page.locator('[data-role="map-text-result"]');
    await expect(result).toContainText("ysj");
    await input.fill("Saint-Jean, QC"); await page.locator('[data-action="map-locate"]').click();
    await expect(result).toContainText("yul");
    await expect(result.locator('.mcc-detail-actions a')).toHaveAttribute("href",/province=qc/);
  });

  test(`${locale || "en/"} migration requires removal review, stays local and clears on edit`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&step=4&instructions=technical`));
    const panel=page.locator('[data-scope-migration]');
    await panel.locator("summary").click();
    const requests=[]; page.on("request", request=>requests.push(request.url()+" "+(request.postData()||"")));
    await panel.locator('[data-migration-input]').fill("* F\n legacy-private F\n  yow^ F\n obsolete F");
    await panel.locator('[data-migration-default]').fill("default scope is yow");
    await panel.locator('[data-migration-check]').click();
    await expect(panel.locator('[data-migration-report]')).toContainText("legacy-private, obsolete");
    await expect(panel.locator('[data-migration-commands]')).toBeHidden();
    await panel.locator('[data-migration-review] input').check();
    await expect(panel.locator('[data-migration-commands]')).toHaveValue(/region put yow\nregion remove legacy-private\nregion remove obsolete/);
    expect(requests.some(request=>request.includes("legacy-private"))).toBeFalsy();
    await panel.locator('[data-migration-input]').fill("* F\n ...");
    await expect(panel.locator('[data-migration-copy]')).toBeHidden();
    await panel.locator('[data-migration-check]').click();
    await expect(panel.locator('[data-migration-status]')).not.toBeEmpty();
    await expect(panel.locator('[data-migration-review]')).toBeHidden();
  });

  test(`${locale || "en/"} region profile carries contact, role and contribution context`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/?tag=yow&province=qc`));
    const profile=page.locator('[data-role="map-text-result"] .mc-region-profile');
    await expect(profile).toContainText(locale ? "Non confirmés localement" : "Not locally confirmed");
    await expect(profile).toContainText("Greater Ottawa");
    await profile.locator('a[href*="provinces/?region=yow"]').click();
    await expect(page.locator('[data-community-card]:visible')).toHaveCount(catalog.profiles.yow.communities.length);
    await expect(page.locator('#directory-greater-ottawa-mesh-enthusiasts')).toBeVisible();
    await page.locator('[data-community-clear]').first().click();
    await expect(page.locator('[data-community-card]:visible')).toHaveCount(25);
    await page.goto(siteRoute(`/${locale}start/companion/?region=yow&province=qc`));
    await expect(page.locator('[data-region-context]')).toContainText("YOW");
    await expect(page.locator('[data-region-context] a').last()).toHaveAttribute("href",/config\/\?tag=yow&province=qc/);
    await page.goto(siteRoute(`/${locale}submit-idea/?region=yow&request=maintainer`));
    await expect(page.locator('#submission-context')).toHaveValue(/IATA.*yow/i);
    await expect(page.locator('#submission-category')).toHaveValue("Regional community information");
  });

  test(`${locale || "en/"} proposal picker shares commands and keeps static examples on failure`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
    const picker=page.locator('[data-scp-picker]'); await expect(picker).toBeVisible();
    const home=await picker.locator('[data-scp-area]').evaluate(select=>({home:select.selectedOptions[0].dataset.city,province:select.selectedOptions[0].dataset.province}));
    for(const [value,firmware] of [["116","1.16"],["115","1.15"],["114","1.14"],["110","1.10"]]) {
      await picker.locator('[data-scp-firmware]').selectOption(value);
      for(const bridge of [false,true]) {
        await picker.locator('[data-scp-type]').selectOption(bridge ? "edge" : "city");
        if (bridge) await picker.locator('[data-scp-extra]').selectOption("");
        const expected=globalThis.MeshCoreIataScopes.commands(globalThis.MeshCoreIataScopes.profile(catalog,{...home,bridge}),firmware).concat(["region save"]);
        await expect(page.locator('[data-scp-output="region"]').first().locator("code")).toHaveText(expected);
      }
    }
    await page.route("**/iata-regions.json",route=>route.abort());
    await page.reload(); await expect(page.locator("html")).not.toHaveClass(/scp-js/);
    await expect(page.locator('[data-scp-nojs]').first()).toBeVisible();
  });
}
