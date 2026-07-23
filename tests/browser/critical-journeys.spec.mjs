import { expect, test } from "@playwright/test";
import { normalizeSiteBaseUrl, resolveSiteRoute, siteRoute } from "./site-route.mjs";

const criticalRoutes = [
  "/",
  "/start/",
  "/start/companion/",
  "/about/",
  "/hardware/",
  "/provinces/",
  "/config/",
  "/config/map/",
  "/config/editor/",
  "/tools/",
  "/analyzer/intro/",
  "/submit-idea/"
];

test("site route resolution preserves a configured deployment subtree", () => {
  expect(resolveSiteRoute(
    "https://canadaverse.org/meshcore-canada",
    "/config/?place=Ottawa"
  )).toBe("https://canadaverse.org/meshcore-canada/config/?place=Ottawa");
});

test("site manifest identifies the artifact served from the configured subtree", async ({ request }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL;
  const manifestUrl = resolveSiteRoute(baseURL, "/site-manifest.json");
  const response = await request.get(siteRoute("/site-manifest.json"));

  expect(response.ok(), `${manifestUrl} should return a successful response`).toBeTruthy();
  expect(response.url()).toBe(manifestUrl);

  const manifest = await response.json();
  expect(manifest.artifactSha256).toMatch(/^[a-f0-9]{64}$/);

  const configuredBaseUrl = normalizeSiteBaseUrl(baseURL);
  const configuredBase = new URL(configuredBaseUrl);
  const declaredBase = new URL(manifest.siteBaseUrl);
  if (process.env.PLAYWRIGHT_BASE_URL) {
    expect(declaredBase.href).toBe(configuredBaseUrl);
  } else {
    expect(declaredBase.pathname).toBe(configuredBase.pathname);
  }

  if (process.env.EXPECTED_SITE_REVISION) {
    expect(manifest.revision).toBe(process.env.EXPECTED_SITE_REVISION);
  }
});

test.describe("critical routes", () => {
  for (const route of criticalRoutes) {
    test(`${route} has one visible page heading`, async ({ page }, testInfo) => {
      const response = await page.goto(siteRoute(route), { waitUntil: "domcontentloaded" });
      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      expect(page.url()).toBe(resolveSiteRoute(testInfo.project.use.baseURL, route));
      await expect(page.locator("h1:visible")).toHaveCount(1);
      await expect(page.locator("h1:visible")).not.toHaveText("");
    });
  }
});

test("desktop navigation exposes the six task categories", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile-"), "Desktop navigation contract");
  await page.goto(siteRoute("/"));
  const labels = await page.locator(".md-tabs__link").allTextContents();
  const normalised = labels.map((value) => value.trim()).filter(Boolean);
  expect(normalised).toEqual([
    "Start",
    "Communities",
    "Devices & Builds",
    "Network Tools",
    "Learn",
    "Contribute"
  ]);
});

test("hardware landing links directly to the experimental 1 W build", async ({ page }, testInfo) => {
  await page.goto(siteRoute("/hardware/"));
  const link = page.getByRole("link", { name: "Review the experimental 1 W build" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "repeater-solar-1w-diy-build/");
  await link.click();
  await expect(page).toHaveURL(
    resolveSiteRoute(testInfo.project.use.baseURL, "/hardware/repeater-solar-1w-diy-build/"),
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Experimental 1 W Solar Repeater");
});

test("home place search resolves a city to its region", async ({ page }) => {
  await page.route("https://nominatim.openstreetmap.org/search?**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([{
        lat: "43.5448",
        lon: "-80.2482",
        display_name: "Guelph, Ontario, Canada",
        address: {
          city: "Guelph",
          state: "Ontario",
          country: "Canada",
          country_code: "ca"
        }
      }])
    });
  });
  await page.goto(siteRoute("/"));
  await page.locator("#mc-home-place").fill("Guelph, Ontario");
  await Promise.all([
    page.waitForURL((url) =>
      url.pathname.endsWith("/config/") &&
      url.searchParams.get("place") === "Guelph, Ontario" &&
      !url.searchParams.has("lookup")
    ),
    page.getByRole("button", { name: "Find my region" }).click()
  ]);
  await expect(page.locator("#mcc-location-input")).toHaveValue("Guelph, Ontario");
  await expect(page.locator("[data-action='online-search-consent']")).toHaveCount(0);
  await expect(page.locator("[data-role='status']")).toContainText("Region found.");
});

