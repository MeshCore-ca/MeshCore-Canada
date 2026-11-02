import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import {
  T, plain, firstSentence, linked, mockGeocoder, step, nextButton, progress, codes, expectStep, next, choose, answer,
  confirmStep, version, searchTown, town, scopeLines, commandLines, openLink, nextUntil
} from "./setup-helpers.mjs";

// The guided setup tool at /config/. Shared helpers (the text table, the geocoder mock, the step
// helpers) live in setup-helpers.mjs, which the specs that retarget old configurator cases also use.
const ROUTES = { en: "/config/", fr: "/fr/config/" };
const LANGS = ["en", "fr"];

const BELLEVILLE = "town=Belleville&lat=44.1628&lon=-77.3832&tag=ytr&province=on";

const BELLEVILLE_COMMANDS = (lang) => ["set radio 910.525,62.5,7,5", "set name Belleville_R1", "set lat 44.1628", "set lon -77.3832",
  `password <${T("ph.password", lang)}>`, "set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16",
  "region def ytr|* on|* onqc|* can|* na", "region allowf *", "region default ytr", "region save", "reboot"];

for (const lang of LANGS) {
  test(`${lang} new RAK4631 city repeater in Belleville, one question per screen`, async ({ page }) => {
    await mockGeocoder(page);
    await page.goto(siteRoute(ROUTES[lang]));
    await expectStep(page, "type");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 1, total: 10, label: T("step.type", lang) }));
    await expect(nextButton(page)).toBeDisabled();
    await expect(page.locator("[data-setup-back]")).toBeDisabled();
    await answer(page, "type", "repeater");
    await expectStep(page, "board");
    await expect(nextButton(page)).toBeDisabled();
    await choose(page, "rak4631");
    // An nRF52 board adds the bootloader step.
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 2, total: 11, label: T("step.board", lang) }));
    await next(page);
    await answer(page, "status", "new");
    await confirmStep(page, "bootloader");
    await confirmStep(page, "flash");
    await expectStep(page, "version");
    await expect(nextButton(page)).toBeDisabled();
    await version(page, "MeshCore v1.16.2 (Build: 12-Oct-2026)");
    await expectStep(page, "town");
    await expect(nextButton(page)).toBeDisabled();
    await searchTown(page, "Belleville");
    await expect(page.locator("[data-setup-region]")).toContainText("ytr");
    await expect(page.locator("[data-setup-region]")).toContainText(T("town.region", lang, { name: "Quinte West" }));
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await expect(page.locator("[data-setup-name]")).toHaveValue("Belleville_R1");
    await expect(page.locator("[data-setup-location]")).toBeChecked();
    await next(page);
    await expectStep(page, "commands");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 10, total: 11, label: T("step.commands", lang) }));
    await expect(codes(page)).toHaveText(BELLEVILLE_COMMANDS(lang));
    // Each line has Done; the password line is typed by hand, so it has no Copy.
    await expect(page.locator("[data-setup-command] [data-done]")).toHaveCount(14);
    await expect(page.locator("[data-setup-command] [data-copy]")).toHaveCount(13);
    await expect(page.locator('[data-setup-command="password"] [data-copy]')).toHaveCount(0);
    await expect(page.locator('[data-setup-command="password"]')).toContainText(T("commands.type-yourself", lang));
    // Where to paste: the flasher's Console.
    await expect(step(page)).toContainText(firstSentence(T("commands.where.console", lang, { flasher: T("commands.flasher.repeater", lang) })));
    await expect(nextButton(page)).toHaveText(T("nav.to-check", lang));
    await next(page);
    await expectStep(page, "check");
    // The commands themselves, not the `clock sync` the clock check mentions in its explanation.
    await expect(page.locator("[data-setup-check] .setup-command__code")).toHaveText(["ver", "get name", "region", "clock", "advert"]);
    await expect(page.locator('[data-setup-check="clock"]')).toContainText(plain("check.clock", lang));
    await expect(step(page)).toContainText(T("check.name", lang, { name: "Belleville_R1" }));
  });

  test(`${lang} repeater observer: nRF boards disabled with an explanation and a switch to plain repeater`, async ({ page }) => {
    await page.goto(siteRoute(ROUTES[lang]));
    await answer(page, "type", "observer");
    await answer(page, "repeat", "both");
    await expectStep(page, "board");
    for (const id of ["rak4631", "heltec-t114", "t-echo", "other-nrf52"]) {
      await expect(page.locator(`[data-setup-choice="${id}"]`)).toBeDisabled();
    }
    // The reason is on the card and read out with the board's name.
    await expect(page.locator('[data-setup-card="rak4631"]')).toContainText(T("board.no-wifi.detail", lang));
    await expect(page.locator('[data-setup-choice="rak4631"]')).toHaveAccessibleDescription(T("board.no-wifi.detail", lang));
    await expect(step(page)).toContainText(T("board.observer-nrf52", lang));
    await expect(page.locator('[data-setup-choice="heltec-v3"]')).toBeEnabled();
    // A board the list doesn't name can still be a repeater observer, if the observer flasher has it.
    await choose(page, "other-esp32");
    await expect(step(page)).toContainText("observer.gessaman.com");
    await expect(nextButton(page)).toBeEnabled();
    await page.locator("[data-setup-as-repeater]").click();
    await expectStep(page, "board");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 2, total: 10, label: T("step.board", lang) }));
    await expect(page.locator('[data-setup-choice="rak4631"]')).toBeEnabled();
    await expect(page.locator("[data-setup-as-repeater]")).toHaveCount(0);
    await choose(page, "rak4631");
    await expect(page.locator('[data-setup-choice="rak4631"]')).toHaveAttribute("aria-pressed", "true");
    await next(page);
    await expectStep(page, "status");
    await page.locator("[data-setup-back]").click();
    await page.locator("[data-setup-back]").click();
    await expectStep(page, "type");
    await expect(page.locator('[data-setup-choice="repeater"]')).toHaveAttribute("aria-pressed", "true");
  });
}

