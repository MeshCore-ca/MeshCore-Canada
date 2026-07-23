import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { siteRoute } from "./site-route.mjs";

const routes = [
  "/",
  "/start/",
  "/hardware/",
  "/provinces/",
  "/config/",
  "/config/map/",
  "/config/editor/",
  "/analyzer/intro/",
  "/submit-idea/"
];

for (const route of routes) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(siteRoute(route), { waitUntil: "networkidle" });
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = result.violations
      .filter((violation) => ["serious", "critical"].includes(violation.impact))
      .map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target)
      }));
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
}

test("hidden overlay labels stay out of the keyboard order", async ({ page }) => {
  await page.goto(siteRoute("/"));
  await expect(page.locator("label.md-overlay[for='__drawer']")).not.toHaveAttribute("tabindex", "0");
  await expect(page.locator("label.md-search__overlay[for='__search']")).not.toHaveAttribute("tabindex", "0");
});

test("footer social links have unique meaningful accessible names", async ({ page }) => {
  await page.goto(siteRoute("/"));
  const socialLinks = page.locator(".md-social__link");
  await expect(socialLinks.first()).toHaveAttribute("aria-label", /\S/);

  const names = await socialLinks.evaluateAll((links) =>
    links.map((link) => (link.getAttribute("aria-label") || "").trim())
  );
  expect(names.length).toBeGreaterThan(1);
  expect(new Set(names).size).toBe(names.length);
  for (const name of names) {
    expect(name).toMatch(/[a-z]{3}/i);
    expect(name.toLowerCase()).not.toBe("(opens in a new tab)");
  }
});

test("mobile header drawer and search toggles support keyboard activation", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Mobile keyboard contract");
  await page.goto(siteRoute("/"));

  const controls = [
    {
      label: page.locator("label.md-header__button[for='__drawer']"),
      checkbox: page.locator("#__drawer"),
      key: "Enter"
    },
    {
      label: page.locator("label.md-header__button[for='__search']"),
      checkbox: page.locator("#__search"),
      key: "Space"
    }
  ];

  for (const control of controls) {
    await expect(control.label).toBeVisible();
    await expect(control.label).toHaveAttribute("role", "button");
    await expect(control.label).toHaveAttribute("tabindex", "0");
    await expect(control.label).toHaveAttribute("aria-expanded", "false");

    await control.label.focus();
    await page.keyboard.press(control.key);
    await expect(control.checkbox).toBeChecked();
    await expect(control.label).toHaveAttribute("aria-expanded", "true");

    await control.label.focus();
    await page.keyboard.press(control.key);
    await expect(control.checkbox).not.toBeChecked();
    await expect(control.label).toHaveAttribute("aria-expanded", "false");
  }
});

test("keyboard focus is visible on the primary Start action", async ({ page }) => {
  await page.goto(siteRoute("/"));
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth || "0")
    };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});
