import { test, expect } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { readFileSync } from "node:fs";
import { PHONE_ROUTE, T, choose, codes, nextButton, nextUntil, openLink, phoneLink, plain, step, toolRoot, commandLines } from "./setup-helpers.mjs";
import { title, where } from "./zone-map-helpers.mjs";
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

  test(`${locale || "en/"} a region link still reaches the community directory, the start pages, the zone finder and the idea form`, async ({ page }) => {
    // The directory filtered to a region.
    await page.goto(siteRoute(`/${locale}provinces/?region=yow&province=qc`));
    await expect(page.locator('[data-community-card]:visible')).toHaveCount(catalog.profiles.yow.communities.length);
    await expect(page.locator('#directory-greater-ottawa-mesh-enthusiasts')).toBeVisible();
    await page.locator('[data-community-clear]').first().click();
    await expect(page.locator('[data-community-card]:visible')).toHaveCount(25);
    // A start page names the region, and its links lead to the setup tool and to the zone finder on that zone.
    await page.goto(siteRoute(`/${locale}start/companion/?region=yow&province=qc`));
    const banner = page.locator('[data-region-context]');
    await expect(banner).toContainText("YOW");
    await expect(banner.locator('a').last()).toHaveAttribute("href", /config\/\?tag=yow&province=qc/);
    await banner.getByRole("link", { name: locale ? "Voir la région" : "View region", exact: true }).click();
    await expect(title(page)).toHaveText("YOW · Ottawa–Gatineau");
    await expect(where(page)).toHaveText("Québec");
    // The idea form fills in the region it was opened for.
    await page.goto(siteRoute(`/${locale}submit-idea/?region=yow&request=maintainer`));
    await expect(page.locator('#submission-context')).toHaveValue(/IATA.*yow/i);
    await expect(page.locator('#submission-category')).toHaveValue("Regional community information");
  });
}