test("a greyed-out nRF52 board from a link is not picked and can't be clicked", async ({ page }) => {
  await page.goto(siteRoute("/config/?type=observer&repeat=both&board=rak4631"));
  await expectStep(page, "board");
  const rak = page.locator('[data-setup-choice="rak4631"]');
  await expect(rak).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-setup-card="rak4631"]')).not.toHaveClass(/is-picked/);
  await page.locator('[data-setup-card="rak4631"]').click();
  await expect(rak).toHaveAttribute("aria-pressed", "false");
  await expect(nextButton(page)).toBeDisabled();
  await choose(page, "heltec-v3");
  await expect(nextButton(page)).toBeEnabled();
});

test("running repeater via phone", async ({ page }) => {
  await mockGeocoder(page);
  await page.goto(siteRoute("/config/"));
  await answer(page, "type", "repeater");
  await answer(page, "board", "rak4631");
  await expectStep(page, "status");
  await choose(page, "running");
  // The back-up warning says how: the private key comes off over USB with `get prv.key`.
  await expect(step(page).locator(".setup-note--warn")).toHaveText(linked("status.backup", "en"));
  await expect(step(page).locator(".setup-note--warn a")).toHaveAttribute("href", "https://flasher.meshcore.io/");
  await next(page);
  await answer(page, "reflash", "no");
  await expectStep(page, "version");
  // No bootloader or flash steps: everything happens in the app.
  await expect(progress(page)).toHaveText(T("nav.progress", "en", { n: 5, total: 10, label: T("step.version", "en") }));
  await expect(step(page)).toContainText(plain("version.how.phone", "en"));
  const steps = page.locator("[data-setup-phone-steps]");
  await expect(steps).toContainText(T("commands.phone.step1", "en"));
  await expect(steps).toContainText(T("commands.phone.step3", "en"));
  const images = steps.locator("img");
  expect(await images.evaluateAll((list) => list.map((image) => new URL(image.src).pathname.split("/").pop()))).toEqual([
    "repeater-01-contacts.webp", "repeater-02-login.webp", "repeater-03-admin.webp", "repeater-05-ver.webp"
  ]);
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute("alt", /\w{4}/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  }
  await version(page, "  -> v1.15.1 (Build: 2026-03-02)");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  // A running repeater already has a name: nothing is suggested, so it isn't renamed by accident.
  await expect(page.locator("[data-setup-name]")).toHaveValue("");
  await expect(step(page)).toContainText(plain("name.hint.running", "en"));
  await expect(nextButton(page)).toBeDisabled();
  await page.locator("[data-setup-name]").fill("Quinte-Hill");
  await next(page);
  await expectStep(page, "commands");
  await expect(step(page)).toContainText(T("commands.question.phone", "en"));
  expect(await commandLines(page)).toContain("set name Quinte-Hill");
  await expect(page.locator("[data-setup-step] [data-setup-phone-steps] img")).not.toHaveCount(0);
  await expect(page.locator('[data-setup-note="radio-phone"]')).toContainText(firstSentence(T("note.radio-phone", "en")));
  expect((await commandLines(page)).some((line) => line.startsWith("set radio"))).toBe(false);
  // The `region` line comes first, with the paste box right after it.
  await expect(page.locator('[data-setup-command="region-show"] code')).toHaveText("region");
  await page.locator("[data-setup-reply]").fill("*^ F\n can F\n  on F\n   ott F");
  await expect.poll(async () => scopeLines(await codes(page).allTextContents())).toEqual([
    "region", "region remove ott", "region remove on", "region remove can",
    "region put ytr", "region put on", "region put onqc", "region put can", "region put na",
    "region allowf *", "region default ytr", "region save"
  ]);
  await expect(page.locator("[data-setup-step]")).toContainText(firstSentence(plain("region.errors", "en")));
  // A reply the tool can't read removes nothing and says so plainly.
  await page.locator("[data-setup-reply]").fill("hello there");
  await expect(page.locator("[data-setup-reply-status]")).toHaveText(plain("region.unreadable", "en"));
  await expect.poll(async () => (await codes(page).allTextContents()).filter((line) => line.startsWith("region remove"))).toEqual([]);
  await page.locator("[data-setup-reply]").fill("*^ F");
  await expect(page.locator("[data-setup-reply-status]")).toHaveText(T("region.clean", "en"));
  await next(page);
  await expectStep(page, "check");
  await expect(step(page)).toContainText(plain("check.hint.phone", "en"));
  // From the app the repeater takes the time from the phone, so the clock check is the sync itself, before the advert.
  await expect(page.locator("[data-setup-check] .setup-command__code")).toHaveText(["ver", "get name", "region", "clock sync", "advert"]);
  await expect(page.locator('[data-setup-check="clock"]')).toContainText(plain("check.clock.phone", "en"));
  await expect(page.locator('[data-setup-check="name"]')).toContainText(T("check.name", "en", { name: "Quinte-Hill" }));
});

