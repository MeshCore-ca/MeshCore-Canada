import { expect, test } from "./site-fixtures.mjs";
import AxeBuilder from "@axe-core/playwright";
import { siteRoute } from "./site-route.mjs";
import { submissionSha256 } from "../../docs/config/editor/issue.js";
import { answer, choose, codes, confirmStep, expectStep, location, next, nextButton, nextUntil, openLink, phoneLink, startPhoneRoute, step, toolRoot, commandLines } from "./setup-helpers.mjs";

for (const locale of ["", "fr/"]) {
  const lang = locale ? "fr" : "en";
  test(`${locale || "en/"} region setup preserves radio on the phone route and asks a BC repeater to choose when flashing`, async ({ page }) => {
    // A running repeater keeps its radio: the phone route has no radio line, and the old mvrd code moves to yvr.
    await openLink(page, phoneLink("mvrd", "bc", { lang }));
    const phone = await commandLines(page);
    expect(phone).toContain("region def yvr|* bc|* can|* na");
    expect(phone.some((line) => line.startsWith("set radio"))).toBe(false);

    // Flashing writes the radio, and BC has two groups' settings, so nothing is picked for the person.
    await page.goto(siteRoute(`${toolRoot(lang)}?type=repeater&board=esp32&status=new&tag=mvrd&province=bc&role=city&name=Test_R1`));
    await confirmStep(page, "flash");
    await nextUntil(page, "radio");
    await expect(step(page).locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await choose(page, "bc-mesh");
    await nextUntil(page, "commands");
    let lines = await commandLines(page);
    expect(lines).toContain("set radio 910.425,62.5,7,5");
    expect(lines).toContain("set path.hash.mode 2");
    expect(lines).toContain("region def yvr|* bc|* can|* na");
    // Changing the answer changes the line.
    for (const id of ["location", "name", "role", "radio"]) {
      await page.locator("[data-setup-back]").click();
      await expectStep(page, id);
    }
    await choose(page, "canada");
    await nextUntil(page, "commands");
    lines = await commandLines(page);
    expect(lines).toContain("set radio 910.525,62.5,7,5");
    expect(lines).not.toContain("set radio 910.425,62.5,7,5");
  });

  test(`${locale || "en/"} map handoff migrates legacy city aliases without adding a second province`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/?tag=ott&province=on&type=large&regions=mtl&firmware=1.15`));
    const link = page.locator('[data-role="map-text-result"] .mcc-detail-actions a');
    await expect(link).toBeVisible();
    // Only the current region goes across: no legacy code, no extra regions, no firmware or role.
    expect(Object.fromEntries(new URL(await link.getAttribute("href")).searchParams)).toEqual({ tag: "yow", province: "on" });
    await link.click();
    await startPhoneRoute(page, "1.15");
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
    await expect(page.locator("[data-setup-region]")).toContainText("Ottawa");
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await page.locator("[data-setup-name]").fill("Ottawa_R1");
    await next(page);
    await location(page);
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("region put yow");
    expect(lines).not.toContain("region put qc");
    expect(lines.some((line) => line.startsWith("set radio"))).toBe(false);
  });

  test(`${locale || "en/"} map loads when visible and its keyboard shortcut stays out of the way`, async ({ page }, testInfo) => {
    const displayRequests = [];
    page.on("request", (request) => {
      if (request.url().includes("/iata-boundaries.geojson")) displayRequests.push(request.url());
    });
    await page.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({
      contentType: "image/png",
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    }));
    await page.goto(siteRoute(`/${locale}config/map/?tag=ott`));
    await expect(page.locator('[data-role="map-status"]')).toHaveText(locale ? "Région trouvée." : "Region found.");
    const shortcut = page.locator(".mcc-skip-map");
    await expect(shortcut).toHaveCSS("pointer-events", "none");
    await expect(page.locator('[data-role="map-region-table"]')).toBeEmpty();
    const panel = page.locator(".mcc-map-panel");
    expect(await panel.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBeTruthy();
    if (testInfo.project.name.startsWith("mobile-")) {
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      expect(displayRequests).toHaveLength(1); // Point lookup and map share one boundary download.
    }
    await page.locator(".mcc-map-stage").scrollIntoViewIfNeeded();
    await expect(page.locator('[data-role="map-loading"]')).toBeHidden();
    expect(displayRequests).toHaveLength(1);
    const marker = page.locator(".leaflet-marker-icon");
    await expect(marker).toBeVisible();
    await expect(marker).toHaveAttribute("src", /\/vendor\/leaflet\/images\/marker-icon(?:-2x)?\.png$/);
    await expect.poll(() => marker.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await shortcut.focus();
    await expect(shortcut).toHaveCSS("opacity", "1");
    await expect(shortcut).toHaveCSS("pointer-events", "auto");
    const contrast = await new AxeBuilder({ page }).include(".mcc-map-stage").withRules(["color-contrast"]).analyze();
    expect(contrast.violations).toEqual([]);
    await shortcut.press("Enter");
    await expect(page.locator("#mcc-region-list")).toHaveAttribute("open", "");
    await expect(page.locator('[data-role="table-filter"]')).toBeVisible();
  });

  for (const scheme of ["default", "slate"]) {
    test(`${locale || "en/"} ${scheme} focused map controls remain readable`, async ({ page }) => {
      await page.route("https://tile.openstreetmap.org/**", (route) => route.fulfill({
        contentType: "image/png",
        body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
      }));
      await page.goto(siteRoute(`/${locale}config/map/?tag=ott`));
      await expect(page.locator('[data-role="map-text-result"]')).toContainText("Ottawa");
      await page.locator(`input[data-md-color-scheme="${scheme}"]`).evaluate((element) => element.click());
      await page.locator(".mcc-map-stage").scrollIntoViewIfNeeded();
      await expect(page.locator(".mcc-map-stage")).toHaveAttribute("aria-busy", "false");
      const mapContrast = await new AxeBuilder({ page }).include(".mcc-map-stage").withRules(["color-contrast"]).analyze();
      expect(mapContrast.violations).toEqual([]);
      const find = page.locator('[data-action="map-locate"]');
      await find.focus();
      await find.hover();
      const results = await new AxeBuilder({ page }).include("[data-mcc-regions]").withRules(["color-contrast"]).analyze();
      expect(results.violations).toEqual([]);
      const background = await page.locator(".md-main").evaluate((element) => getComputedStyle(element).backgroundColor);
      // Region tools now use the shared site background, like the proposal.
      expect(background).toBe(scheme === "default" ? "rgb(246, 248, 251)" : "rgb(15, 22, 35)");
    });
  }

  test(`${locale || "en/"} broker reference works without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      await page.goto(siteRoute(`/${locale}analyzer/broker-reference/`));
      await expect(page.locator("#broker-reference-body tr")).toHaveCount(2);
      await expect(page.locator("#broker-reference-body")).toContainText("mqtt1.meshcore.ca");
      await expect(page.locator('article a[href*="data-collection-access/#read-only-mqtt-accounts"]')).toBeVisible();
    } finally { await context.close(); }
  });
}

