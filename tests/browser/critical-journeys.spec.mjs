import { expect, test } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/start/",
  "/start/companion/",
  "/provinces/",
  "/config/",
  "/config/map/",
  "/config/editor/",
  "/analyzer/intro/",
  "/submit-idea/"
];

test.describe("critical routes", () => {
  for (const route of criticalRoutes) {
    test(`${route} has one visible page heading`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok(), `${route} should return a successful response`).toBeTruthy();
      await expect(page.locator("h1:visible")).toHaveCount(1);
      await expect(page.locator("h1:visible")).not.toHaveText("");
    });
  }
});

test("desktop navigation exposes the six task categories", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("mobile-"), "Desktop navigation contract");
  await page.goto("/");
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
  await page.goto("/");
  await page.locator("#mc-home-place").fill("Guelph, Ontario");
  await page.locator("input[name='lookup']").check();
  await Promise.all([
    page.waitForURL((url) =>
      url.pathname.endsWith("/config/") &&
      url.searchParams.get("q") === "Guelph, Ontario" &&
      url.searchParams.get("lookup") === "online"
    ),
    page.getByRole("button", { name: "Find my region" }).click()
  ]);
  await expect(page.locator("#mcc-location-input")).toHaveValue("Guelph, Ontario");
  await expect(page.locator("[data-action='online-search-consent']")).toBeChecked();
  await expect(page.locator("[data-role='status']")).toContainText("Region found.");
});

test("site search responds to typed and pasted input", async ({ page }) => {
  await page.goto("/");
  await page.locator(".md-search__input").fill("repeater");
  await expect(page.locator(".md-search-result__meta")).toContainText("matching document");
  await expect(page.locator(".md-search-result__item")).not.toHaveCount(0);
});

test("Start progress stores completion markers only", async ({ page }) => {
  await page.goto("/start/companion/");
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
  await page.goto("/", { waitUntil: "networkidle" });
  const homeAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(homeAssets.some((url) => /assets\/regions\/regions\.(?:css|js)/.test(url))).toBeFalsy();
  expect(homeAssets.some((url) => /submission-form\.js/.test(url))).toBeFalsy();

  await page.goto("/config/", { waitUntil: "networkidle" });
  const configAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(configAssets.some((url) => /assets\/regions\/regions\.css/.test(url))).toBeTruthy();
  expect(configAssets.some((url) => /assets\/regions\/regions\.js/.test(url))).toBeTruthy();

  await page.goto("/submit-idea/", { waitUntil: "networkidle" });
  const submitAssets = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name)
  );
  expect(submitAssets.some((url) => /submission-form\.js/.test(url))).toBeTruthy();
});

test("boundary editor makes both proposal paths and review lifecycle explicit", async ({ page }) => {
  await page.goto("/config/editor/");
  await expect(page.getByText("Adjust an existing boundary", { exact: true })).toBeVisible();
  await expect(page.getByText(/propose a new region\/subregion/i)).toBeVisible();
  await expect(page.locator(".lifecycle-list li")).toHaveCount(4);
  await expect(page.getByText(/Nothing changes when you submit/i)).toBeVisible();
});

test("idea form exposes review, verification, and final submission", async ({ page }) => {
  await page.goto("/submit-idea/");
  await expect(page.getByRole("button", { name: "Review idea" })).toBeVisible();
  await expect(page.locator("#submission-verification")).toBeHidden();
  await expect(page.locator("#submission-final-actions")).toBeHidden();
  await expect(page.getByText(/No GitHub account needed/i)).toBeVisible();
  await expect(page.getByText(/Do not include passwords, keys, addresses, or private coordinates/i)).toBeVisible();
});

test("mobile critical pages do not overflow the viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Mobile layout contract");
  for (const route of ["/", "/start/", "/provinces/", "/config/", "/submit-idea/"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    expect(overflow.content, `${route} should fit its mobile viewport`).toBeLessThanOrEqual(overflow.viewport + 1);
  }
});