test("edge repeater offers neighbouring regions and Ontario cross-border options", async ({ page }) => {
  await page.goto(siteRoute(`/config/?type=repeater&board=heltec-v3&status=new&${BELLEVILLE}`));
  // A shared link never ticks "flashed" for someone else, and never says which firmware is on the board.
  await confirmStep(page, "flash");
  await version(page, "v1.16.0");
  await expectStep(page, "town");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await next(page);
  await expectStep(page, "role");
  await choose(page, "city");
  // A city repeater can opt into the shared Ontario–New York label.
  const onny = page.locator('[data-setup-external="ontario-new-york"] input');
  await onny.check();
  await choose(page, "edge");
  await next(page);
  await expectStep(page, "neighbours");
  expect(await page.locator("[data-setup-neighbour]").evaluateAll((list) => list.map((box) => box.dataset.setupNeighbour)))
    .toEqual(["xph", "ygk", "yow", "yqa", "none"]);
  expect(await page.locator("[data-setup-external]").evaluateAll((list) => list.map((box) => box.dataset.setupExternal)))
    .toEqual(["ontario-new-york", "ohio", "pennsylvania", "western-new-york"]);
  // Switching to edge kept the shared label.
  await expect(onny).toBeChecked();
  await expect(page.locator('[data-setup-neighbour="ygk"]')).toContainText("Kingston");
  await expect(nextButton(page)).toBeDisabled();
  await page.locator('[data-setup-neighbour="ygk"] input').check();
  await page.locator('[data-setup-external="western-new-york"] input').check();
  await next(page);
  await expectStep(page, "name");
  await next(page);
  await expectStep(page, "commands");
  const lines = await commandLines(page);
  expect(lines).toContain("region def ytr|* ygk|* on|* onqc|* can|* na|* onny|* us us-ny");
  expect(lines).toContain("region denyf *");
  await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", "en", { network: "Ontario–New York (onny, opt-in)" }));
  // Back to city: neighbours and edge-only networks go, the shared label stays.
  await page.locator("[data-setup-back]").click();
  await page.locator("[data-setup-back]").click();
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "role");
  await choose(page, "city");
  await expect(onny).toBeChecked();
  await next(page);
  await expectStep(page, "name");
  await next(page);
  await expectStep(page, "commands");
  const city = await commandLines(page);
  expect(city).toContain("region def ytr|* on|* onqc|* can|* na|* onny");
  expect(city).toContain("region allowf *");
});

test("French pages name the cross-border networks in French", async ({ page }) => {
  await openLink(page, `/fr/config/?type=repeater&board=heltec-v3&status=running&reflash=0&role=edge&${BELLEVILLE}`, { to: "neighbours" });
  await expect(page.locator('[data-setup-external="pennsylvania"]')).toHaveText("Pennsylvanie");
  await expect(page.locator('[data-setup-external="western-new-york"]')).toHaveText("Ouest de l’État de New York");
  await page.locator('[data-setup-neighbour="none"] input').check();
  await page.locator('[data-setup-external="pennsylvania"] input').check();
  await next(page);
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Belleville_R1");
  await next(page);
  await expectStep(page, "commands");
  await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", "fr", { network: "Pennsylvanie" }));
});

test("ambiguous and unknown towns", async ({ page }) => {
  const queries = await mockGeocoder(page);
  // A running repeater on the phone route: once its version is in, the next question is the town.
  await openLink(page, "/config/?type=repeater&board=heltec-v3&status=running&reflash=0", { to: "town" });
  const choices = page.locator("[data-setup-step] [data-setup-choice]");

  // Several places share the name: ask which one, never pick.
  await searchTown(page, "Saint-Jean");
  await expect(step(page)).toContainText(T("town.places", "en"));
  await expect(choices).toHaveCount(3);
  await expect(choices).toContainText(["Saint-Jean-sur-Richelieu", "Saint John", "St. John's"]);
  // Each place says which region it is in, so two with the same name can be told apart.
  await expect(page.locator("[data-setup-step] [data-setup-card]")).toContainText(["Québec · Montreal (yul)", "New Brunswick · Saint John (ysj)", "Newfoundland and Labrador · Newfoundland (yyt)"]);
  await expect(page.locator("[data-setup-region]")).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
  await choices.filter({ hasText: "Saint John" }).click();
  await expect(page.locator("[data-setup-region]")).toContainText("ysj");
  await expect(nextButton(page)).toBeEnabled();

  // Nothing found: say so and offer a region code or name instead.
  await searchTown(page, "Nowhereville");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.no-match", "en"));
  await expect(nextButton(page)).toBeDisabled();
  await expect(page.locator("[data-setup-map]")).toHaveAttribute("href", /config\/map\/$/);
  // The map is for looking up the code to bring back here, not for starting over there.
  await expect(page.locator(".setup-map-link")).toHaveText(linked("town.map-hint", "en"));
  await page.locator("[data-setup-code]").fill("nope");
  await page.locator("[data-setup-code]").press("Enter");
  await expect(page.locator("[data-setup-code-message]")).toHaveText(linked("town.code-unknown", "en"));
  await page.locator("[data-setup-code]").fill("Quinte");
  await page.locator("[data-setup-code]").press("Enter");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await expect(nextButton(page)).toBeEnabled();

  // A place no region covers: say so and offer the code or name box.
  await searchTown(page, "Faraway");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(linked("town.none", "en"));
  await expect(page.locator("[data-setup-code]")).toBeVisible();
  await expect(nextButton(page)).toBeDisabled();

  // The search and the region map disagree about the province: explain and let the person choose.
  await searchTown(page, "Ottawa");
  await expect(step(page)).toContainText(T("town.mismatch", "en", { searched: "Québec", found: "Ontario" }));
  await expect(choices).toHaveCount(2);
  await expect(nextButton(page)).toBeDisabled();
  await page.locator('[data-setup-choice="yow:on"]').click();
  await expect(page.locator("[data-setup-region]")).toContainText("yow");
  await expect(page.locator("[data-setup-region]")).toContainText("Ontario");
  await expect(nextButton(page)).toBeEnabled();

  // A region code typed into the search box resolves without the geocoder; one spanning two provinces asks which.
  const before = queries.length;
  await searchTown(page, "YOW");
  await expect(step(page)).toContainText(T("town.province", "en"));
  await expect(choices).toHaveCount(2);
  await page.locator('[data-setup-choice="yow:qc"]').click();
  await expect(page.locator("[data-setup-region]")).toContainText("Québec");
  expect(queries.length).toBe(before);
});

