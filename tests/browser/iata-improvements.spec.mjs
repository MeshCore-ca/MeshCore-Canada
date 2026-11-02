import { test, expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { readFileSync } from "node:fs";
import { PHONE_ROUTE, T, choose, codes, expectStep, nextButton, nextUntil, openLink, phoneLink, plain, step, toolRoot, commandLines } from "./setup-helpers.mjs";
const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  for (const [lat, lon, tag, town] of [[43.8678, -81.2619, "ykf", "Wingham"], [45.4765, -75.7013, "yow", "Ottawa"]]) test(`${locale || "en/"} ${tag} boundary location asks for the role, and a city repeater passes unlabelled messages`, async ({ page }) => {
    await openLink(page, `${toolRoot(lang)}?${PHONE_ROUTE}&tag=${tag}&province=on&town=${town}&lat=${lat}&lon=${lon}`, { to: "role" });
    // Nothing is chosen for the person: neither card starts picked, and Next waits.
    await expect(step(page).locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await page.locator("[data-setup-help]").click();
    await expect(page.locator("[data-setup-help-text]")).toContainText(T("role.help", lang).split(/(?<=[.!?])\s/)[0]);
    await choose(page, "city");
    await nextUntil(page, "name");
    await page.locator("[data-setup-name]").fill(`${town}_R1`);
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain(`region def ${tag}|* on|* onqc|* can|* na`);
    expect(lines).toContain("region allowf *");
    expect(lines).not.toContain("region denyf *");
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

  test(`${locale || "en/"} a pasted region list removes old names one by one, stays on the page and clears on edit`, async ({ page }) => {
    await openLink(page, phoneLink("yow", "on", { lang }));
    const requests = [];
    page.on("request", request => requests.push(request.url() + " " + (request.postData() || "")));
    const removals = async () => (await codes(page).allTextContents()).filter(line => line.startsWith("region remove"));
    await page.locator("[data-setup-reply]").fill("* F\n legacy-private F\n  yow^ F\n obsolete F");
    // Deepest first; nothing is kept back for the new list to rely on.
    await expect.poll(removals).toEqual(["region remove yow", "region remove legacy-private", "region remove obsolete"]);
    expect(requests.some(request => request.includes("legacy-private"))).toBeFalsy();
    expect(page.url()).not.toContain("legacy-private");
    await page.locator("[data-setup-reply]").fill("bad reply");
    await expect.poll(removals).toEqual([]);
    await expect(page.locator("[data-setup-reply-status]")).toHaveText(plain("region.unreadable", lang));
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
}
