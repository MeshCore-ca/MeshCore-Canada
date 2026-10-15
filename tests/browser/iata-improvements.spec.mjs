import { test, expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { activateConfig } from "./activation-helpers.mjs";
import { readFileSync } from "node:fs";
import "../../docs/assets/regions/modules/iata-scopes.js";
const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));

for (const locale of ["", "fr/"]) {
  for (const [lat, lon, tag] of [[43.8678, -81.2619, "ykf"], [45.4765, -75.7013, "yow"]]) test(`${locale || "en/"} ${tag} boundary location stays city mode unless explicitly changed`, async ({ page }) => {
      await page.goto(siteRoute(`/${locale}config/?lat=${lat}&lon=${lon}&step=3&instructions=technical`));
      const step = page.locator('[data-wizard-step="3"]');
      await expect(step).toBeVisible();
      await expect(step.getByRole("radio", { name: locale ? "Répéteur de ville" : "City repeater" })).toBeChecked();
      await expect(step.locator('[data-role="repeater-type-help"]')).toContainText(locale ? "limite extérieure" : "outer boundary");
      await expect(step).toContainText(locale ? "même code IATA" : "same IATA code");
      await activateConfig(page);
      await step.locator('[data-next-step]').click();
      const result = page.locator('[data-role="result"]');
      await expect(result).toContainText(`region def ${tag}|*`);
      await expect(result).toContainText("region allowf *");
      await expect(result).not.toContainText("region denyf *");
  });
  test(`${locale || "en/"} edge bookmarks retain their role and require coordinated activation`, async ({ page }) => {
    // Preserve existing edge-mode bookmarks; an extra city scope is optional.
    await page.goto(siteRoute(`/${locale}config/?tag=yow&province=on&type=large&step=3&instructions=technical`));
    const step = page.locator('[data-wizard-step="3"]');
    await expect(step.getByRole("radio", { name: locale ? "Répéteur de bordure" : "Edge repeater" })).toBeChecked();
    await activateConfig(page);
    await step.locator('[data-next-step]').click();
    await expect(page.locator('[data-role="result"]')).toContainText("region def yow|* on|* onqc|* can|* na");
    await expect(page.locator('[data-role="result"]')).toContainText("region denyf *");
  });

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
    await activateConfig(page);
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

  for(const [value,firmware] of [["116","1.16"],["115","1.15"],["114","1.14"],["110","1.10"]]) for(const bridge of [false,true]) test(`${locale || "en/"} proposal ${firmware} ${bridge ? "edge" : "city"} commands use the shared generator`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/?tag=yow&province=on&role=repeater&firmware=${value}&type=${bridge ? "edge" : "city"}&activation=activate`));
    const picker=page.locator('[data-scp-picker]'); await expect(picker).toBeVisible();
    await expect(picker.locator('[data-scp-area]')).toHaveValue("yow:on");
    await expect(picker.locator('[data-scp-firmware]')).toHaveValue(value);
    await expect(picker.locator('[data-scp-type]')).toHaveValue(bridge ? "edge" : "city");
    await expect(picker.locator('[data-scp-activate]')).not.toBeChecked();
    await expect(page.locator('[data-scp-output="region"] code')).toHaveCount(0);
    const home=await picker.locator('[data-scp-area]').evaluate(select=>({home:select.selectedOptions[0].dataset.city,province:select.selectedOptions[0].dataset.province}));
    if (bridge) await expect(picker.locator('[data-scp-extra]')).toHaveValue("");
    await picker.locator('[data-scp-activate]').check();
    const expected=globalThis.MeshCoreIataScopes.commands(globalThis.MeshCoreIataScopes.profile(catalog,{ activation: "activate", ...home,bridge}),firmware).concat(["region save"]);
    await expect(page.locator('[data-scp-output="region"]').first().locator("code")).toHaveText(expected);
  });

  test(`${locale || "en/"} proposal keeps role guidance and static examples on catalogue failure`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}proposals/onqc-scopes/`));
    const picker=page.locator('[data-scp-picker]'); await expect(picker).toBeVisible();
    await expect(picker.locator('[data-scp-type]')).toContainText(locale ? "répéteur de bordure" : "edge repeater");
    const guidance = page.locator('.mc-callout').filter({ hasText: locale ? "Ville ou bordure?" : "City or edge?" });
    await expect(guidance).toContainText(locale ? "limite extérieure" : "outer edge");
    await expect(guidance).toContainText(locale ? "même code IATA" : "same IATA code");
    await page.route("**/iata-regions.json",route=>route.abort());
    await page.reload(); await expect(page.locator("html")).not.toHaveClass(/scp-js/);
    await expect(page.locator('[data-scp-nojs]').first()).toBeVisible();
  });
}
