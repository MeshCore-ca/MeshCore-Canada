import { expect, test } from "./site-fixtures.mjs";
import AxeBuilder from "@axe-core/playwright";
import { siteRoute } from "./site-route.mjs";
import { submissionSha256 } from "../../docs/config/editor/issue.js";

for (const locale of ["", "fr/"]) {
  test(`${locale || "en/"} region setup preserves radio until explicitly selected`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=mvrd&step=4`));
    const result = page.locator('[data-role="result"]');
    await expect(result).toContainText("region def yvr|* bc|* can");
    await expect(result).not.toContainText("set radio");
    await expect(result).not.toContainText("set path.hash.mode");
    await page.locator('[data-go-step="3"]').click();
    await page.locator("#mcc-radio-profile").selectOption("bc-mesh");
    await page.locator("#mcc-hash-mode").selectOption("2");
    await expect(page.locator('[data-action="view-map"]').first()).toHaveAttribute("href", /radio=bc-mesh&hash=2/);
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    await expect(result).toContainText("set radio 910.425,62.5,7,5");
    await expect(result).toContainText("set path.hash.mode 2");
    await expect(page.locator('[data-role="review-summary"]')).toContainText("910.425");
    await page.locator('[data-go-step="3"]').click();
    await page.locator("#mcc-radio-profile").selectOption("canada");
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    await expect(result).toContainText("set radio 910.525,62.5,7,5");
  });

  test(`${locale || "en/"} map handoff migrates legacy city aliases without adding a second province`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/map/?tag=ott&province=on&type=large&regions=mtl&firmware=1.15`));
    const link = page.locator('[data-role="map-text-result"] .mcc-detail-actions a');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator('[data-role="selected-region"]')).toContainText("Ottawa");
    await page.locator('[data-wizard-step="3"] [data-next-step]').click();
    const result = page.locator('[data-role="result"]');
    await expect(result).toContainText("region put yow");
    await expect(result).not.toContainText("region put qc");
    await expect(result).toContainText("region put yul");
    await expect(result).not.toContainText("set radio");
  });

  test(`${locale || "en/"} invalid saved location offers recovery instead of commands`, async ({ page }) => {
    await page.goto(siteRoute(`/${locale}config/?tag=unknown&lat=999&lon=0`));
    await expect(page.locator('[data-role="status"]')).toHaveText(/invalid|invalide/);
    await expect(page.locator('[data-go-step="4"]')).toBeDisabled();
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

test("language switch keeps selected region, firmware, radio, and review step", async ({ page }) => {
  await page.goto(siteRoute("/config/?tag=mvrd&step=4&firmware=1.15&radio=bc-mesh&hash=2"));
  await expect(page.locator('[data-role="result"]')).toContainText("set radio 910.425");
  await page.locator(".md-select > button").click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator('[data-role="result"]')).toContainText("set radio 910.425");
  await expect(page.locator('[data-role="result"]')).toContainText("region put yvr");
  await expect(page.locator('[data-wizard-step="4"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
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