test("town search offline offers a region code and the map", async ({ page }) => {
  await page.route("https://geolocator.api.geo.ca/**", (route) => route.abort());
  await openLink(page, "/fr/config/?type=repeater&board=heltec-v3&status=running&reflash=0", { to: "town" });
  await searchTown(page, "Belleville");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(linked("town.search-failed", "fr"));
  await expect(page.locator("[data-setup-step] a[href$='config/map/']")).not.toHaveCount(0);
  await page.locator("[data-setup-code]").fill("ytr");
  await page.locator("[data-setup-code]").press("Enter");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
});

test("a town search that never answers gives up and offers the code box", async ({ page }) => {
  await page.clock.install();
  await page.route("https://geolocator.api.geo.ca/**", () => { /* never answers */ });
  await openLink(page, "/config/?type=repeater&board=heltec-v3&status=running&reflash=0", { to: "town" });
  await expect(page.locator("[data-setup-town-results]")).not.toContainText(T("tool.loading", "en"));
  await searchTown(page, "Belleville");
  await expect(page.locator("[data-setup-town-results]")).toContainText(T("town.searching", "en"));
  // Ten seconds pass on the page's clock with no answer.
  await expect.poll(async () => {
    await page.clock.runFor(1_000);
    return page.locator("[data-setup-town-message]").count();
  }, { timeout: 20_000 }).toBe(1);
  await expect(page.locator("[data-setup-town-message]")).toHaveText(linked("town.search-failed", "en"));
  await page.locator("[data-setup-code]").fill("ytr");
  await page.locator("[data-setup-code]").press("Enter");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
});

test("a place deep link fills the search and starts it at the town step", async ({ page }) => {
  const queries = await mockGeocoder(page);
  await openLink(page, "/config/?place=Guelph%2C%20Ontario&type=repeater&board=heltec-v3&status=running&reflash=0", { to: "town" });
  await expect(page.locator("[data-setup-town]")).toHaveValue("Guelph, Ontario");
  await expect(page.locator("[data-setup-region]")).toContainText("ykf");
  expect(queries).toEqual(["Guelph"]);
  // The search ran once; the answers now carry the town instead.
  await expect.poll(() => new URL(page.url()).searchParams.get("place")).toBe(null);
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("ykf");
});

test("firmware reply", async ({ page }) => {
  await page.goto(siteRoute("/config/?type=repeater&board=heltec-v3&status=running&reflash=0"));
  await expectStep(page, "version");
  const input = page.locator("[data-setup-version]");
  const message = page.locator("[data-setup-version-message]");

  await input.fill("MeshCore v1.16.2 (Build: 12-Oct-2026)");
  await expect(message).toHaveText(T("version.found", "en", { version: "1.16.2" }));
  await expect(nextButton(page)).toBeEnabled();
  // The version stays out of the address: whoever opens a shared link is asked for their own `ver` reply.
  expect(new URL(page.url()).searchParams.has("firmware")).toBe(false);

  await input.fill("v1.17.0");
  await expect(message).toHaveText(T("version.found", "en", { version: "1.17.0" }));
  await expect(nextButton(page)).toBeEnabled();

  // Unreadable: pick the version instead.
  await input.fill("hello");
  await expect(message).toContainText(T("version.unreadable", "en"));
  await expect(nextButton(page)).toBeDisabled();
  await expect(page.locator('[data-setup-choice="1.14"]')).toBeVisible();
  await choose(page, "1.15");
  await expect(nextButton(page)).toBeEnabled();
  expect(new URL(page.url()).searchParams.has("firmware")).toBe(false);

  // Too old: update first, and the update offers the flash steps.
  await input.fill("v1.13.1");
  await expect(message).toContainText(T("version.too-old", "en"));
  await expect(nextButton(page)).toBeDisabled();
  await page.locator("[data-setup-update]").click();
  await expectStep(page, "flash");
  await expect(progress(page)).toContainText(T("step.flash", "en"));
  await expect.poll(() => new URL(page.url()).searchParams.get("reflash")).toBe("1");
  await confirmStep(page, "flash");
  await expectStep(page, "version");
  await expect(step(page)).toContainText(plain("version.how.console", "en"));
  await expect(input).toHaveValue("");
});