test("language switch keeps selected region, radio, and commands step", async ({ page }) => {
  await page.goto(siteRoute("/config/?type=repeater&board=esp32&status=new&radio=bc-mesh&tag=yvr&province=bc&role=city&name=Test_R1"));
  await confirmStep(page, "flash");
  await nextUntil(page, "commands");
  await expect(codes(page)).toContainText(["set radio 910.425,62.5,7,5", "region def yvr|* bc|* can|* na"]);
  await page.locator(".md-select > button").click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  expect(new URL(page.url()).searchParams.has("firmware")).toBe(false);
  await expectStep(page, "commands");
  await expect(codes(page)).toContainText(["set radio 910.425,62.5,7,5", "region def yvr|* bc|* can|* na"]);
});

test("map tiles appear while a slow boundary overlay is still loading", async ({ page }) => {
  let releaseBoundary;
  const boundaryGate = new Promise(resolve => { releaseBoundary = resolve; });
  await page.route("**/iata-boundaries.geojson?*", async route => {
    await boundaryGate;
    await route.continue();
  });
  await page.route("https://tile.openstreetmap.org/**", route => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
  }));
  try {
    await page.goto(siteRoute("/config/map/?tag=ott"));
    await page.locator(".mcc-map-stage").scrollIntoViewIfNeeded();
    await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
    await expect(page.locator('[data-role="map-loading"]')).toBeHidden();
    await expect(page.locator('[data-role="map-boundary-status"]')).toBeVisible();
    releaseBoundary();
    await expect(page.locator(".mcc-map-stage")).toHaveAttribute("aria-busy", "false");
    await expect(page.locator('[data-role="map-boundary-status"]')).toBeHidden();
  } finally { releaseBoundary(); }
});

