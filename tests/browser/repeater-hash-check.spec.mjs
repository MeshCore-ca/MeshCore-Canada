import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";

const fullKey = `05DE00${"11".repeat(29)}`;
const matchingNodes = [
  {
    publicKey: fullKey,
    name: "New repeater",
    nodeTypeName: "repeater",
    iatas: [{ iata: "YYZ", lastHeard: 1786208400000 }],
    stale: false
  },
  {
    publicKey: `05DE00${"22".repeat(29)}`,
    name: "Local duplicate",
    nodeTypeName: "repeater",
    iatas: [{ iata: "YYZ", lastHeard: 1786208300000 }],
    stale: false
  },
  {
    publicKey: `05DE00${"33".repeat(29)}`,
    name: "Remote duplicate",
    nodeTypeName: "repeater",
    iatas: [{ iata: "YVR", lastHeard: 1786100000000 }],
    stale: true
  }
];

async function mockBeacon(page) {
  const nodeRequests = [];
  await page.route("https://dev.meshcore.ca/api/v1/iatas", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        { iata: "YOW", displayName: "Ottawa International", lat: 45.3225, lon: -75.6692 },
        { iata: "YVR", displayName: "Vancouver International", lat: 49.1967, lon: -123.1815 },
        { iata: "YYZ", displayName: "Toronto Pearson", lat: 43.6777, lon: -79.6248 }
      ])
    });
  });
  await page.route("https://dev.meshcore.ca/api/v1/nodes?**", async (route) => {
    nodeRequests.push(route.request().url());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ items: matchingNodes, hasMore: false })
    });
  });
  return nodeRequests;
}

async function openChecker(page, language = "en") {
  const summary = language === "fr"
    ? "Vérifier l’identifiant du répéteur (facultatif)"
    : "Duplicate repeater ID check (optional)";
  const details = page.locator(".mc-hash-disclosure");
  await expect(details.getByText(summary, { exact: true })).toBeVisible();
  if (!(await details.evaluate((element) => element.open))) {
    await details.locator("summary").click();
  }
}

async function runCheck(page, language = "en") {
  const keyLabel = language === "fr" ? "Clé publique du répéteur" : "Repeater public key";
  const regionLabel = language === "fr" ? "Région Beacon la plus proche" : "Closest Beacon region";
  const button = language === "fr" ? "Vérifier cet identifiant" : "Check this ID";
  await openChecker(page, language);
  await page.getByLabel(keyLabel).fill(fullKey);
  await page.getByLabel(regionLabel).fill("YYZ");
  await page.getByRole("button", { name: button }).click();
}

test("checks a repeater ID by first-byte Beacon lookup and separates local from network collisions", async ({ page }) => {
  const nodeRequests = await mockBeacon(page);
  await page.goto(siteRoute("/start/repeater/"));
  await runCheck(page);
  await expect(page.getByRole("heading", { name: "Check for a duplicate repeater ID" })).toBeVisible();

  await expect(page.getByRole("status").filter({ hasText: "05DE00 is also used by 1 repeater in YYZ" })).toBeVisible();
  const selectedRow = page.locator(".mc-hash-comparison tr.is-selected");
  await expect(selectedRow).toContainText("05DE00");
  await expect(selectedRow).toContainText("1 YYZ");
  await expect(selectedRow).toContainText("2");
  await expect(page.locator(".mc-hash-details tbody tr")).toHaveCount(3);
  await expect(page.getByText("This repeater", { exact: true })).toBeVisible();
  await expect(page.getByText("Duplicate in YYZ", { exact: true })).toBeVisible();

  expect(nodeRequests).toHaveLength(1);
  const request = new URL(nodeRequests[0]);
  expect(request.searchParams.get("pubkeyPrefix")).toBe("05");
  expect(request.searchParams.get("typeName")).toBe("repeater");
  expect(nodeRequests[0]).not.toContain(fullKey);
});

test("French repeater pages render and report collisions in French", async ({ page }) => {
  await mockBeacon(page);
  await page.goto(siteRoute("/fr/start/repeater/"));
  await runCheck(page, "fr");
  await expect(page.getByRole("heading", { name: "Vérifier si l’identifiant est déjà utilisé" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "1 autre répéteur utilise 05DE00 dans YYZ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Comparer les tailles d’identifiant" })).toBeVisible();
});

test("the repeater checker defers Beacon region loading until it is used", async ({ page }) => {
  let iataRequests = 0;
  await page.route("https://dev.meshcore.ca/api/v1/iatas", async (route) => {
    iataRequests += 1;
    await route.fulfill({ contentType: "application/json", body: "[]" });
  });
  await page.goto(siteRoute("/start/repeater/"));
  const disclosure = page.locator(".mc-hash-disclosure");
  await expect(disclosure.getByText("Duplicate repeater ID check (optional)", { exact: true })).toBeVisible();
  await expect(disclosure).not.toHaveAttribute("open", "");
  await page.waitForTimeout(250);
  expect(iataRequests).toBe(0);

  await openChecker(page);
  await page.getByLabel("Closest Beacon region").focus();
  await expect.poll(() => iataRequests).toBe(1);
});

test("nested pages do not probe page-relative sitemaps or an absent GitHub release", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto(siteRoute("/start/repeater/"));
  await expect(page.getByText("Duplicate repeater ID check (optional)", { exact: true })).toBeVisible();
  await page.waitForTimeout(250);

  expect(requests.filter((url) => /\/start\/repeater\/sitemap\.xml$/.test(url))).toEqual([]);
  expect(requests.filter((url) => url.endsWith("/releases/latest"))).toEqual([]);
});

test("the repeater checker mounts without a disruptive layout shift", async ({ page }) => {
  await page.addInitScript(() => {
    window.__mcLayoutShift = 0;
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) window.__mcLayoutShift += entry.value;
      });
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(siteRoute("/start/repeater/"));
  await expect(page.getByText("Duplicate repeater ID check (optional)", { exact: true })).toBeVisible();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__mcLayoutShift)).toBeLessThan(0.1);
});

test("the general region configurator does not show the optional ID checker", async ({ page }) => {
  const beaconRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith("https://dev.meshcore.ca/") && !url.startsWith("https://dev.meshcore.ca/api/v1/stats/")) {
      beaconRequests.push(url);
    }
  });
  await page.goto(siteRoute("/config/?place=YOW"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-mcc-regions='config'] [data-role='status']")).toContainText("Zone found. Choose the province");
  await expect(page.locator("[data-mcc-regions='config']")).toBeVisible();
  await expect(page.locator("[data-mc-repeater-hash-check]")).toHaveCount(0);
  expect(beaconRequests).toEqual([]);
});

test("collision results become labelled cards without horizontal overflow on a phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Mobile collision-table contract");
  await mockBeacon(page);
  await page.goto(siteRoute("/start/repeater/"));
  await runCheck(page);
  const layout = await page.locator("[data-mc-repeater-hash-check]").evaluate((host) => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    labels: Array.from(host.querySelectorAll("tbody td")).map((cell) => cell.dataset.label),
    displays: Array.from(host.querySelectorAll("tbody tr")).map((row) => getComputedStyle(row).display)
  }));
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.labels.every(Boolean)).toBeTruthy();
  expect(layout.displays.every((display) => display === "grid")).toBeTruthy();
});