test("changing the town clears neighbours and the suggested name", async ({ page }) => {
  await mockGeocoder(page);
  await page.goto(siteRoute(`/config/?type=repeater&board=heltec-v3&status=new&role=edge&neighbours=ygk&name=Belleville_R1&${BELLEVILLE}`));
  await confirmStep(page, "flash");
  await version(page, "v1.16.0");
  await town(page, "Kingston", "ygk");
  await expectStep(page, "role");
  await expect(page.locator('[data-setup-choice="edge"]')).toHaveAttribute("aria-pressed", "true");
  await next(page);
  await expectStep(page, "neighbours");
  // Kingston's neighbours, none picked yet.
  expect(await page.locator("[data-setup-neighbour]").evaluateAll((list) => list.map((box) => box.dataset.setupNeighbour)))
    .toEqual(["yow", "ytr", "none"]);
  await expect(page.locator("[data-setup-neighbour] input:checked")).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
  await page.locator('[data-setup-neighbour="none"] input').check();
  await next(page);
  await expectStep(page, "name");
  await expect(page.locator("[data-setup-name]")).toHaveValue("Kingston_R1");
  await next(page);
  await expectStep(page, "commands");
  const lines = await commandLines(page);
  expect(lines).toContain("set name Kingston_R1");
  expect(lines).toContain("region def ygk|* on|* onqc|* can|* na");
  expect(lines).toContain("region default ygk");
  expect(lines.join("\n")).not.toMatch(/ytr|Belleville/);

  // A name the person typed is kept when the town changes.
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Hilltop-1");
  for (const id of ["neighbours", "role", "town"]) {
    await page.locator("[data-setup-back]").click();
    await expectStep(page, id);
  }
  await searchTown(page, "Belleville");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await next(page);
  await next(page);
  await page.locator('[data-setup-neighbour="none"] input').check();
  await next(page);
  await expect(page.locator("[data-setup-name]")).toHaveValue("Hilltop-1");
});

test("share link restores answers and holds no secrets", async ({ page, context }) => {
  await mockGeocoder(page);
  await context.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({ writeText: (value) => { window.__copied.push(value); return Promise.resolve(); } })
    });
  });
  await page.goto(siteRoute("/config/"));
  await answer(page, "type", "repeater");
  await answer(page, "board", "rak4631");
  await answer(page, "status", "running");
  await answer(page, "reflash", "no");
  await version(page, "v1.15.1");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Belleville_R1");
  await next(page);
  await expectStep(page, "commands");
  await page.locator("[data-setup-reply]").fill("*^ F\n ott F");
  await expect(codes(page)).toContainText(["region remove ott"]);
  const shared = new URL(page.url());
  // Everything but the firmware version, which whoever opens the link is asked for.
  expect(Object.fromEntries(shared.searchParams)).toEqual({
    type: "repeater", board: "rak4631", status: "running", reflash: "0",
    tag: "ytr", province: "on", role: "city", name: "Belleville_R1", nameEdited: "1",
    town: "Belleville", lat: "44.1628", lon: "-77.3832"
  });
  expect(shared.search).not.toMatch(/ott|reply|bootloader|flashed|firmware|password|pwd|ssid/i);
  await page.locator("[data-setup-share]").click();
  await expect(page.locator("[data-setup-share]")).toHaveText(T("nav.share-done", "en"));
  expect(await page.evaluate(() => window.__copied)).toEqual([shared.href]);

  const other = await context.newPage();
  await other.goto(shared.href);
  // The link opens on the version question: every route asks for the `ver` reply.
  await expectStep(other, "version");
  await expect(other.locator("[data-setup-version]")).toHaveValue("");
  await expect(nextButton(other)).toBeDisabled();
  await version(other, "v1.15.1");
  // Every other answer is there, minus the pasted reply.
  await nextUntil(other, "commands");
  const lines = await commandLines(other);
  expect(lines).toContain("set name Belleville_R1");
  expect(lines).toContain("set lat 44.1628");
  expect(lines).toContain("region");
  expect(lines).toContain("region put ytr");
  expect(lines.some((line) => line.startsWith("region remove"))).toBe(false);
  await expect(other.locator("[data-setup-reply]")).toHaveValue("");
  await other.close();
});

test("a town name from a link is shown as text, never as markup", async ({ page }) => {
  await page.addInitScript(() => { window.__injected = false; });
  const town = encodeURIComponent('<img src=x onerror="window.__injected=true">');
  await openLink(page, `/config/?type=repeater&board=heltec-v3&status=running&reflash=0&tag=ytr&province=on&town=${town}&lat=44.1628&lon=-77.3832`, { to: "role" });
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "town");
  await expect(page.locator("[data-setup-region]")).toContainText('<img src=x onerror="window.__injected=true">');
  await expect(page.locator("[data-setup-tool] img[src='x']")).toHaveCount(0);
  expect(await page.evaluate(() => window.__injected)).toBe(false);
});

test("map link opens with the region filled in", async ({ page }) => {
  const boundaries = [];
  page.on("request", (request) => { if (request.url().includes("iata-boundaries.geojson")) boundaries.push(request.url()); });
  await page.goto(siteRoute("/config/?tag=ytr&province=on"));
  await expectStep(page, "type");
  // The link holds a region, so the region data starts loading straight away.
  await expect.poll(() => boundaries.length).toBeGreaterThan(0);
  await answer(page, "type", "repeater");
  await answer(page, "board", "heltec-v3");
  await answer(page, "status", "new");
  await confirmStep(page, "flash");
  await version(page, "v1.16.0");
  await expectStep(page, "town");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await expect(page.locator("[data-setup-region]")).toContainText("Quinte West");
  await expect(page.locator("[data-setup-region]")).toContainText("Ontario");
  await next(page);
  await expectStep(page, "role");
});

