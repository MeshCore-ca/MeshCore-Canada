import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import { submissionSha256 } from "../../docs/config/editor/issue.js";
import { PHONE_ROUTE, choose, codes, commandLines, confirmStep, expectStep, nextButton, nextUntil, openLink, phoneLink, step, toolRoot } from "./setup-helpers.mjs";

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

  test(`${locale || "en/"} an old link with a legacy city code opens the tool on the current zone, without a second province`, async ({ page }) => {
    // A link made before the zones were renamed: ott is now yow, and the old extras (mtl, a role) are not zones.
    await openLink(page, `${toolRoot(lang)}?${PHONE_ROUTE}&tag=ott&province=on&regions=mtl&role=city&name=Ottawa_R1`, { firmware: "1.15" });
    const lines = await commandLines(page);
    expect(lines).toContain("region put yow");
    expect(lines).not.toContain("region put qc");
    expect(lines).not.toContain("region put yul");
    expect(lines.some((line) => line.startsWith("set radio"))).toBe(false);
    // The address now holds the current zone, and nothing of the old extras.
    const params = new URL(page.url()).searchParams;
    expect(params.get("tag")).toBe("yow");
    expect(params.get("province")).toBe("on");
    expect(params.has("regions")).toBe(false);
  });

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

test("feedback remembers its page and accepts a title and description", async ({ page }) => {
  await page.goto(siteRoute("/start/room-server/"));
  await page.locator(".mc-page-feedback a").click();
  await expect(page.locator('input[name="source_page"]')).toHaveValue("https://meshcore.ca/start/room-server/");
  await page.locator("#submission-summary").fill("Clarify one instruction");
  await page.locator("#submission-need").fill("The step needs a clearer example.");
  await page.locator("#submission-public").check();
  await page.locator("#review-submission").click();
  await expect(page.locator("#submission-preview")).toContainText("https://meshcore.ca/start/room-server/");
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
      await page.goto(siteRoute(`/${locale}start/room-server/`));
      await page.locator(".mc-page-feedback a").click();
      await expect(page.locator('input[name="source_page"]')).toHaveValue(`https://meshcore.ca/${locale}start/room-server/`);
      await page.locator("#submission-summary").fill("Clarify one instruction");
      await page.locator("#submission-need").fill("The step needs a clearer example.");
      await page.locator("#submission-public").check();
      await page.locator("#review-submission").click();
      if (modernGateway) {
        await page.locator("#submit-community-idea").click();
        await expect(page.locator("#submission-result")).toHaveAttribute("data-state", "success");
        expect(posted.experience).toBe("");
        expect(posted.idea).toBe("");
        expect(posted.sourcePage).toBe(`https://meshcore.ca/${locale}start/room-server/`);
      } else {
        await expect(page.locator("#submission-anti-spam-status")).toHaveAttribute("data-state", "error");
        await expect(page.locator("#submit-community-idea")).toBeDisabled();
        await expect(page.locator("#open-github-submission")).toHaveAttribute("href", /github.com/);
        expect(posted).toBeNull();
      }
    });
  }
}