test("known config place deep links resolve locally without an external request", async ({ page }) => {
  const onlineRequests = [];
  await page.route(/https:\/\/(?:nominatim\.openstreetmap\.org|geocoder\.ca)\//, async (route) => {
    onlineRequests.push(route.request().url());
    await route.abort();
  });

  await page.goto(siteRoute("/config/?place=Ottawa"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("#mcc-location-input")).toHaveValue("Ottawa");
  await expect(page.locator("[data-action='online-search-consent']")).toHaveCount(0);
  await expect(page.locator("#__search")).not.toBeChecked();
  await expect(page.locator("[data-mcc-regions='config']")).toBeVisible();
  await expect(page.locator("[data-role='status']")).toContainText("Region found.");

  expect(onlineRequests).toEqual([]);
  const url = new URL(page.url());
  expect(url.searchParams.get("place")).toBe("Ottawa");
  expect(url.searchParams.has("lookup")).toBeFalsy();
  expect(url.searchParams.has("q")).toBeFalsy();
});

test("region map loads OpenStreetMap tiles without a consent gate", async ({ page }) => {
  const tileRequests = [];
  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    tileRequests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    });
  });

  await page.goto(siteRoute("/config/map/"), { waitUntil: "domcontentloaded" });
  await expect(page.locator("[data-action='tile-consent']")).toHaveCount(0);
  await expect(page.getByText(/Allow OpenStreetMap tiles/i)).toHaveCount(0);
  await expect(page.locator("[data-role='map-area']")).toBeVisible();
  await expect(page.locator("[data-role='map-loading']")).toBeHidden();
  await expect(page.locator(".leaflet-tile-loaded").first()).toBeVisible();
  await expect(page.locator("[data-role='map-ready-status']")).toHaveText("Interactive region map loaded.");
  await expect.poll(() => tileRequests.length).toBeGreaterThan(0);
});

test("header search stays aligned inside the desktop header", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile-"), "Desktop header geometry contract");
  await page.setViewportSize({ width: 1091, height: 930 });
  await page.goto(siteRoute("/"));
  const geometry = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    };
    return {
      header: box(".md-header__inner"),
      form: box(".md-search__form"),
      input: box(".md-search__input"),
      icon: box(".md-search__icon[for='__search']")
    };
  });
  expect(Math.abs(geometry.input.height - geometry.form.height)).toBeLessThan(1);
  expect(geometry.input.top).toBeGreaterThanOrEqual(geometry.header.top);
  expect(geometry.input.bottom).toBeLessThanOrEqual(geometry.header.bottom + 1);
  expect(geometry.icon.height).toBeLessThanOrEqual(geometry.form.height + 1);
  expect(geometry.icon.width).toBeGreaterThanOrEqual(24);
  expect(geometry.icon.height).toBeGreaterThanOrEqual(24);
});

test("community directory deep links use their dedicated query parameter", async ({ page }) => {
  await page.goto(siteRoute("/provinces/?community=Ottawa"));
  await expect(page.locator("#community-search")).toHaveValue("Ottawa");
  await expect(page.locator("[data-community-card]:visible")).toHaveCount(1);
  await expect(page.locator("[data-community-count]")).toHaveText("Showing 1 community");
  const url = new URL(page.url());
  expect(url.searchParams.get("community")).toBe("Ottawa");
  expect(url.searchParams.has("q")).toBeFalsy();
});

