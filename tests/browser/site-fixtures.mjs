import { test as base } from "@playwright/test";
export { expect } from "@playwright/test";

// A 1×1 PNG, served for every OpenStreetMap tile so map tests never reach the real tile server.
export const TILE_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

// Keep routine browser tests off the public aggregate API and the OpenStreetMap tile server
// (the zone finder and the setup tool's map location step both draw tiles). Individual tests
// can add their own route, which runs first, to exercise errors, payloads, and cache behavior.
// Tiles are answered for the whole browser context, so a second page a test opens is covered too;
// a page's own route still comes before it.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route("https://dev.meshcore.ca/api/v1/stats/**", route => route.fulfill({
      json: route.request().url().endsWith("overview")
        ? { activeObservers: 12, activeIatas: 4, totalPackets: 900, windowHours: 24 }
        : [{ nodeType: 2, count: 50 }, { nodeType: 1, count: 20 }, { nodeType: 3, count: 3 }, { nodeType: 4, count: 2 }]
    }));
    await page.context().route("https://tile.openstreetmap.org/**", route => route.fulfill({ contentType: "image/png", body: TILE_PNG }));
    await use(page);
  }
});