test("start over asks first and sits away from the next button", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=heltec-v3&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
  await next(page);
  await expectStep(page, "check");
  await expect(nextButton(page)).toHaveCount(0);
  const answers = page.url();
  await page.locator("[data-setup-restart]").click();
  await expect(step(page)).toContainText(T("restart.confirm", "en"));
  await expect(page.locator("[data-setup-restart-no]")).toBeFocused();
  await page.locator("[data-setup-restart-no]").click();
  await expect(page.locator("[data-setup-restart]")).toBeFocused();
  await expectStep(page, "check");
  expect(page.url()).toBe(answers);
  await page.locator("[data-setup-restart]").click();
  await page.locator("[data-setup-restart-yes]").click();
  await expectStep(page, "type");
  await expect(page.locator("[data-setup-step] [aria-pressed='true']")).toHaveCount(0);
  expect(new URL(page.url()).search).toBe("");
});

test("old and unknown region codes in a link", async ({ page }) => {
  // An old code moves to its current region.
  await openLink(page, "/config/?type=repeater&board=heltec-v3&status=running&reflash=0&tag=ott&province=on", { to: "role" });
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("yow");
  // A code the map doesn't have is dropped, and the tool goes back to ask for the town.
  await openLink(page, "/config/?type=repeater&board=heltec-v3&status=running&reflash=0&tag=zzz&province=on&role=city&name=Hilltop", { to: "town" });
  await expect(step(page)).toContainText(T("town.link-invalid", "en"));
  await expect(nextButton(page)).toBeDisabled();
  expect(new URL(page.url()).searchParams.get("tag")).toBe(null);
});

test("the region map hands off to the tool", async ({ page }) => {
  await page.goto(siteRoute("/config/map/?tag=ytr&province=on"));
  const link = page.locator('[data-role="map-text-result"] .mcc-detail-actions a');
  await expect(link).toBeVisible();
  const href = new URL(await link.getAttribute("href"));
  expect(Object.fromEntries(href.searchParams)).toEqual({ tag: "ytr", province: "on" });
  await link.click();
  await expectStep(page, "type");
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("ytr");
});

test("the page credits its region data", async ({ page }) => {
  for (const [route, words] of [["/config/", "Data sources"], ["/fr/config/", "Sources de données"]]) {
    await page.goto(siteRoute(route));
    await expect(page.getByRole("link", { name: words })).toHaveAttribute("href", /assets\/regions\/NOTICE\.txt$/);
  }
});

test("a script that fails to load leaves a plain message, not an empty box", async ({ page }) => {
  // One of the setup scripts missing: the tool says so at once.
  await page.route("**/assets/setup/setup-commands.js*", (route) => route.abort());
  await page.goto(siteRoute("/fr/config/"));
  const tool = page.locator("[data-setup-tool]");
  await expect(tool.getByRole("alert")).toHaveText("L’outil de configuration n’a pas pu se charger. Rechargez la page.");
  expect((await tool.boundingBox()).height).toBeLessThan(120);

  // The tool's own script missing: the page's sentence shows once the wait is over.
  await page.unroute("**/assets/setup/setup-commands.js*");
  await page.route("**/assets/setup/setup-ui.js*", (route) => route.abort());
  await page.goto(siteRoute("/config/"));
  await expect(tool.locator(".setup-fallback")).toBeVisible({ timeout: 16_000 });
  await expect(tool).toHaveText("The setup tool didn't load. Reload the page.");
  await expect.poll(async () => (await tool.boundingBox()).height).toBeLessThan(120);
});

test("region data loads only when the town step needs it", async ({ page }) => {
  await mockGeocoder(page);
  const boundaries = [];
  page.on("request", (request) => { if (request.url().includes("iata-boundaries.geojson")) boundaries.push(request.url()); });
  await page.goto(siteRoute("/config/"), { waitUntil: "networkidle" });
  await expectStep(page, "type");
  expect(boundaries).toEqual([]);
  await answer(page, "type", "repeater");
  await answer(page, "board", "heltec-v3");
  await answer(page, "status", "new");
  await confirmStep(page, "flash");
  expect(boundaries).toEqual([]);
  await version(page, "v1.16.0");
  await town(page, "Belleville", "ytr");
  expect(boundaries.length).toBe(1);
});

test("region data that fails to load says so, and can be tried again", async ({ page }) => {
  let down = true;
  await page.route("**/iata-boundaries.geojson*", (route) => (down ? route.fulfill({ status: 503, body: "" }) : route.continue()));
  await openLink(page, "/config/?type=repeater&board=heltec-v3&status=running&reflash=0", { to: "town" });
  await expect(page.locator("[data-setup-step] [role='alert']")).toHaveText(T("tool.load-failed", "en"));
  await expect(nextButton(page)).toBeDisabled();
  down = false;
  await page.locator("[data-setup-retry]").click();
  await expect(page.locator("[data-setup-step] [role='alert']")).toHaveCount(0);
  await mockGeocoder(page);
  await searchTown(page, "Belleville");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
});