test("region workbench remains readable after switching to the light palette", async ({ page }) => {
  await page.goto(siteRoute("/config/"));
  const contrast = await page.evaluate(() => {
    document.body.setAttribute("data-md-color-scheme", "default");
    const heading = document.querySelector(".md-content h1");
    const canvas = document.querySelector(".md-content");
    const channels = (value) => (value.match(/\d+(?:\.\d+)?/g) || [])
      .slice(0, 3)
      .map(Number)
      .map((part) => {
        const channel = part / 255;
        return channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      });
    const luminance = (value) => {
      const [red, green, blue] = channels(value);
      return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
    };
    const foreground = luminance(getComputedStyle(heading).color);
    const background = luminance(getComputedStyle(canvas).backgroundColor);
    return (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
});
test("site search responds to typed and pasted input", async ({ page }) => {
  await page.goto(siteRoute("/"));
  await page.locator(".md-search__input").fill("repeater");
  await expect(page.locator(".md-search-result__meta")).toContainText("matching document");
  await expect(page.locator(".md-search-result__item")).not.toHaveCount(0);
});

test("Start progress stores completion markers only", async ({ page }) => {
  await page.goto(siteRoute("/start/companion/"));
  const first = page.locator("input[data-mc-progress]").first();
  await expect(first).toBeVisible();
  await first.check();
  await page.reload();
  await expect(first).toBeChecked();

  const stored = await page.evaluate(() =>
    Object.entries(window.localStorage).filter(([key]) =>
      key.startsWith("meshcore-canada:progress:v1:")
    )
  );
  expect(stored).toHaveLength(1);
  expect(stored[0][1]).toBe("done");
  expect(JSON.stringify(stored)).not.toMatch(/password|credential|coordinate|private.key/i);

  await first.uncheck();
  const remainingProgress = await page.evaluate(() =>
    Object.keys(window.localStorage).filter((key) =>
      key.startsWith("meshcore-canada:progress:v1:")
    )
  );
  expect(remainingProgress).toEqual([]);
});

test("tool assets remain route scoped", async ({ page }) => {
  await page.goto(siteRoute("/"), { waitUntil: "networkidle" });
  const homeAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(homeAssets.some((url) => /assets\/regions\/regions\.(?:css|js)/.test(url))).toBeFalsy();
  expect(homeAssets.some((url) => /submission-form\.js/.test(url))).toBeFalsy();

  await page.goto(siteRoute("/config/"), { waitUntil: "networkidle" });
  const configAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(configAssets.some((url) => /assets\/regions\/regions\.css/.test(url))).toBeTruthy();
  expect(configAssets.some((url) => /assets\/regions\/regions\.js/.test(url))).toBeTruthy();

  await page.goto(siteRoute("/submit-idea/"), { waitUntil: "networkidle" });
  const submitAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(submitAssets.some((url) => /submission-form\.js/.test(url))).toBeTruthy();
});

test("boundary editor makes both proposal paths and review-only behavior explicit", async ({ page }) => {
  await page.goto(siteRoute("/config/editor/"));
  await expect(page.getByText("Adjust an existing boundary", { exact: true })).toBeVisible();
  await expect(page.getByText(/propose a new region\/subregion/i)).toBeVisible();
  await expect(page.getByText(/Submitting creates a public proposal for review/i)).toBeVisible();
  await expect(page.getByText(/does not change the map/i)).toBeVisible();
});

test("idea form exposes review, verification, and final submission", async ({ page }) => {
  await page.goto(siteRoute("/submit-idea/"));
  await expect(page.getByRole("button", { name: "Review idea" })).toBeVisible();
  await expect(page.locator("#submission-verification")).toBeHidden();
  await expect(page.locator("#submission-final-actions")).toBeHidden();
  await expect(page.getByText(/No GitHub account needed/i)).toBeVisible();
  await expect(page.getByText(/Do not include passwords, keys, addresses, or private coordinates/i)).toBeVisible();
});

test("mobile wizard progress buttons have descriptive accessible names", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Mobile accessibility contract");
  await page.goto(siteRoute("/config/"));

  const expectedNames = [
    "Step 1: Device",
    "Step 2: Location",
    "Step 3: Coverage",
    "Step 4: Apply"
  ];
  const buttons = page.locator(".mcc-wizard-progress button");
  await expect(buttons).toHaveCount(expectedNames.length);
  for (const name of expectedNames) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(1);
  }
});

test("mobile critical pages do not overflow the viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Mobile layout contract");
  for (const route of ["/", "/start/", "/provinces/", "/config/", "/submit-idea/"]) {
    await page.goto(siteRoute(route), { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(overflow.content, `${route} should fit its mobile viewport`).toBeLessThanOrEqual(overflow.viewport + 1);
  }
});