test("map retry restores the selected marker after a tile failure", async ({ page }) => {
  let tilesAvailable = false;
  await page.route("https://tile.openstreetmap.org/**", route => tilesAvailable ? route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
  }) : route.abort());
  await page.goto(siteRoute("/config/map/?tag=ott"));
  await page.locator(".mcc-map-stage").scrollIntoViewIfNeeded();
  const retry = page.locator('[data-action="load-map"]');
  await expect(retry).toBeVisible();
  tilesAvailable = true;
  await retry.click();
  await expect(page.locator(".mcc-map-stage")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
  await expect(page.locator('[data-role="map-text-result"]')).toContainText("Ottawa");
});

test("Québec city uses its actual coordinates and ambiguous legacy region codes offer choices", async ({ page }) => {
  let lookedUp = false;
  await page.route("https://geolocator.api.geo.ca/**", async (route) => {
    lookedUp = true;
    await route.fulfill({ json: [{ lat: "46.8139", lng: "-71.2080", name: "Québec", province: "Québec", key: "geonames", category: "Ville" }] });
  });
  await page.goto(siteRoute("/fr/config/map/"));
  const input = page.locator('[data-role="map-input"]');
  await input.fill("Québec");
  await page.locator('[data-action="map-locate"]').click();
  await expect(page.locator('[data-role="map-text-result"]')).toContainText("Québec");
  expect(lookedUp).toBeTruthy();
  await input.fill("capnat");
  await page.locator('[data-action="map-locate"]').click();
  const choices = page.locator('[data-role="map-status"] button');
  await expect(choices.first()).toBeVisible();
  expect(await choices.count()).toBeGreaterThan(1);
  await choices.first().click();
  await expect(page.locator('[data-role="map-text-result"]')).toBeVisible();
});

test("feedback remembers its page and accepts a title and description", async ({ page }) => {
  await page.goto(siteRoute("/start/repeater/"));
  await page.locator(".mc-page-feedback a").click();
  await expect(page.locator('input[name="source_page"]')).toHaveValue("https://meshcore.ca/start/repeater/");
  await page.locator("#submission-summary").fill("Clarify one instruction");
  await page.locator("#submission-need").fill("The step needs a clearer example.");
  await page.locator("#submission-public").check();
  await page.locator("#review-submission").click();
  await expect(page.locator("#submission-preview")).toContainText("https://meshcore.ca/start/repeater/");
  await expect(page.locator("#submission-error-summary")).toBeHidden();
});

for (const locale of ["", "fr/"]) {
  for (const modernGateway of [true, false]) {
    test(`${locale || "en/"} short feedback ${modernGateway ? "submits to a compatible gateway" : "offers a safe older-gateway fallback"}`, async ({ page }) => {
      let posted = null;
      await page.addInitScript(() => {
        window.turnstile = { render(_container, options) { setTimeout(() => options.callback("fixture-token"), 0); return "fixture"; }, reset() {} };
      });
      await page.route("https://api.meshcore.ca:21323/api/meshcore-canada/submissions**", async (route) => {
        const request = route.request();
        if (request.method() === "GET") return route.fulfill({ json: {
          version: 1, turnstileSiteKey: "fixture-site-key", turnstileAction: "meshcore_submission",
          ...(modernGateway ? { communityIdeaOptionalDetails: true } : {})
        } });
        posted = request.postDataJSON().submission;
        return route.fulfill({ json: { ok: true, issueNumber: 123, issueUrl: "https://github.com/MeshCore-ca/MeshCore-Canada/issues/123",
          submissionSha256: await submissionSha256(posted), duplicate: false } });
      });
      await page.goto(siteRoute(`/${locale}start/repeater/`));
      await page.locator(".mc-page-feedback a").click();
      await expect(page.locator('input[name="source_page"]')).toHaveValue(`https://meshcore.ca/${locale}start/repeater/`);
      await page.locator("#submission-summary").fill("Clarify one instruction");
      await page.locator("#submission-need").fill("The step needs a clearer example.");
      await page.locator("#submission-public").check();
      await page.locator("#review-submission").click();
      if (modernGateway) {
        await page.locator("#submit-community-idea").click();
        await expect(page.locator("#submission-result")).toHaveAttribute("data-state", "success");
        expect(posted.experience).toBe("");
        expect(posted.idea).toBe("");
        expect(posted.sourcePage).toBe(`https://meshcore.ca/${locale}start/repeater/`);
      } else {
        await expect(page.locator("#submission-anti-spam-status")).toHaveAttribute("data-state", "error");
        await expect(page.locator("#submit-community-idea")).toBeDisabled();
        await expect(page.locator("#open-github-submission")).toHaveAttribute("href", /github.com/);
        expect(posted).toBeNull();
      }
    });
  }
}