test("a language switch that reopens on the commands waits for slow region data before the lines are read", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=heltec-v3&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
  // The other language's page draws the commands screen at once, with a loading panel until the region data arrives.
  let delayed = 0;
  await page.route("**/iata-boundaries.geojson*", async (route) => {
    delayed += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expectStep(page, "commands");
  const lines = await commandLines(page);
  expect(delayed).toBeGreaterThan(0);
  expect(lines).toContain("region def ytr|* on|* onqc|* can|* na");
});

test("language switch keeps the answers", async ({ page }) => {
  await page.goto(siteRoute("/config/"));
  await answer(page, "type", "observer");
  await answer(page, "repeat", "listen");
  await expectStep(page, "board");
  await choose(page, "heltec-v4");
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  // The same screen in French, with the answers kept.
  await expectStep(page, "board");
  await expect(progress(page)).toContainText(T("step.board", "fr"));
  await expect(page.locator('[data-setup-choice="heltec-v4"]')).toHaveAttribute("aria-pressed", "true");
  await next(page);
  await expectStep(page, "status");
});

test("language switch on the commands screen after flashing keeps the place and the commands", async ({ page }) => {
  await page.goto(siteRoute(`/config/?type=repeater&board=rak4631&status=new&role=city&name=Belleville_R1&${BELLEVILLE}`));
  await confirmStep(page, "bootloader");
  await confirmStep(page, "flash");
  await version(page, "v1.15.0");
  for (const id of ["town", "role", "name"]) {
    await expectStep(page, id);
    await next(page);
  }
  await expectStep(page, "commands");
  const english = await commandLines(page);
  await page.locator('[data-setup-command="name"] [data-done]').click();
  // The flashed and bootloader ticks and the firmware version never go in the address, even while switching.
  expect(page.url()).not.toMatch(/flashed|bootloader|firmware|step=/);
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expectStep(page, "commands");
  const french = await commandLines(page);
  const notPassword = (line) => !line.startsWith("password ");
  expect(french.filter(notPassword)).toEqual(english.filter(notPassword));
  // The version came across too: firmware 1.15 still gets one `region put` line per label.
  expect(french).toContain("region put ytr");
  expect(french).toContain(`password <${T("ph.password", "fr")}>`);
  await expect(page.locator('[data-setup-command="name"] [data-done]')).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).not.toMatch(/flashed|bootloader|firmware|step=/);
  // A plain reload is a fresh start of this tab's page: the flash ticks have to be given again.
  await page.reload();
  await expectStep(page, "bootloader");
});

test("copy works on plain HTTP", async ({ page }) => {
  await page.addInitScript(() => {
    // A plain-HTTP preview: no clipboard API, so the page falls back to execCommand.
    Object.defineProperty(window, "isSecureContext", { configurable: true, get: () => false });
    Object.defineProperty(Navigator.prototype, "clipboard", { configurable: true, get: () => undefined });
    window.__copied = [];
    const original = document.execCommand.bind(document);
    document.execCommand = (command, ...rest) => {
      if (command !== "copy") return original(command, ...rest);
      const active = document.activeElement;
      window.__copied.push(active && "value" in active ? active.value : String(window.getSelection()));
      return true;
    };
  });
  await openLink(page, `/config/?type=repeater&board=heltec-v3&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
  const line = page.locator('[data-setup-command="name"]');
  const copy = line.locator("[data-copy]");
  await expect(copy).toContainText(T("commands.copy", "en"));
  await copy.click();
  await expect(copy).toContainText(T("commands.copied", "en"));
  expect(await page.evaluate(() => window.__copied)).toEqual(["set name Belleville_R1"]);
  await expect(copy).toBeFocused();
  await page.locator('[data-setup-command="def"] [data-copy]').click();
  expect(await page.evaluate(() => window.__copied.at(-1))).toBe("region def ytr|* on|* onqc|* can|* na");

  const done = line.locator("[data-done]");
  await expect(done).toHaveAttribute("aria-pressed", "false");
  await done.click();
  await expect(done).toHaveAttribute("aria-pressed", "true");
  await expect(done).toContainText(T("commands.done-ticked", "en"));
  await expect(page.locator("[data-setup-done-count]")).toHaveText(T("commands.progress", "en", { done: 1, total: 14 }));
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "name");
  await next(page);
  await expectStep(page, "commands");
  await expect(page.locator('[data-setup-command="name"] [data-done]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-setup-command="region-show"] [data-done]')).toHaveAttribute("aria-pressed", "false");
});

// Review focus 5: the phone route exists because people do this on a phone.
async function fitsTheScreen(page, label) {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const wide = Array.from(document.querySelectorAll("[data-setup-tool] *"))
      .filter((element) => element.getClientRects().length && element.getBoundingClientRect().right > width + 1)
      .map((element) => element.tagName + "." + element.className + ":" + (element.textContent || "").slice(0, 40));
    return { page: document.documentElement.scrollWidth - width, wide };
  });
  expect(result.page, `${label}: the page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(result.wide, `${label}: wider than the screen`).toEqual([]);
}

async function commandsReachable(page) {
  for (const item of await page.locator("[data-setup-command]").all()) {
    const code = item.locator("code").first();
    expect(await code.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    for (const button of await item.locator("[data-copy], [data-done]").all()) {
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeInViewport();
    }
  }
}

test("phone width", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("mobile-"), "Phone layout");
  test.setTimeout(120_000);
  await mockGeocoder(page);

  // The flash route as a repeater observer at the edge, for the longest region def line.
  await page.goto(siteRoute("/config/"));
  const screens = [
    ["type", "observer"], ["repeat", "both"], ["board", "heltec-v3"], ["status", "new"]
  ];
  for (const [id, value] of screens) {
    await expectStep(page, id);
    if (await page.locator("[data-setup-help]").count()) await page.locator("[data-setup-help]").first().click();
    await choose(page, value);
    await fitsTheScreen(page, id);
    await next(page);
  }
  await expectStep(page, "flash");
  await page.locator("[data-setup-confirm]").check();
  await fitsTheScreen(page, "flash");
  await next(page);
  await expectStep(page, "version");
  await page.locator("[data-setup-version]").fill("hello");
  await fitsTheScreen(page, "version");
  await page.locator("[data-setup-version]").fill("v1.16.0");
  await next(page);
  await expectStep(page, "town");
  await page.locator("[data-setup-help]").click();
  await searchTown(page, "Saint-Jean");
  await expect(page.locator("[data-setup-step] [data-setup-choice]")).toHaveCount(3);
  await fitsTheScreen(page, "town choices");
  await searchTown(page, "Belleville");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await fitsTheScreen(page, "town");
  await next(page);
  await expectStep(page, "role");
  await page.locator("[data-setup-help]").click();
  await choose(page, "edge");
  await fitsTheScreen(page, "role");
  await next(page);
  await expectStep(page, "neighbours");
  for (const tag of ["xph", "ygk", "yow", "yqa"]) await page.locator(`[data-setup-neighbour="${tag}"] input`).check();
  for (const id of ["western-new-york", "ohio", "ontario-new-york", "pennsylvania"]) await page.locator(`[data-setup-external="${id}"] input`).check();
  await fitsTheScreen(page, "neighbours");
  await next(page);
  await expectStep(page, "name");
  await fitsTheScreen(page, "name");
  await next(page);
  await expectStep(page, "commands");
  await page.locator("[data-setup-help]").first().click();
  const def = page.locator('[data-setup-command="def"] code');
  // Cross-border networks keep the order the screen lists them in, whatever order they were ticked.
  await expect(def).toHaveText("region def ytr|* xph|* ygk|* yow|* yqa|* on|* onqc|* can|* na|* onny|* us us-oh|us us-pa|us us-ny");
  // The long line wraps instead of scrolling.
  expect(await def.evaluate((element) => element.getBoundingClientRect().height > 2 * parseFloat(getComputedStyle(element).lineHeight))).toBe(true);
  await fitsTheScreen(page, "commands");
  await commandsReachable(page);
  await next(page);
  await expectStep(page, "check");
  await fitsTheScreen(page, "check");

  // The phone route, in French.
  await page.goto(siteRoute("/fr/config/"));
  await answer(page, "type", "repeater");
  await answer(page, "board", "rak4631");
  await answer(page, "status", "running");
  await fitsTheScreen(page, "reflash");
  await answer(page, "reflash", "no");
  await expectStep(page, "version");
  await fitsTheScreen(page, "version (phone)");
  await version(page, "v1.16.0");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Belleville_R1");
  await fitsTheScreen(page, "name (phone)");
  await next(page);
  await expectStep(page, "commands");
  await page.locator("[data-setup-reply]").fill("*^ F\n can F\n  on F\n   ott F");
  await expect(codes(page)).toContainText(["region remove ott"]);
  await fitsTheScreen(page, "commands (phone)");
  await commandsReachable(page);
  await next(page);
  await expectStep(page, "check");
  await fitsTheScreen(page, "check (phone)");
});

async function expectNoSeriousAxe(page, label) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = result.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact))
    .map((violation) => ({ id: violation.id, help: violation.help, targets: violation.nodes.map((node) => node.target) }));
  expect(blocking, `${label}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
}

for (const lang of LANGS) {
  test(`${lang} accessibility`, async ({ page }) => {
    await page.goto(siteRoute(ROUTES[lang]));
    await expectStep(page, "type");
    await expectNoSeriousAxe(page, "first question");
    const help = page.locator("[data-setup-help]");
    await expect(help).toHaveAttribute("aria-expanded", "false");
    await help.click();
    await expect(help).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-setup-help-text]")).toContainText(T("type.help", lang));
    await expect(page.locator("[data-setup-help-text] a")).toHaveAttribute("href", /config\/guide\/#what-a-repeater-is$/);
    await expectNoSeriousAxe(page, "help open");
    // Next moves focus to the new question so keyboard and screen-reader users follow.
    await choose(page, "observer");
    await nextButton(page).click();
    await expectStep(page, "repeat");
    await expect(page.locator("[data-setup-step] h2")).toBeFocused();

    await openLink(page, `${ROUTES[lang]}?type=observer&repeat=both&board=heltec-v3&status=running&observerFirmware=yes&role=edge&neighbours=ygk&name=Belleville_Obs1&${BELLEVILLE}`);
    // The MQTT slot warning comes right before the repeater observer lines.
    const slots = page.locator('[data-setup-note="mqtt-slots"]');
    await expect(slots).toContainText(firstSentence(T("note.mqtt-slots", lang)));
    expect(await slots.evaluate((note) => note.nextElementSibling.querySelector("[data-setup-command]").dataset.setupCommand)).toBe("iata");
    await page.locator("[data-setup-reply]").fill("*^ F\n ott F");
    await page.locator('[data-setup-command="name"] [data-done]').click();
    await page.locator("[data-setup-help]").first().click();
    await expectNoSeriousAxe(page, "commands");
  });
}
