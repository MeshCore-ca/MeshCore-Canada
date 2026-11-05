import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./site-fixtures.mjs";
import { siteRoute } from "./site-route.mjs";
import {
  T, plain, firstSentence, linked, mockGeocoder, step, nextButton, progress, codes, expectStep, next, choose, answer,
  confirmStep, version, searchTown, town, scopeLines, commandLines, openLink, nextUntil, location, pinBox
} from "./setup-helpers.mjs";
import { Z } from "./zone-map-helpers.mjs";

// The guided setup tool at /config/. Shared helpers (the text table, the geocoder mock, the step
// helpers) live in setup-helpers.mjs, which the specs that retarget old configurator cases also use.
const ROUTES = { en: "/config/", fr: "/fr/config/" };
const LANGS = ["en", "fr"];

const BELLEVILLE = "town=Belleville&lat=44.1628&lon=-77.3832&tag=ytr&province=on";

const BELLEVILLE_COMMANDS = (lang) => ["set radio 910.525,62.5,7,5", "set name Belleville_R1", "set lat 44.1628", "set lon -77.3832",
  `password <${T("ph.password", lang)}>`, "set path.hash.mode 2", "set advert.interval 240", "set flood.advert.interval 47", "set flood.max 16",
  "region def ytr|* on|* onqc|* can|* na", "region allowf *", "region default ytr", "region save", "reboot"];

for (const lang of LANGS) {
  test(`${lang} new nRF52 city repeater in Belleville, one question per screen`, async ({ page }) => {
    await mockGeocoder(page);
    await page.goto(siteRoute(ROUTES[lang]));
    await expectStep(page, "type");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 1, total: 10, label: T("step.type", lang) }));
    await expect(nextButton(page)).toBeDisabled();
    await expect(page.locator("[data-setup-back]")).toBeDisabled();
    await answer(page, "type", "repeater");
    await expectStep(page, "board");
    await expect(nextButton(page)).toBeDisabled();
    // Chip names show as written: nRF52, not NRF52.
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveCSS("text-transform", "none");
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveText(T("board.nrf52", lang));
    await choose(page, "nrf52");
    // An nRF52 board adds the bootloader step.
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 2, total: 11, label: T("step.board", lang) }));
    await next(page);
    await answer(page, "status", "new");
    await confirmStep(page, "bootloader");
    await confirmStep(page, "flash");
    // A board that is being flashed gets the newest firmware, so there's no firmware question.
    await expectStep(page, "town");
    await expect(nextButton(page)).toBeDisabled();
    await searchTown(page, "Belleville");
    await expect(page.locator("[data-setup-region]")).toContainText("ytr");
    await expect(page.locator("[data-setup-region]")).toContainText(T("town.region", lang, { name: "Quinte West" }));
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await expect(page.locator("[data-setup-name]")).toHaveValue("Belleville_R1");
    // Where maps show it is the next screen, not a tick on this one.
    await expect(step(page).locator("input[type=checkbox]")).toHaveCount(0);
    await next(page);
    await expectStep(page, "location");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 9, total: 11, label: T("step.location", lang) }));
    // The pin starts at the town the search found, and location is on.
    await expect(pinBox(page, "lat")).toHaveValue("44.1628");
    await expect(pinBox(page, "lon")).toHaveValue("-77.3832");
    await expect(page.locator("[data-setup-location-off]")).not.toBeChecked();
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

  test(`${lang} the board step asks what kind of board it is: two choices, each with examples`, async ({ page }) => {
    await page.goto(siteRoute(ROUTES[lang]));
    await answer(page, "type", "repeater");
    await expectStep(page, "board");
    await expect(page.getByRole("heading", { level: 2, name: T("board.question", lang) })).toBeVisible();
    // Exactly two cards, nRF52 then ESP32, with no list of boards.
    await expect(page.locator("[data-setup-step] [data-setup-choice]")).toHaveText([T("board.nrf52", lang), T("board.esp32", lang)]);
    await expect(page.locator("[data-setup-card]")).toHaveCount(2);
    for (const kind of ["nrf52", "esp32"]) {
      const card = page.locator(`[data-setup-card="${kind}"]`);
      await expect(card.getByText(T(`board.${kind}.detail`, lang), { exact: true })).toBeVisible();
      await expect(card.getByText(T(`board.${kind}.examples`, lang), { exact: true })).toBeVisible();
      await expect(page.locator(`[data-setup-choice="${kind}"]`)).toBeEnabled();
      // Read out with the card's name.
      await expect(page.locator(`[data-setup-choice="${kind}"]`)).toHaveAccessibleDescription(`${T(`board.${kind}.detail`, lang)} ${T(`board.${kind}.examples`, lang)}`);
    }
    // Not sure? Plain words: Wi-Fi means ESP32. No link to leave the tool for.
    await expect(step(page).getByText(T("board.hint", lang), { exact: true })).toBeVisible();
    await expect(step(page).locator("a[href*='flasher.meshcore.io']")).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    // A pick is remembered in the address as the kind, and an nRF52 repeater is told what comes next.
    await choose(page, "nrf52");
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveAttribute("aria-pressed", "true");
    await expect(step(page)).toContainText(T("board.nrf52-next", lang));
    // The hint reads on its own; the bootloader note that fits the pick follows it.
    expect(await step(page).locator(".setup-hint, .setup-note").evaluateAll((nodes) => nodes.map((node) => node.className.includes("setup-hint") ? "hint" : "note"))).toEqual(["hint", "note"]);
    await expect.poll(() => new URL(page.url()).searchParams.get("board")).toBe("nrf52");
    await choose(page, "esp32");
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveAttribute("aria-pressed", "false");
    await expect(step(page)).not.toContainText(T("board.nrf52-next", lang));
    await expect.poll(() => new URL(page.url()).searchParams.get("board")).toBe("esp32");
    await expect(nextButton(page)).toBeEnabled();
  });

  test(`${lang} repeater observer: nRF52 is disabled with an explanation and a switch to plain repeater`, async ({ page }) => {
    await page.goto(siteRoute(ROUTES[lang]));
    await answer(page, "type", "observer");
    await answer(page, "repeat", "both");
    await expectStep(page, "board");
    await expect(page.locator("[data-setup-step] [data-setup-choice]")).toHaveCount(2);
    await expect(page.locator('[data-setup-choice="nrf52"]')).toBeDisabled();
    await expect(page.locator('[data-setup-choice="esp32"]')).toBeEnabled();
    // The reason is on the card and read out with the kind's name, next to the examples that tell it apart.
    await expect(page.locator('[data-setup-card="nrf52"]')).toContainText(T("board.no-wifi.detail", lang));
    await expect(page.locator('[data-setup-card="nrf52"]')).toContainText(T("board.nrf52.examples", lang));
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveAccessibleDescription(`${T("board.no-wifi.detail", lang)} ${T("board.nrf52.examples", lang)}`);
    // Nothing picked yet: the reason and the way out are shown, under the hint.
    await expect(step(page)).toContainText(T("board.observer-nrf52", lang));
    await expect(page.locator("[data-setup-as-repeater]")).toBeVisible();
    await expect(nextButton(page)).toBeDisabled();
    // Clicking the greyed-out card changes nothing.
    await page.locator('[data-setup-card="nrf52"]').click();
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveAttribute("aria-pressed", "false");
    await expect(nextButton(page)).toBeDisabled();
    // An ESP32 board can still be missing from the observer flasher: say so before going on. The nRF52 warning
    // and its switch have done their job, so they go.
    await choose(page, "esp32");
    await expect(step(page)).toContainText(T("board.other-observer", lang));
    await expect(step(page)).not.toContainText(T("board.observer-nrf52", lang));
    await expect(page.locator("[data-setup-as-repeater]")).toHaveCount(0);
    await expect(nextButton(page)).toBeEnabled();
    // The hint comes first, then the note that fits the pick.
    const order = await step(page).locator(".setup-hint, .setup-note").evaluateAll((nodes) => nodes.map((node) => node.className.includes("setup-hint") ? "hint" : "note"));
    expect(order).toEqual(["hint", "note"]);
    // The switch to a plain repeater, from a board step with nothing picked.
    await page.goto(siteRoute(ROUTES[lang]));
    await answer(page, "type", "observer");
    await answer(page, "repeat", "both");
    await expectStep(page, "board");
    await page.locator("[data-setup-as-repeater]").click();
    await expectStep(page, "board");
    await expect(progress(page)).toHaveText(T("nav.progress", lang, { n: 2, total: 10, label: T("step.board", lang) }));
    await expect(page.locator('[data-setup-choice="nrf52"]')).toBeEnabled();
    await expect(page.locator("[data-setup-as-repeater]")).toHaveCount(0);
    await expect(page.locator('[data-setup-card="nrf52"]')).not.toContainText(T("board.no-wifi.detail", lang));
    await choose(page, "nrf52");
    await expect(page.locator('[data-setup-choice="nrf52"]')).toHaveAttribute("aria-pressed", "true");
    await next(page);
    await expectStep(page, "status");
    await page.locator("[data-setup-back]").click();
    await page.locator("[data-setup-back]").click();
    await expectStep(page, "type");
    await expect(page.locator('[data-setup-choice="repeater"]')).toHaveAttribute("aria-pressed", "true");
  });
}

// Links made when the step listed every board carry a board id such as board=rak4631.
test("a link made before the kind question still opens: each old board id becomes its kind", async ({ page }) => {
  const cases = [["rak4631", "nrf52"], ["heltec-t114", "nrf52"], ["xiao-nrf52840", "nrf52"], ["other-nrf52", "nrf52"],
    ["heltec-v3", "esp32"], ["heltec-v4", "esp32"], ["t-beam", "esp32"], ["xiao-esp32s3", "esp32"], ["other-esp32", "esp32"]];
  for (const [old, kind] of cases) {
    await page.goto(siteRoute(`/config/?type=repeater&board=${old}&status=new`));
    // The kind decides the steps: an nRF52 repeater updates its bootloader first.
    if (kind === "nrf52") await expect(progress(page)).toHaveText(T("nav.progress", "en", { n: 4, total: 11, label: T("step.bootloader", "en") }));
    else await expect(progress(page)).toHaveText(T("nav.progress", "en", { n: 4, total: 10, label: T("step.flash", "en") }));
    // The address is rewritten with the kind.
    await expect.poll(() => new URL(page.url()).searchParams.get("board"), old).toBe(kind);
    await page.locator("[data-setup-back]").click();
    await page.locator("[data-setup-back]").click();
    await expectStep(page, "board");
    await expect(page.locator(`[data-setup-choice="${kind}"]`), old).toHaveAttribute("aria-pressed", "true");
  }
  // An old nRF52 link for an observer stays blocked.
  await page.goto(siteRoute("/config/?type=observer&repeat=both&board=rak4631"));
  await expectStep(page, "board");
  await expect(page.locator('[data-setup-choice="nrf52"]')).toBeDisabled();
  await expect(page.locator('[data-setup-card="nrf52"]')).not.toHaveClass(/is-picked/);
  await expect(nextButton(page)).toBeDisabled();
});

// Each question's "?" opens a short answer and one link to the matching section of the guide.
async function expectHelp(page, id, anchor, lang = "en") {
  await expectStep(page, id);
  const toggle = page.locator("[data-setup-step] [data-setup-help]");
  await expect(toggle, `${id} has a ?`).toHaveCount(1);
  await expect(page.locator("[data-setup-help-text]")).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const help = page.locator("[data-setup-help-text]");
  await expect(help).toContainText(plain(`${id}.help`, lang));
  const guide = help.locator('a[href*="config/guide/"]');
  await expect(guide, `${id}: one guide link`).toHaveCount(1);
  await expect(guide).toHaveAttribute("href", new RegExp(`config/guide/#${anchor}$`));
}

for (const lang of LANGS) {
  test(`${lang} every question has a ? with a short answer and a link to the guide`, async ({ page }) => {
    // A new board flashed in Vancouver, at the edge: the route that asks the most questions.
    // The firmware question belongs to the phone route; its ? is checked with the version tests.
    await page.goto(siteRoute(`${ROUTES[lang]}?tag=yvr&province=bc`));
    await expectHelp(page, "type", "what-a-repeater-is", lang);
    await choose(page, "repeater");
    await next(page);
    await expectHelp(page, "board", "repeater-observers", lang);
    await choose(page, "esp32");
    await next(page);
    await expectHelp(page, "status", "back-up", lang);
    await choose(page, "new");
    await next(page);
    await confirmStep(page, "flash");
    await expectHelp(page, "town", "scopes-and-regions", lang);
    await next(page);
    await expectHelp(page, "radio", "settings", lang);
    await choose(page, "canada");
    await next(page);
    await expectHelp(page, "role", "city-or-edge", lang);
    await choose(page, "edge");
    await next(page);
    await expectHelp(page, "neighbours", "city-or-edge", lang);
    await page.locator('[data-setup-neighbour="none"] input').check();
    await next(page);
    await expectHelp(page, "name", "settings", lang);
    // No town was searched, so no name is suggested.
    await page.locator("[data-setup-name]").fill("Test_R1");
    await next(page);
    await expectHelp(page, "location", "settings", lang);
  });
}

test("a greyed-out nRF52 board from a link is not picked and can't be clicked", async ({ page }) => {
  await page.goto(siteRoute("/config/?type=observer&repeat=both&board=nrf52"));
  await expectStep(page, "board");
  const nrf = page.locator('[data-setup-choice="nrf52"]');
  await expect(nrf).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator('[data-setup-card="nrf52"]')).not.toHaveClass(/is-picked/);
  await page.locator('[data-setup-card="nrf52"]').click();
  await expect(nrf).toHaveAttribute("aria-pressed", "false");
  await expect(nextButton(page)).toBeDisabled();
  // The blocked pick still gets the warning and the switch; choosing ESP32 takes them away.
  await expect(page.locator("[data-setup-as-repeater]")).toBeVisible();
  await choose(page, "esp32");
  await expect(nextButton(page)).toBeEnabled();
  await expect(page.locator("[data-setup-as-repeater]")).toHaveCount(0);
});

test("running repeater via phone", async ({ page }) => {
  await mockGeocoder(page);
  await page.goto(siteRoute("/config/"));
  await answer(page, "type", "repeater");
  await answer(page, "board", "nrf52");
  await expectStep(page, "status");
  await choose(page, "running");
  // The back-up warning says how: the private key comes off with `get prv.key`, from the app's Command Line or over USB.
  await expect(step(page).locator(".setup-note--warn")).toHaveText(linked("status.backup", "en"));
  await expect(step(page).locator(".setup-note--warn a")).toHaveAttribute("href", "https://flasher.meshcore.io/");
  await next(page);
  await answer(page, "reflash", "no");
  await expectStep(page, "version");
  // No bootloader or flash steps: everything happens in the app.
  await expect(progress(page)).toHaveText(T("nav.progress", "en", { n: 5, total: 11, label: T("step.version", "en") }));
  // The app's login steps and screenshots are on the commands screen; this question is only the choice.
  await expect(page.locator("[data-setup-phone-steps]")).toHaveCount(0);
  await version(page, "1.15");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  // A running repeater already has a name: nothing is suggested, so it isn't renamed by accident.
  await expect(page.locator("[data-setup-name]")).toHaveValue("");
  await expect(step(page)).toContainText(plain("name.hint.running", "en"));
  await expect(nextButton(page)).toBeDisabled();
  await page.locator("[data-setup-name]").fill("Quinte-Hill");
  await next(page);
  await location(page);
  await expectStep(page, "commands");
  await expect(step(page)).toContainText(T("commands.question.phone", "en"));
  expect(await commandLines(page)).toContain("set name Quinte-Hill");
  const steps = page.locator("[data-setup-phone-steps]");
  await expect(steps).toContainText(T("commands.phone.step1", "en"));
  await expect(steps).toContainText(T("commands.phone.step3", "en"));
  const images = steps.locator("img");
  expect(await images.evaluateAll((list) => list.map((image) => new URL(image.src).pathname.split("/").pop()))).toEqual([
    "repeater-01-contacts.webp", "repeater-02-login.webp", "repeater-03-admin.webp"
  ]);
  for (const image of await images.all()) {
    await expect(image).toHaveAttribute("alt", /\w{4}/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  }
  await expect(page.locator('[data-setup-note="radio-phone"]')).toContainText(firstSentence(T("note.radio-phone", "en")));
  expect((await commandLines(page)).some((line) => line.startsWith("set radio"))).toBe(false);
  // The `region` line comes first, with the paste box right after it.
  await expect(page.locator('[data-setup-command="region-show"] code')).toHaveText("region");
  // A reply sent over the radio can be cut short, so the box says what to do then.
  await expect(page.locator(".setup-reply [data-setup-reply-cut]")).toHaveText(plain("region.phone-cut", "en"));
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

test("a running repeater updated over USB still clears its old regions, without the app's cut-off warning", async ({ page }) => {
  await page.goto(siteRoute(`/config/?type=repeater&board=esp32&status=running&reflash=1&role=city&name=Test_R1&${BELLEVILLE}`));
  await confirmStep(page, "flash");
  await nextUntil(page, "commands");
  await expect(page.locator("[data-setup-reply]")).toBeVisible();
  // Over USB the whole reply comes through.
  await expect(page.locator("[data-setup-reply-cut]")).toHaveCount(0);
});

test("edge repeater offers nearby regions and the Ontario cross-border scope", async ({ page }) => {
  await page.goto(siteRoute(`/config/?type=repeater&board=esp32&status=new&${BELLEVILLE}`));
  // A shared link never ticks "flashed" for someone else.
  await confirmStep(page, "flash");
  await expectStep(page, "town");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await next(page);
  await expectStep(page, "role");
  await choose(page, "city");
  // A city repeater can opt into the shared Ontario–New York scope.
  const onny = page.locator('[data-setup-external="onny"] input');
  await onny.check();
  await choose(page, "edge");
  await next(page);
  await expectStep(page, "neighbours");
  expect(await page.locator("[data-setup-neighbour]").evaluateAll((list) => list.map((box) => box.dataset.setupNeighbour)))
    .toEqual(["xph", "ygk", "yow", "yyz", "yqa", "none"]);
  // Ontario lists one scope, and no US network.
  expect(await page.locator("[data-setup-external]").evaluateAll((list) => list.map((box) => box.dataset.setupExternal))).toEqual(["onny"]);
  // Switching to edge kept the shared label.
  await expect(onny).toBeChecked();
  await expect(page.locator('[data-setup-neighbour="ygk"]')).toContainText("Kingston");
  await expect(nextButton(page)).toBeDisabled();
  await page.locator('[data-setup-neighbour="ygk"] input').check();
  await next(page);
  await expectStep(page, "name");
  await next(page);
  await location(page);
  await expectStep(page, "commands");
  const lines = await commandLines(page);
  expect(lines).toContain("region def ytr|* ygk|* on|* onqc|* can|* na|* onny");
  expect(lines).toContain("region denyf *");
  await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", "en", { network: "Ontario–New York (onny)" }));
  // Back to city: the neighbours go, the shared scope stays.
  for (let back = 0; back < 4; back += 1) await page.locator("[data-setup-back]").click();
  await expectStep(page, "role");
  await choose(page, "city");
  await expect(onny).toBeChecked();
  await next(page);
  await expectStep(page, "name");
  await next(page);
  await location(page);
  await expectStep(page, "commands");
  const city = await commandLines(page);
  expect(city).toContain("region def ytr|* on|* onqc|* can|* na|* onny");
  expect(city).toContain("region allowf *");
});

test("a Québec repeater is offered Québec–New York and Québec–Vermont, named and described in each language", async ({ page }) => {
  const words = {
    en: { qcny: ["Québec–New York", "Applied to repeaters that connect New York and Québec."], qcvt: ["Québec–Vermont", "Applied to repeaters that connect Vermont and Québec."] },
    fr: { qcny: ["Québec–New York", "Pour les répéteurs qui relient l’État de New York et le Québec."], qcvt: ["Québec–Vermont", "Pour les répéteurs qui relient le Vermont et le Québec."] }
  };
  for (const lang of LANGS) {
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&town=Montr%C3%A9al&lat=45.5&lon=-73.57&tag=yul&province=qc`, { to: "role" });
    // The role step offers both to a city repeater, with what each is for, and not Ontario's scope.
    expect(await page.locator("[data-setup-external]").evaluateAll((list) => list.map((box) => box.dataset.setupExternal))).toEqual(["qcny", "qcvt"]);
    for (const tag of ["qcny", "qcvt"]) {
      const [name, why] = words[lang][tag];
      await expect(page.locator(`[data-setup-external="${tag}"] .setup-check__name`)).toHaveText(name);
      await expect(page.locator(`[data-setup-external="${tag}"] .setup-check__why`)).toHaveText(why);
    }
    await expect(page.locator('[data-setup-external="onny"]')).toHaveCount(0);
    await page.locator('[data-setup-external="qcny"] input').check();
    await page.locator('[data-setup-external="qcvt"] input').check();
    await next(page);
    await nextUntil(page, "commands");
    expect(await commandLines(page)).toContain("region def yul|* qc|* onqc|* can|* na|* qcny|* qcvt");
    await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", lang, { network: `${words[lang].qcny[0]} (qcny)` }));
    await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", lang, { network: `${words[lang].qcvt[0]} (qcvt)` }));
    // An edge repeater picks them on the neighbours screen, with nothing from the US beside them.
    await page.goto(siteRoute(`${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=edge&town=Montr%C3%A9al&lat=45.5&lon=-73.57&tag=yul&province=qc&neighbours=yow&external=qcny`));
    await version(page, "1.16");
    await nextUntil(page, "neighbours");
    await expect(page.locator("[data-setup-external]")).toHaveCount(2);
    await expect(page.locator('[data-setup-external="qcny"] input')).toBeChecked();
    await expect(page.locator('[data-setup-external="qcvt"] input')).not.toBeChecked();
  }
});

test("ambiguous and unknown towns", async ({ page }) => {
  const queries = await mockGeocoder(page);
  // A running repeater on the phone route: once its version is in, the next question is the town.
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
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

  // The search and the zone map disagree about the province: explain and let the person choose.
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

for (const lang of LANGS) {
  test(`${lang} a starter region or a planning extension says to check with local operators`, async ({ page }) => {
    const root = `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0`;
    const note = page.locator("[data-setup-planning]");
    // Charlottetown is in a starter region.
    await openLink(page, `${root}&tag=yyg&province=pe&town=Charlottetown&lat=46.2382&lon=-63.1311`, { to: "town" });
    await expect(page.locator("[data-setup-region]")).toContainText("yyg");
    await expect(note).toHaveAttribute("data-setup-planning", "starter");
    await expect(note).toHaveText(linked("town.starter", lang));
    await expect(note.locator("a")).toHaveAttribute("href", /config\/guide\/#starter-regions$/);
    // The Wingham-area point is just outside Waterloo's MeshMapper zone.
    await openLink(page, `${root}&tag=ykf&province=on&town=Wingham&lat=43.8678&lon=-81.2619`, { to: "town" });
    await expect(note).toHaveAttribute("data-setup-planning", "extension");
    await expect(note).toHaveText(linked("town.extension", lang));
    await expect(note.locator("a")).toHaveAttribute("href", /config\/guide\/#planning-extensions$/);
    // A MeshMapper zone needs no note.
    await openLink(page, `${root}&${BELLEVILLE}`, { to: "town" });
    await expect(page.locator("[data-setup-region]")).toContainText("ytr");
    await expect(note).toHaveCount(0);
  });
}

for (const lang of LANGS) {
  test(`${lang} once a region is chosen, View on map opens it on the zone map in a new tab`, async ({ page }) => {
    await mockGeocoder(page);
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0`, { to: "town" });
    const view = page.locator("[data-setup-view-map]");
    await expect(view).toHaveCount(0);
    await searchTown(page, "Gatineau");
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
    await expect(view).toHaveText(`${T("town.view-map", lang)} ${T("link.new-tab", lang)}`);
    await expect(view).toHaveAttribute("target", "_blank");
    const href = new URL(await view.getAttribute("href"), page.url());
    expect(href.pathname).toBe(`${ROUTES[lang]}map/`);
    expect(Object.fromEntries(href.searchParams)).toEqual({ tag: "yow", province: "qc" });
    // Right next to the region card.
    expect(await view.evaluate((link) => link.parentElement.previousElementSibling.hasAttribute("data-setup-region"))).toBe(true);
    const [map] = await Promise.all([page.context().waitForEvent("page"), view.click()]);
    await expect(map.locator("[data-zone-card] h2")).toHaveText("YOW · Ottawa–Gatineau");
    await expect(map.locator("[data-zone-where]")).toHaveText("Québec");
    await map.close();
    // The tool keeps its place.
    await expectStep(page, "town");
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
  });
}

for (const lang of LANGS) {
  test(`${lang} View on map tells the zone finder when the spot is in a planning extension`, async ({ page }) => {
    const root = `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0`;
    const view = page.locator("[data-setup-view-map]");
    const params = async () => Object.fromEntries(new URL(await view.getAttribute("href"), page.url()).searchParams);
    // The Wingham-area point is just outside Waterloo's MeshMapper zone.
    await openLink(page, `${root}&tag=ykf&province=on&town=Wingham&lat=43.8678&lon=-81.2619`, { to: "town" });
    await expect(page.locator("[data-setup-planning]")).toHaveAttribute("data-setup-planning", "extension");
    expect(await params()).toEqual({ tag: "ykf", province: "on", part: "extension" });
    const [map] = await Promise.all([page.context().waitForEvent("page"), view.click()]);
    await expect(map.locator("[data-zone-badge]")).toHaveText(Z("badge.extension", lang));
    await map.close();
    // Inside a MeshMapper zone, or in a starter region, there's no part to tell.
    await openLink(page, `${root}&${BELLEVILLE}`, { to: "town" });
    expect(await params()).toEqual({ tag: "ytr", province: "on" });
    await openLink(page, `${root}&tag=yyg&province=pe&town=Charlottetown&lat=46.2382&lon=-63.1311`, { to: "town" });
    expect(await params()).toEqual({ tag: "yyg", province: "pe" });
  });
}

test("town search offline offers a region code and the map", async ({ page }) => {
  await page.route("https://geolocator.api.geo.ca/**", (route) => route.abort());
  await openLink(page, "/fr/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
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
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
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
  await openLink(page, "/config/?place=Guelph%2C%20Ontario&type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  await expect(page.locator("[data-setup-town]")).toHaveValue("Guelph, Ontario");
  await expect(page.locator("[data-setup-region]")).toContainText("ykf");
  expect(queries).toEqual(["Guelph"]);
  // The search ran once; the answers now carry the town instead.
  await expect.poll(() => new URL(page.url()).searchParams.get("place")).toBe(null);
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("ykf");
});

for (const lang of LANGS) {
  test(`${lang} a street address finds its region, names it after the municipality and maps the exact spot`, async ({ page }) => {
    const queries = await mockGeocoder(page);
    await page.goto(siteRoute(`${ROUTES[lang]}?type=repeater&board=esp32&status=new`));
    await confirmStep(page, "flash");
    await expectStep(page, "town");
    // One box for all three, with examples of each.
    await expect(page.locator("label[for='setup-town']")).toHaveText(T("town.label", lang));
    await expect(step(page)).toContainText(plain("town.hint", lang));
    await searchTown(page, "111 Wellington Street, Ottawa");
    // An address is never used without asking, even when it is the only match.
    await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.address-confirm", lang));
    await expect(page.locator("[data-setup-region]")).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await page.locator("[data-setup-step] [data-setup-choice]").filter({ hasText: "111 Wellington Street, Ottawa" }).click();
    await expect(page.locator("[data-setup-region]")).toContainText("yow");
    await expect(page.locator("[data-setup-region]")).toContainText(T("town.region-detail", lang, { town: "111 Wellington Street, Ottawa", province: "Ontario" }));
    // The address search answered, so the town search wasn't asked.
    expect(queries).toEqual(["locate:111 Wellington Street, Ottawa"]);
    // The link carries the place the search found, never the text typed into the box.
    const url = new URL(page.url());
    expect(url.searchParams.get("town")).toBe("111 Wellington Street, Ottawa");
    expect(url.searchParams.get("kind")).toBe("address");
    expect(url.searchParams.get("place")).toBe(null);
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await expect(page.locator("[data-setup-name]")).toHaveValue("Ottawa_R1");
    await next(page);
    // The pin starts at the address, close in.
    await expectStep(page, "location");
    await expect(pinBox(page, "lat")).toHaveValue("45.4231");
    await expect(pinBox(page, "lon")).toHaveValue("-75.6988");
    await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
    await next(page);
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("set lat 45.4231");
    expect(lines).toContain("set lon -75.6988");
    await expect(page.locator('[data-setup-command="lat"]')).toContainText(T("why.lat", lang));
    await expect(page.locator('[data-setup-command="lon"]')).toContainText(T("why.lon", lang));
  });
}

test("disabling location leaves the spot out of the link and the share link; the region still comes back", async ({ page, context }) => {
  await mockGeocoder(page);
  await context.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(Navigator.prototype, "clipboard", {
      configurable: true,
      get: () => ({ writeText: (value) => { window.__copied.push(value); return Promise.resolve(); } })
    });
  });
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0&role=city", { to: "town" });
  await searchTown(page, "44.1628, -77.3832");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await expect.poll(() => new URL(page.url()).searchParams.get("lat")).toBe("44.1628");
  await nextUntil(page, "name");
  await page.locator("[data-setup-name]").fill("Hilltop");
  await next(page);
  await expectStep(page, "location");
  await page.locator("[data-setup-location-off]").check();
  const spot = /(?:^|&)(?:town|kind|lat|lon)=|44\.1628|77\.3832/;
  await expect.poll(() => new URL(page.url()).search).not.toMatch(spot);
  const url = new URL(page.url());
  expect(url.searchParams.get("tag")).toBe("ytr");
  expect(url.searchParams.get("province")).toBe("on");
  expect(url.searchParams.get("shareLocation")).toBe("0");
  await page.locator("[data-setup-share]").click();
  await expect(page.locator("[data-setup-share]")).toHaveText(T("nav.share-done", "en"));
  const shared = (await page.evaluate(() => window.__copied))[0];
  expect(new URL(shared).search).not.toMatch(spot);
  await next(page);
  expect((await commandLines(page)).some((line) => /^set (lat|lon) /.test(line))).toBe(false);
  // Opened again, the link brings back the region without the spot.
  const other = await context.newPage();
  await openLink(other, new URL(shared).pathname + new URL(shared).search, { to: "town" });
  await expect(other.locator("[data-setup-region]")).toContainText("ytr");
  await other.close();
});

test("an address match in another street or town is never used: the typed town is searched instead, or the person is asked", async ({ page }) => {
  const queries = await mockGeocoder(page);
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  // Live: the geocoder's only civic match for this is 22 Picton Court in Winnipeg.
  await searchTown(page, "22 Oak Street, Picton");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await expect(page.locator("[data-setup-region]")).toContainText(T("town.region-detail", "en", { town: "Picton", province: "Ontario" }));
  await expect(page.locator("[data-setup-address-fallback]")).toHaveText(T("town.address-fallback", "en"));
  await expect(page.locator("[data-setup-step]")).not.toContainText("Winnipeg");
  expect(queries).toEqual(["locate:22 Oak Street, Picton", "Picton"]);
  // Picton is a town, so the map position is near it, not at a street spot.
  await expect.poll(() => new URL(page.url()).searchParams.get("kind")).toBe(null);
  await expect.poll(() => new URL(page.url()).searchParams.get("town")).toBe("Picton");
  // The same number, street name and town, but a Drive, not an Avenue: shown, never picked by itself.
  await searchTown(page, "5 Maple Avenue, Belleville");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.address-confirm", "en"));
  await expect(page.locator("[data-setup-step] [data-setup-choice]")).toHaveText([/5 Maple Drive, Belleville/]);
  await expect(page.locator("[data-setup-region]")).toHaveCount(0);
  await expect(page.locator("[data-setup-address-fallback]")).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
});

test("several matching addresses: ask which one, with the region each is in", async ({ page }) => {
  await mockGeocoder(page);
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  const choices = page.locator("[data-setup-step] [data-setup-choice]");
  // No town typed: both streets of that name are what was typed.
  await searchTown(page, "1 Rue Notre-Dame Est");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.addresses", "en"));
  await expect(choices).toHaveCount(2);
  await expect(page.locator("[data-setup-step] [data-setup-card]")).toContainText(["Quebec · North Bay (yyb)", "Quebec · Montreal (yul)"]);
  await expect(nextButton(page)).toBeDisabled();
  await choices.filter({ hasText: "Montréal" }).click();
  await expect(page.locator("[data-setup-region]")).toContainText("yul");
  await expect(nextButton(page)).toBeEnabled();
  // With the town typed, the one in Lorrainville is not offered.
  await searchTown(page, "1 Rue Notre-Dame Est, Montréal");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.address-confirm", "en"));
  await expect(choices).toHaveCount(1);
  await expect(choices).toContainText("1 Rue Notre-Dame Est, Montréal");
});

test("a town with a number in its name falls back to the town search; an address with no match says so", async ({ page }) => {
  const queries = await mockGeocoder(page);
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  await searchTown(page, "150 Mile House");
  await expect(page.locator("[data-setup-region]")).toContainText("yka");
  expect(queries).toEqual(["locate:150 Mile House", "150 Mile House"]);
  // Nothing matches: say so plainly, and offer the region code box.
  await searchTown(page, "999 Nowhere Road, Atlantis");
  await expect(page.locator("[data-setup-town-message]")).toHaveText(T("town.no-address", "en"));
  // The town after the comma was tried too.
  expect(queries.slice(-2)).toEqual(["locate:999 Nowhere Road, Atlantis", "Atlantis"]);
  await expect(page.locator("[data-setup-code]")).toBeVisible();
  await expect(nextButton(page)).toBeDisabled();
});

for (const lang of LANGS) {
  test(`${lang} coordinates are read on the page, never sent to a search, and name it after the region`, async ({ page }) => {
    const queries = await mockGeocoder(page);
    await page.goto(siteRoute(`${ROUTES[lang]}?type=repeater&board=esp32&status=new`));
    await confirmStep(page, "flash");
    await expectStep(page, "town");
    // Outside Canada (the longitude's minus sign forgotten): say how to type them.
    await searchTown(page, "44.1628, 77.3832");
    await expect(page.locator("[data-setup-town-message]")).toHaveText(plain("town.outside", lang));
    await expect(nextButton(page)).toBeDisabled();
    // French decimal commas, with a semicolon between the two.
    await searchTown(page, lang === "fr" ? "44,162812; -77,383241" : "44.162812, -77.383241");
    await expect(page.locator("[data-setup-region]")).toContainText("ytr");
    await expect(page.locator("[data-setup-region]")).toContainText(T("town.region-detail", lang, { town: "44.1628, -77.3832", province: "Ontario" }));
    expect(queries).toEqual([]);
    const url = new URL(page.url());
    expect(url.searchParams.get("kind")).toBe("coordinates");
    expect(url.searchParams.get("lat")).toBe("44.1628");
    expect(url.searchParams.get("place")).toBe(null);
    expect(url.search).not.toMatch(/162812|383241/);
    await next(page);
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await expect(page.locator("[data-setup-name]")).toHaveValue("QuinteWest_R1");
    await next(page);
    // The pin starts at the typed coordinates, rounded to 4 decimals.
    await expectStep(page, "location");
    await expect(pinBox(page, "lat")).toHaveValue("44.1628");
    await expect(pinBox(page, "lon")).toHaveValue("-77.3832");
    await next(page);
    const lines = await commandLines(page);
    expect(lines).toContain("set lat 44.1628");
    expect(lines).toContain("set lon -77.3832");
    await expect(page.locator('[data-setup-command="lat"]')).toContainText(T("why.lat", lang));
    expect(queries).toEqual([]);
  });
}

for (const lang of LANGS) {
  test(`${lang} a name can have spaces and accents; a refused character or a long name says why`, async ({ page }) => {
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&${BELLEVILLE}`, { to: "name" });
    const input = page.locator("[data-setup-name]");
    const message = page.locator("[data-setup-name-message]");
    await expect(step(page)).toContainText(plain("name.hint.running", lang));
    await input.fill("Hill:Top");
    await expect(message).toHaveText(plain("name.invalid-characters", lang));
    await expect(nextButton(page)).toBeDisabled();
    // 16 accented letters are 32 bytes: one too many.
    await input.fill("é".repeat(16));
    await expect(message).toHaveText(plain("name.too-long", lang));
    await expect(nextButton(page)).toBeDisabled();
    // Spaces alone are not a name, and need no message.
    await input.fill("   ");
    await expect(message).toHaveText("");
    await expect(nextButton(page)).toBeDisabled();
    // Spaces round the name are dropped.
    await input.fill("  Café Hilltop ");
    await expect(message).toHaveText("");
    await expect.poll(() => new URL(page.url()).searchParams.get("name")).toBe("Café Hilltop");
    await next(page);
    await location(page);
    await expectStep(page, "commands");
    expect(await commandLines(page)).toContain("set name Café Hilltop");
    await next(page);
    await expectStep(page, "check");
    await expect(page.locator('[data-setup-check="name"]')).toContainText(T("check.name", lang, { name: "Café Hilltop" }));
  });
}

test("coordinates in every common form stay on the page; ones that can't be read say how to type them", async ({ page }) => {
  const queries = await mockGeocoder(page);
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  for (const typed of ["44,1628 -77,3832", "44,1628, -77,3832", "N44.1628 W77.3832", "44.1628° N, 77.3832° W", "44.1628° N, 77.3832° O",
    "(44.1628, -77.3832)", "44.1628, \u221277.3832", "44°09'46.1\"N 77°22'59.5\"W"]) {
    await searchTown(page, typed);
    await expect(page.locator("[data-setup-region]"), typed).toContainText(T("town.region-detail", "en", { town: "44.1628, -77.3832", province: "Ontario" }));
  }
  for (const typed of ["44.1628", "N44.1628 N77.3832", "44°61'N 77°W", "44.1628, -77.3832, 12"]) {
    await searchTown(page, typed);
    await expect(page.locator("[data-setup-town-message]"), typed).toHaveText(plain("town.coordinates-format", "en"));
    await expect(nextButton(page)).toBeDisabled();
  }
  // None of them reached the place search.
  expect(queries).toEqual([]);
});

// The firmware question belongs to a board that is left as it is: it can run anything from 1.14 up.
const PHONE_LINK = `type=repeater&board=esp32&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`;
const OLDER_LABEL = { en: "Older than 1.14", fr: "Plus ancienne que 1.14" };

for (const lang of LANGS) {
  test(`${lang} the firmware question on the phone route is four choices with a plain hint`, async ({ page }) => {
    await page.goto(siteRoute(`${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0`));
    await expectStep(page, "version");
    await expect(page.getByRole("heading", { level: 2, name: T("version.question", lang) })).toBeVisible();
    // Four cards, newest first, each with its one-line description. The labels are the same in both languages.
    await expect(page.locator("[data-setup-step] [data-setup-choice]")).toHaveText(["1.16.0+", "1.15.x", "1.14.x", OLDER_LABEL[lang]]);
    await expect(page.locator("[data-setup-card]")).toHaveCount(4);
    for (const value of ["1.16", "1.15", "1.14", "older"]) {
      const card = page.locator(`[data-setup-card="${value}"]`);
      await expect(card.getByText(T(`version.${value}.detail`, lang), { exact: true })).toBeVisible();
      await expect(page.locator(`[data-setup-choice="${value}"]`)).toHaveAccessibleDescription(T(`version.${value}.detail`, lang));
    }
    // Not sure? Send `ver`. No box to paste into, and no screenshots here: those are on the commands screen.
    await expect(step(page).locator(".setup-hint")).toHaveText(plain("version.hint", lang));
    await expect(step(page).locator(".setup-hint code")).toHaveText("ver");
    await expect(page.locator("[data-setup-version], [data-setup-phone-steps]")).toHaveCount(0);
    // Nothing is picked for the person.
    await expect(step(page).locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(nextButton(page)).toBeDisabled();
    await expectHelp(page, "version", "older-firmware", lang);
    await choose(page, "1.15");
    await expect(page.locator('[data-setup-choice="1.15"]')).toHaveAttribute("aria-pressed", "true");
    await expect(nextButton(page)).toBeEnabled();
    await choose(page, "1.14");
    await expect(page.locator('[data-setup-choice="1.15"]')).toHaveAttribute("aria-pressed", "false");
    // The firmware stays out of the address: it is the one answer a link can't carry.
    expect(new URL(page.url()).searchParams.has("firmware")).toBe(false);
  });
}

test("the picked firmware sets the region lines: 1.16.0+ one def line, 1.15.x put lines, 1.14.x put and allowf lines", async ({ page }) => {
  await mockGeocoder(page);
  const expected = {
    "1.16": ["region", "region def ytr|* on|* onqc|* can|* na", "region allowf *", "region default ytr", "region save"],
    "1.15": ["region", "region put ytr", "region put on", "region put onqc", "region put can", "region put na", "region allowf *", "region default ytr", "region save"],
    "1.14": ["region", "region put ytr", "region allowf ytr", "region put on", "region allowf on", "region put onqc", "region allowf onqc",
      "region put can", "region allowf can", "region put na", "region allowf na", "region allowf *", "region save"]
  };
  for (const [firmware, lines] of Object.entries(expected)) {
    await openLink(page, `/config/?${PHONE_LINK}`, { firmware });
    // The command on each line, not the `region allowf` an explanation mentions.
    await expect(page.locator("[data-setup-command] .setup-command__code").first()).toBeVisible();
    const commands = await page.locator("[data-setup-command] .setup-command__code").allTextContents();
    expect(scopeLines(commands), firmware).toEqual(lines);
  }
});

test("a board that is flashed is never asked its firmware: the newest is assumed", async ({ page }) => {
  await mockGeocoder(page);
  const flashed = [
    ["a new board", `type=repeater&board=esp32&status=new&role=city&name=Belleville_R1&${BELLEVILLE}`, ["flash"]],
    ["a running board that is updated", `type=repeater&board=nrf52&status=running&reflash=1&role=city&name=Belleville_R1&${BELLEVILLE}`, ["bootloader", "flash"]],
    ["a running observer that needs the observer firmware", `type=observer&repeat=both&board=esp32&status=running&observerFirmware=no&role=city&name=Belleville_Obs1&${BELLEVILLE}`, ["flash"]]
  ];
  for (const [label, query, confirms] of flashed) {
    await page.goto(siteRoute(`/config/?${query}`));
    for (const id of confirms) await confirmStep(page, id);
    await expectStep(page, "town");
    await expect(progress(page)).not.toContainText(T("step.version", "en"));
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines.filter((line) => line.startsWith("region def ")), label).toHaveLength(1);
    expect(lines.some((line) => line.startsWith("region put")), label).toBe(false);
    expect(lines, label).toContain("region default ytr");
  }
});

test("Older than 1.14 blocks Next and offers the update, which removes the question and assumes the newest firmware", async ({ page }) => {
  await mockGeocoder(page);
  // The update goes to the flash steps the board needs: a repeater (nRF52 has its bootloader first) or an observer.
  const boards = [
    ["type=repeater&board=esp32&status=running&reflash=0", "flash", "reflash", "1"],
    ["type=repeater&board=nrf52&status=running&reflash=0", "bootloader", "reflash", "1"],
    ["type=observer&repeat=both&board=esp32&status=running&observerFirmware=yes", "flash", "observerFirmware", "no"]
  ];
  for (const [query, first, key, value] of boards) {
    await page.goto(siteRoute(`/config/?${query}&${BELLEVILLE}&role=city&name=Belleville_R1`));
    await expectStep(page, "version");
    await choose(page, "older");
    await expect(page.locator('[data-setup-choice="older"]')).toHaveAttribute("aria-pressed", "true");
    // The card says to update first; under the choices there is only the button, and no second warning.
    await expect(page.locator('[data-setup-card="older"]')).toContainText(T("version.older.detail", "en"));
    await expect(step(page).locator(".setup-note")).toHaveCount(0);
    await expect(page.locator("[data-setup-update]")).toHaveText("Update its firmware now");
    // Screen readers hear that the update button appeared.
    await expect(page.locator("[data-setup-live]")).toHaveText(`${T("version.older.detail", "en")} ${T("version.update", "en")}`);
    await expect(nextButton(page)).toBeDisabled();
    expect(new URL(page.url()).searchParams.has("firmware")).toBe(false);
    // Picking a supported version takes the note away; picking Older again brings it back.
    await choose(page, "1.14");
    await expect(page.locator("[data-setup-update]")).toHaveCount(0);
    await expect(nextButton(page)).toBeEnabled();
    await choose(page, "older");
    await expect(nextButton(page)).toBeDisabled();
    await page.locator("[data-setup-update]").click();
    await expectStep(page, first);
    await expect.poll(() => new URL(page.url()).searchParams.get(key)).toBe(value);
    if (first === "bootloader") await confirmStep(page, "bootloader");
    await confirmStep(page, "flash");
    // The board is flashed now, so the version question is gone and the newest firmware is assumed.
    await expectStep(page, "town");
    await expect(progress(page)).not.toContainText(T("step.version", "en"));
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines.filter((line) => line.startsWith("region def "))).toHaveLength(1);
    expect(lines.some((line) => line.startsWith("region put"))).toBe(false);
  }
});

test("changing the town clears neighbours and the suggested name", async ({ page }) => {
  await mockGeocoder(page);
  await page.goto(siteRoute(`/config/?type=repeater&board=esp32&status=new&role=edge&neighbours=ygk&name=Belleville_R1&${BELLEVILLE}`));
  await confirmStep(page, "flash");
  // A pin the person placed belongs to the town it was placed for: a different town brings its own point.
  await nextUntil(page, "location");
  await pinBox(page, "lat").fill("44.17");
  await pinBox(page, "lon").fill("-77.39");
  await expect.poll(() => searchParam(page, "lat")).toBe("44.17");
  for (const id of ["name", "neighbours", "role", "town"]) {
    await page.locator("[data-setup-back]").click();
    await expectStep(page, id);
  }
  await town(page, "Kingston", "ygk");
  await expectStep(page, "role");
  await expect(page.locator('[data-setup-choice="edge"]')).toHaveAttribute("aria-pressed", "true");
  await next(page);
  await expectStep(page, "neighbours");
  // The five regions nearest Kingston, closest first, none picked yet.
  expect(await page.locator("[data-setup-neighbour]").evaluateAll((list) => list.map((box) => box.dataset.setupNeighbour)))
    .toEqual(["ytr", "yow", "xph", "yqa", "yyz", "none"]);
  await expect(page.locator("[data-setup-neighbour] input:checked")).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
  await page.locator('[data-setup-neighbour="none"] input').check();
  await next(page);
  await expectStep(page, "name");
  await expect(page.locator("[data-setup-name]")).toHaveValue("Kingston_R1");
  await next(page);
  // The new town brings its own pin, not the one moved for the old town.
  await expectStep(page, "location");
  await expect(pinBox(page, "lat")).toHaveValue("44.2298");
  await expect(pinBox(page, "lon")).toHaveValue("-76.481");
  await expect(marker(page)).toBeVisible();
  expect(searchParam(page, "lat")).toBe("44.2298");
  expect(searchParam(page, "lon")).toBe("-76.481");
  expect(page.url()).not.toMatch(/lat=44\.17(?:&|$)|lon=-77\.39(?:&|$)/);
  await next(page);
  await expectStep(page, "commands");
  const lines = await commandLines(page);
  expect(lines).toContain("set name Kingston_R1");
  expect(lines).toContain("region def ygk|* on|* onqc|* can|* na");
  expect(lines).toContain("region default ygk");
  expect(lines.join("\n")).not.toMatch(/ytr|Belleville/);

  // A name the person typed is kept when the town changes.
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "location");
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
  await answer(page, "board", "nrf52");
  await answer(page, "status", "running");
  await answer(page, "reflash", "no");
  await version(page, "1.15");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Belleville_R1");
  await next(page);
  await location(page);
  await expectStep(page, "commands");
  await page.locator("[data-setup-reply]").fill("*^ F\n ott F");
  await expect(codes(page)).toContainText(["region remove ott"]);
  const shared = new URL(page.url());
  // Everything but the firmware version, which only the person with the board can say.
  expect(Object.fromEntries(shared.searchParams)).toEqual({
    type: "repeater", board: "nrf52", status: "running", reflash: "0",
    tag: "ytr", province: "on", role: "city", name: "Belleville_R1", nameEdited: "1",
    town: "Belleville", lat: "44.1628", lon: "-77.3832"
  });
  expect(shared.search).not.toMatch(/ott|reply|bootloader|flashed|firmware|password|pwd|ssid/i);
  await page.locator("[data-setup-share]").click();
  await expect(page.locator("[data-setup-share]")).toHaveText(T("nav.share-done", "en"));
  expect(await page.evaluate(() => window.__copied)).toEqual([shared.href]);

  const other = await context.newPage();
  await other.goto(shared.href);
  // The link opens on the version question, with nothing picked.
  await expectStep(other, "version");
  await expect(other.locator('[data-setup-step] [data-setup-choice][aria-pressed="true"]')).toHaveCount(0);
  await expect(nextButton(other)).toBeDisabled();
  await version(other, "1.15");
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
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&tag=ytr&province=on&town=${town}&lat=44.1628&lon=-77.3832`, { to: "role" });
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
  await answer(page, "board", "esp32");
  await answer(page, "status", "new");
  await confirmStep(page, "flash");
  await expectStep(page, "town");
  await expect(page.locator("[data-setup-region]")).toContainText("ytr");
  await expect(page.locator("[data-setup-region]")).toContainText("Quinte West");
  await expect(page.locator("[data-setup-region]")).toContainText("Ontario");
  await next(page);
  await expectStep(page, "role");
});

test("start over asks first and sits away from the next button", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
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
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0&tag=ott&province=on", { to: "role" });
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("yow");
  // A code the map doesn't have is dropped, and the tool goes back to ask for the town.
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0&tag=zzz&province=on&role=city&name=Hilltop", { to: "town" });
  await expect(step(page)).toContainText(T("town.link-invalid", "en"));
  await expect(nextButton(page)).toBeDisabled();
  expect(new URL(page.url()).searchParams.get("tag")).toBe(null);
});

test("the zone map hands off to the tool", async ({ page }) => {
  await page.goto(siteRoute("/config/map/?tag=ytr&province=on"));
  const link = page.locator("[data-zone-setup]");
  await expect(link).toBeVisible();
  const href = new URL(await link.getAttribute("href"), page.url());
  expect(href.pathname).toBe("/config/");
  expect(Object.fromEntries(href.searchParams)).toEqual({ tag: "ytr", province: "on" });
  await link.click();
  await expectStep(page, "type");
  await expect.poll(() => new URL(page.url()).searchParams.get("tag")).toBe("ytr");
});

test("under the tool there is one small line: the region data credit", async ({ page }) => {
  for (const [route, words] of [["/config/", "Region data: sources and licences"], ["/fr/config/", "Données des régions : sources et licences"]]) {
    await page.goto(siteRoute(route));
    await expect(page.getByRole("link", { name: words, exact: true })).toHaveAttribute("href", /assets\/regions\/NOTICE\.txt$/);
    // The guide is in the nav and every "?" links to it, and the page's own feedback block follows: no repeated links here.
    const line = page.locator(".md-content small", { has: page.getByRole("link", { name: words, exact: true }) });
    await expect(line).toHaveCount(1);
    await expect(line.locator("a")).toHaveCount(1);
    await expect(line).toHaveText(words);
    await expect(page.locator("a[href*='thoughts-canadian-regions-strategy']")).toHaveCount(0);
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
  await answer(page, "board", "esp32");
  await answer(page, "status", "new");
  // The flash screen is the last one before the town step, so the data still hasn't been asked for.
  await expectStep(page, "flash");
  expect(boundaries).toEqual([]);
  await confirmStep(page, "flash");
  await town(page, "Belleville", "ytr");
  expect(boundaries.length).toBe(1);
});

test("region data that fails to load says so, and can be tried again", async ({ page }) => {
  let down = true;
  await page.route("**/iata-boundaries.geojson*", (route) => (down ? route.fulfill({ status: 503, body: "" }) : route.continue()));
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
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
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
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
  await choose(page, "esp32");
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  // The same screen in French, with the answers kept.
  await expectStep(page, "board");
  await expect(progress(page)).toContainText(T("step.board", "fr"));
  await expect(page.locator('[data-setup-choice="esp32"]')).toHaveAttribute("aria-pressed", "true");
  await next(page);
  await expectStep(page, "status");
});

test("language switch on the commands screen after flashing keeps the place and the commands", async ({ page }) => {
  await page.goto(siteRoute(`/config/?type=repeater&board=nrf52&status=new&role=city&name=Belleville_R1&${BELLEVILLE}`));
  await confirmStep(page, "bootloader");
  await confirmStep(page, "flash");
  for (const id of ["town", "role", "name", "location"]) {
    await expectStep(page, id);
    await next(page);
  }
  await expectStep(page, "commands");
  const english = await commandLines(page);
  await page.locator('[data-setup-command="name"] [data-done]').click();
  // The flashed and bootloader ticks never go in the address, even while switching.
  expect(page.url()).not.toMatch(/flashed|bootloader|firmware|step=/);
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expectStep(page, "commands");
  const french = await commandLines(page);
  const notPassword = (line) => !line.startsWith("password ");
  expect(french.filter(notPassword)).toEqual(english.filter(notPassword));
  // A flashed board gets the newest firmware, so one `region def` line, in either language.
  expect(french).toContain("region def ytr|* on|* onqc|* can|* na");
  expect(french).toContain(`password <${T("ph.password", "fr")}>`);
  await expect(page.locator('[data-setup-command="name"] [data-done]')).toHaveAttribute("aria-pressed", "true");
  expect(page.url()).not.toMatch(/flashed|bootloader|firmware|step=/);
  // A plain reload is a fresh start of this tab's page: the flash ticks have to be given again.
  await page.reload();
  await expectStep(page, "bootloader");
});

test("language switch on the phone route keeps the chosen firmware", async ({ page }) => {
  await page.goto(siteRoute(`/config/?${PHONE_LINK}`));
  await expectStep(page, "version");
  await choose(page, "1.14");
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="fr"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  // The same question in French, with the pick kept and out of the address.
  await expectStep(page, "version");
  await expect(page.locator('[data-setup-choice="1.14"]')).toHaveAttribute("aria-pressed", "true");
  await expect(nextButton(page)).toBeEnabled();
  expect(page.url()).not.toMatch(/firmware/);
  await nextUntil(page, "commands");
  const french = await commandLines(page);
  expect(french).toContain("region put ytr");
  expect(french).toContain("region allowf ytr");
  expect(french.some((line) => line.startsWith("region default"))).toBe(false);
  // And back again from the commands screen.
  await page.locator(".md-select > button").first().click();
  await page.locator('.md-select__link[hreflang="en"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectStep(page, "commands");
  expect(await commandLines(page)).toContain("region allowf ytr");
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
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Belleville_R1&${BELLEVILLE}`);
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
  await expectStep(page, "location");
  await next(page);
  await expectStep(page, "commands");
  await expect(page.locator('[data-setup-command="name"] [data-done]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('[data-setup-command="region-show"] [data-done]')).toHaveAttribute("aria-pressed", "false");
});

// Review focus 5: the phone route exists because people do this on a phone.
async function fitsTheScreen(page, label) {
  const result = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    // The map box is checked, not the tiles and layers inside it: it clips them, and they run past it by design.
    const wide = Array.from(document.querySelectorAll("[data-setup-tool] *"))
      .filter((element) => !(element.parentElement && element.parentElement.closest(".setup-map")))
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
    ["type", "observer"], ["repeat", "both"], ["board", "esp32"], ["status", "new"]
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
  await page.locator('[data-setup-external="onny"] input').check();
  // A scope agreed by hand makes the longest line the tool writes.
  await page.locator("[data-setup-custom-toggle]").check();
  await page.locator("[data-setup-custom]").fill("abcdefghijklmnopqrstuvwxy1234");
  await fitsTheScreen(page, "neighbours");
  await next(page);
  await expectStep(page, "name");
  await fitsTheScreen(page, "name");
  await next(page);
  await expectStep(page, "location");
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
  await fitsTheScreen(page, "location");
  await next(page);
  await expectStep(page, "commands");
  await page.locator("[data-setup-help]").first().click();
  const def = page.locator('[data-setup-command="def"] code');
  await expect(def).toHaveText("region def ytr|* xph|* ygk|* yow|* yqa|* on|* onqc|* can|* na|* onny|* abcdefghijklmnopqrstuvwxy1234");
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
  await answer(page, "board", "nrf52");
  await answer(page, "status", "running");
  await fitsTheScreen(page, "reflash");
  await answer(page, "reflash", "no");
  await expectStep(page, "version");
  await fitsTheScreen(page, "version (phone)");
  // "Older than 1.14" adds the update note and its button.
  await choose(page, "older");
  await expect(page.locator("[data-setup-update]")).toBeVisible();
  await fitsTheScreen(page, "version (older)");
  await version(page, "1.16");
  await town(page, "Belleville", "ytr");
  await answer(page, "role", "city");
  await expectStep(page, "name");
  await page.locator("[data-setup-name]").fill("Belleville_R1");
  await fitsTheScreen(page, "name (phone)");
  await next(page);
  await expectStep(page, "location");
  await page.locator("[data-setup-location-off]").check();
  await expect(page.locator("[data-setup-location-warning]")).toBeVisible();
  await fitsTheScreen(page, "location (disabled)");
  await page.locator("[data-setup-location-off]").uncheck();
  await expect(page.locator(".leaflet-marker-icon")).toBeVisible();
  await fitsTheScreen(page, "location (phone)");
  // About half the screen: room to place the pin, with the boxes and Next still close below.
  const share = await page.locator("[data-setup-map]").evaluate((element) => element.getBoundingClientRect().height / window.innerHeight);
  expect(share).toBeGreaterThan(0.3);
  expect(share).toBeLessThanOrEqual(0.56);
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

    await openLink(page, `${ROUTES[lang]}?type=observer&repeat=both&board=esp32&status=running&observerFirmware=yes&role=edge&neighbours=ygk&name=Belleville_Obs1&${BELLEVILLE}`);
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

for (const lang of LANGS) {
  test(`${lang} flash step names the flasher's own buttons for each kind of board`, async ({ page }) => {
    const base = ROUTES[lang];
    // nRF52: Enter DFU mode, pick the port, Erase Flash only on a new board, then Flash!, in that order.
    const nrfSteps = (erase) => [plain("flash.nrf52.dfu", lang), plain("flash.nrf52.port", lang), plain(erase, lang), plain("flash.nrf52.flash", lang)];
    const listed = async () => (await page.locator("[data-setup-step] ol.setup-steps li").allTextContents()).map(s => s.replace(/\s+/g, " ").trim());
    await page.goto(siteRoute(`${base}?type=repeater&board=nrf52&status=new`));
    await confirmStep(page, "bootloader");
    await expectStep(page, "flash");
    expect((await listed()).slice(2, 6)).toEqual(nrfSteps("flash.erase.nrf52-new"));
    await page.goto(siteRoute(`${base}?type=repeater&board=nrf52&status=running&reflash=1`));
    await confirmStep(page, "bootloader");
    await expectStep(page, "flash");
    expect((await listed()).slice(2, 6)).toEqual(nrfSteps("flash.erase.nrf52-running"));
    // ESP32 repeater: the Erase device tick and Flash!, no DFU note.
    await page.goto(siteRoute(`${base}?type=repeater&board=esp32&status=new`));
    await expectStep(page, "flash");
    await expect(step(page)).toContainText(T("flash.repeater.step3", lang, { erase: T("flash.erase.esp32-new", lang) }));
    await expect(step(page)).not.toContainText(T("flash.nrf52.dfu", lang));
    // Repeater observer: the observer flasher's button is plain Flash.
    await page.goto(siteRoute(`${base}?type=observer&repeat=both&board=esp32&status=new`));
    await expectStep(page, "flash");
    await expect(step(page)).toContainText(T("flash.observer.step3", lang, { erase: T("flash.erase.esp32-new", lang) }));
    await expect(step(page)).not.toContainText("Flash!");
  });
}

// ------------------------------------------------------------------ neighbours: the nearest five, and a search for any other

const EDGE_LINK = (lang, extra = "") => `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=edge&name=Test_R1&${BELLEVILLE}${extra}`;
const listed = (page) => page.locator("[data-setup-neighbour]").evaluateAll((list) => list.map((box) => box.dataset.setupNeighbour));
const find = (page) => page.locator("[data-setup-find]");
const found = (page) => page.locator("[data-setup-found]");
const foundTags = (page) => found(page).evaluateAll((list) => list.map((row) => row.dataset.setupFound));
const findStatus = (page) => page.locator("[data-setup-find-status]");

for (const lang of LANGS) {
  test(`${lang} the neighbours step lists the five nearest regions with how far each is, and keeps the rest`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openLink(page, EDGE_LINK(lang), { to: "neighbours" });
    // Measured from the town the person searched for: Port Hope, Kingston, Ottawa–Gatineau, Toronto, Muskoka.
    expect(await listed(page)).toEqual(["xph", "ygk", "yow", "yyz", "yqa", "none"]);
    const away = lang === "fr" ? "à environ" : "about";
    await expect(page.locator('[data-setup-neighbour="xph"]')).toHaveText(new RegExp(`^Port Hope \\(xph\\), ${away} \\d+ km$`));
    await expect(page.locator('[data-setup-neighbour="ygk"]')).toHaveText(new RegExp(`^Kingston \\(ygk\\), ${away} \\d+ km$`));
    await expect(page.locator('[data-setup-neighbour="yow"]')).toContainText("Ottawa–Gatineau (yow)");
    // The distances only grow down the list.
    const km = (await page.locator("[data-setup-neighbour]:not([data-setup-neighbour=none])").allTextContents()).map((words) => Number(words.match(/(\d[\d\s\u00a0\u202f,]*) km$/)[1].replace(/\D/g, "")));
    expect(km).toEqual([...km].sort((a, b) => a - b));
    expect(km.every((value) => value > 0 && value < 250)).toBe(true);
    // The home region is never its own neighbour.
    await expect(page.locator('[data-setup-neighbour="ytr"]')).toHaveCount(0);
    // The question, the MeshMapper link, the box for any other region and "None of these" are all there.
    await expect(page.locator('[data-setup-neighbour="none"]')).toHaveText(T("neighbours.none", lang));
    await expect(page.locator("#setup-question")).toHaveText(T("neighbours.question", lang));
    await expect(page.locator(".setup-body > .setup-hint").first()).toHaveText(T("neighbours.hint", lang));
    await expect(page.locator('label[for="setup-find"]')).toHaveText(T("neighbours.find", lang));
    await expect(page.locator("#setup-find-hint")).toHaveText(T("neighbours.find.hint", lang));
    await expect(page.locator('[data-setup-step] a[href="https://meshmapper.net/"]')).toContainText(T("neighbours.meshmapper", lang));
    await fitsTheScreen(page, `${lang} neighbours`);
    // A region the person ticked stays in the list when the screen is drawn again, even if it isn't one of the nearest.
    await openLink(page, EDGE_LINK(lang, "&neighbours=ylk,yqa"), { to: "neighbours" });
    expect(await listed(page)).toEqual(["xph", "ygk", "yow", "yyz", "yqa", "ylk", "none"]);
    await expect(page.locator('[data-setup-neighbour="ylk"] input')).toBeChecked();
    await expect(page.locator('[data-setup-neighbour="yqa"] input')).toBeChecked();
    await expect(page.locator('[data-setup-neighbour="ygk"] input')).not.toBeChecked();
    await expect(page.locator('[data-setup-neighbour="none"] input')).not.toBeChecked();
    await expect(nextButton(page)).toBeEnabled();
    await fitsTheScreen(page, `${lang} neighbours with a ticked region beyond the nearest`);
  });

  test(`${lang} searching finds any other region by name, alias or code, and ticking one adds it to the list`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const queries = await mockGeocoder(page);
    await openLink(page, EDGE_LINK(lang), { to: "neighbours" });
    await expect(found(page)).toHaveCount(0);
    await expect(findStatus(page)).toHaveText("");
    // Barrie is not one of the nearest five: find it by its name, tick it from the results.
    await find(page).fill("barrie");
    expect(await foundTags(page)).toEqual(["ylk"]);
    await expect(found(page)).toContainText("Barrie (ylk)");
    await expect(findStatus(page)).toHaveText(T("neighbours.find.found", lang, { n: 1 }));
    await expect(page.locator('[data-setup-found="ylk"] input')).not.toBeChecked();
    await expect(page.locator('[data-setup-neighbour="ylk"]')).toHaveCount(0);
    await page.locator('[data-setup-found="ylk"] input').check();
    // It joins the list above, ticked, before "None of these"; the result stays ticked too.
    expect(await listed(page)).toEqual(["xph", "ygk", "yow", "yyz", "yqa", "ylk", "none"]);
    await expect(page.locator('[data-setup-neighbour="ylk"] input')).toBeChecked();
    await expect(page.locator('[data-setup-found="ylk"] input')).toBeChecked();
    await expect(page.locator("[data-setup-live]")).toHaveText(T("neighbours.added", lang, { region: "Barrie", tag: "ylk" }));
    expect(page.url()).toContain("neighbours=ylk");
    await expect(nextButton(page)).toBeEnabled();
    await fitsTheScreen(page, `${lang} neighbours with a search result`);
    // Unticking it in the list leaves its row where it is, unticked, and the result follows.
    await page.locator('[data-setup-neighbour="ylk"] input').uncheck();
    await expect(page.locator('[data-setup-found="ylk"] input')).not.toBeChecked();
    expect(await listed(page)).toContain("ylk");
    await expect(nextButton(page)).toBeDisabled();
    // A region already in the list is found too, and ticking either box ticks the other.
    await find(page).fill("MUSKOKA");
    expect(await foundTags(page)).toEqual(["yqa"]);
    await page.locator('[data-setup-found="yqa"] input').check();
    await expect(page.locator('[data-setup-neighbour="yqa"] input')).toBeChecked();
    expect(await listed(page)).toEqual(["xph", "ygk", "yow", "yyz", "yqa", "ylk", "none"]);
    await expect(page.locator("[data-setup-live]")).not.toHaveText(T("neighbours.added", lang, { region: "Muskoka", tag: "yqa" }));
    // The code works too, in any case.
    await find(page).fill("YLK");
    expect(await foundTags(page)).toEqual(["ylk"]);
    // Ticking a result takes "None of these" off, and "None of these" clears the ticks.
    await page.locator('[data-setup-neighbour="none"] input').check();
    await expect(page.locator('[data-setup-neighbour="yqa"] input')).not.toBeChecked();
    await expect(page.locator('[data-setup-found="ylk"] input')).not.toBeChecked();
    await page.locator('[data-setup-found="ylk"] input').check();
    await expect(page.locator('[data-setup-neighbour="none"] input')).not.toBeChecked();
    // Nothing that matches, one letter, and the home region itself.
    await find(page).fill("zzzzzz");
    await expect(found(page)).toHaveCount(0);
    await expect(findStatus(page)).toHaveText(T("neighbours.find.none", lang));
    await find(page).fill("b");
    await expect(found(page)).toHaveCount(0);
    await expect(findStatus(page)).toHaveText("");
    await find(page).fill("belleville");
    await expect(found(page)).toHaveCount(0);
    await expect(findStatus(page)).toHaveText(T("neighbours.find.none", lang));
    // A short text matches a lot: eight are shown, with a plain note.
    await find(page).fill("on");
    await expect(found(page)).toHaveCount(8);
    await expect(findStatus(page)).toHaveText(T("neighbours.find.more", lang, { n: 8 }));
    await fitsTheScreen(page, `${lang} neighbours with eight search results`);
    // The search is the page's own data: no place search is asked.
    expect(queries).toEqual([]);
    // What was ticked is in the commands, and nothing else changed about them.
    await next(page);
    await nextUntil(page, "commands");
    expect(await commandLines(page)).toContain("region def ytr|* ylk|* on|* onqc|* can|* na");
  });
}

test("searching understands French names, with or without accents or dashes", async ({ page }) => {
  await openLink(page, EDGE_LINK("fr"), { to: "neighbours" });
  await find(page).fill("terre-neuve");
  expect(await foundTags(page)).toEqual(["yyt"]);
  await expect(found(page)).toContainText("Terre-Neuve (yyt)");
  await find(page).fill("Ile du Prince Edouard");
  expect(await foundTags(page)).toEqual(["yyg"]);
  await expect(found(page)).toContainText("Île-du-Prince-Édouard (yyg)");
  // Far away is said with a space before the thousands, in kilometres.
  await expect(found(page)).toHaveText(/^Île-du-Prince-Édouard \(yyg\), à environ \d[\d\s\u00a0\u202f]* km$/);
});

test("with no place to measure from, such as after a link from the zone finder, the nearest are measured from the middle of the region", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=edge&name=Test_R1&tag=ytr&province=on`, { to: "neighbours" });
  const tags = await listed(page);
  expect(tags).toHaveLength(6);
  expect(tags).not.toContain("ytr");
  expect(tags.slice(0, 3).sort()).toEqual(["xph", "ygk", "yow"].sort());
  await expect(page.locator('[data-setup-neighbour="xph"]')).toContainText("(xph)");
  await expect(page.locator('[data-setup-neighbour="xph"]')).toContainText(" km");
});

test("the search box and its results have no serious accessibility problem, in both languages", async ({ page }) => {
  for (const lang of LANGS) {
    await openLink(page, EDGE_LINK(lang), { to: "neighbours" });
    await find(page).fill("ba");
    await expect(found(page).first()).toBeVisible();
    const result = await new AxeBuilder({ page }).include("[data-setup-step]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact)).map((violation) => violation.id), `${lang} neighbours search`).toEqual([]);
  }
});

// ------------------------------------------------------------------ cross-border box: listed networks and an agreed scope

// One city in each province or territory, from the region catalogue.
const PROVINCE_CITIES = { bc: "yka", ab: "yeg", sk: "yxe", mb: "ywg", on: "ytr", qc: "yul", nb: "ysj", ns: "yhz", pe: "yyg", nl: "yyt", yt: "yxy", nt: "yzf", nu: "yfb" };
// The scopes the box lists beside the custom option, by province (data/cross-border-scopes.yml). A city and an
// edge repeater are offered the same ones, and no US network is.
const LISTED = { on: ["onny"], qc: ["qcny", "qcvt"] };
const US_NETWORKS = /Ohio|Pennsylvan|Western New York|Ouest de l’État de New York|Washington|Oregon/;
const crossBorderLink = (lang, province, role, extra = "") =>
  `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=${role}&name=Test_R1&tag=${PROVINCE_CITIES[province]}&province=${province}${extra}`;
const toggle = (page) => page.locator("[data-setup-custom-toggle]");
const box = (page) => page.locator("fieldset", { has: toggle(page) });
const customBox = (page) => page.locator("[data-setup-custom]");
const customMessage = (page) => page.locator("[data-setup-custom-message]");

for (const province of Object.keys(PROVINCE_CITIES)) {
  test(`${province}: the cross-border box lists its scopes and always offers an agreed scope, at phone width`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    // A city repeater sees the box on the city-or-edge screen.
    await openLink(page, crossBorderLink("en", province, "city"), { to: "role" });
    await expect(page.locator("[data-setup-external]")).toHaveCount((LISTED[province] || []).length);
    for (const id of LISTED[province] || []) await expect(page.locator(`[data-setup-external="${id}"]`)).toBeVisible();
    await expect(page.locator("[data-setup-step]")).not.toContainText(US_NETWORKS);
    await expect(box(page).locator("> legend")).toHaveText(T("role.shared.question", "en"));
    await expect(toggle(page)).toBeVisible();
    await expect(page.locator("[data-setup-step] label.setup-check").filter({ has: toggle(page) })).toHaveText(T("custom.label", "en"));
    await expect(toggle(page)).not.toBeChecked();
    await expect(customBox(page)).toBeHidden();
    await expect(page.locator("[data-setup-custom-share]")).toBeVisible();
    await toggle(page).check();
    await expect(customBox(page)).toBeVisible();
    await expect(page.locator('label[for="setup-custom"]')).toHaveText(T("custom.name", "en"));
    await expect(page.locator("#setup-custom-hint")).toHaveText(T("custom.hint", "en"));
    await fitsTheScreen(page, `${province} city`);
    // An edge repeater sees the same scopes on the neighbours screen.
    await openLink(page, crossBorderLink("en", province, "edge"), { to: "neighbours" });
    await expect(page.locator("[data-setup-external]")).toHaveCount((LISTED[province] || []).length);
    await expect(page.locator("[data-setup-step]")).not.toContainText(US_NETWORKS);
    await expect(box(page).locator("> legend")).toHaveText(T("crossborder.title", "en"));
    await expect(toggle(page)).toBeVisible();
    await toggle(page).check();
    await expect(customBox(page)).toBeVisible();
    await fitsTheScreen(page, `${province} edge`);
  });
}

for (const lang of LANGS) {
  test(`${lang} Ontario lists onny with what it is for, British Columbia lists only the agreed-scope option`, async ({ page }) => {
    const onny = {
      en: ["Ontario–New York", "Applied to repeaters that connect New York and Ontario."],
      fr: ["Ontario–New York", "Pour les répéteurs qui relient l’État de New York et l’Ontario."]
    }[lang];
    for (const role of ["city", "edge"]) {
      await openLink(page, crossBorderLink(lang, "on", role), { to: role === "city" ? "role" : "neighbours" });
      expect(await page.locator("[data-setup-external]").evaluateAll((list) => list.map((row) => row.dataset.setupExternal))).toEqual(["onny"]);
      await expect(page.locator('[data-setup-external="onny"] .setup-check__name')).toHaveText(onny[0]);
      await expect(page.locator('[data-setup-external="onny"] .setup-check__why')).toHaveText(onny[1]);
      await expect(page.locator("[data-setup-step]")).not.toContainText(US_NETWORKS);
      await expect(toggle(page)).toBeVisible();
      // Ticked, with its description beside it, the row still has no serious accessibility problem (colour contrast included).
      await page.locator('[data-setup-external="onny"] input').check();
      const found = await new AxeBuilder({ page }).include("[data-setup-step]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(found.violations.filter((violation) => ["serious", "critical"].includes(violation.impact)).map((violation) => violation.id), `${lang} ${role} ticked scope`).toEqual([]);
      await openLink(page, crossBorderLink(lang, "bc", role), { to: role === "city" ? "role" : "neighbours" });
      await expect(page.locator("[data-setup-external]")).toHaveCount(0);
      await expect(page.locator("[data-setup-step]")).not.toContainText(US_NETWORKS);
      await expect(toggle(page)).toBeVisible();
      await expect(page.locator("[data-setup-custom-share]")).toBeVisible();
    }
  });
}

test("the scopes offered come from the published file: a new entry shows up, in the page's language, and works", async ({ page }) => {
  await page.route("**/assets/regions/cross-border-scopes.json*", async (route) => {
    const list = await (await route.fetch()).json();
    list.scopes.push({ scope: "bcwa", name: "British Columbia–Washington", nameFr: "Colombie-Britannique–Washington",
      description: "Applied to repeaters that connect Washington and British Columbia.", descriptionFr: "Pour les répéteurs qui relient Washington et la Colombie-Britannique.", provinces: ["bc"] });
    await route.fulfill({ json: list });
  });
  for (const lang of LANGS) {
    await openLink(page, crossBorderLink(lang, "bc", "city"), { to: "role" });
    expect(await page.locator("[data-setup-external]").evaluateAll((list) => list.map((row) => row.dataset.setupExternal))).toEqual(["bcwa"]);
    await expect(page.locator('[data-setup-external="bcwa"] .setup-check__name')).toHaveText(lang === "fr" ? "Colombie-Britannique–Washington" : "British Columbia–Washington");
    await expect(page.locator('[data-setup-external="bcwa"] .setup-check__why')).toHaveText(lang === "fr"
      ? "Pour les répéteurs qui relient Washington et la Colombie-Britannique." : "Applied to repeaters that connect Washington and British Columbia.");
    await page.locator('[data-setup-external="bcwa"] input').check();
    expect(page.url()).toContain("external=bcwa");
    await next(page);
    await nextUntil(page, "commands");
    expect(await commandLines(page)).toContain("region def yka|* bc|* can|* na|* bcwa");
    await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", lang, { network: `${lang === "fr" ? "Colombie-Britannique–Washington" : "British Columbia–Washington"} (bcwa)` }));
  }
});

test("a share link made before the scopes came from a file still works: the old network ids are read as the scope tags", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&${BELLEVILLE}&external=ontario-new-york`, { to: "role" });
  await expect(page.locator('[data-setup-external="onny"] input')).toBeChecked();
  await expect.poll(() => page.url()).toContain("external=onny");
  expect(page.url()).not.toContain("ontario-new-york");
  await next(page);
  await nextUntil(page, "commands");
  expect(await commandLines(page)).toContain("region def ytr|* on|* onqc|* can|* na|* onny");
  await openLink(page, `/fr/config/?type=repeater&board=esp32&status=running&reflash=0&role=edge&name=Test_R1&town=Montr%C3%A9al&lat=45.5&lon=-73.57&tag=yul&province=qc&neighbours=yow&external=quebec-new-york`, { to: "neighbours" });
  await expect(page.locator('[data-setup-external="qcny"] input')).toBeChecked();
  await expect(page.locator('[data-setup-external="qcvt"] input')).not.toBeChecked();
  expect(page.url()).toContain("external=qcny");
});

test("a US network in an old share link is dropped without a word, and so is a scope from another province", async ({ page }) => {
  const ids = "ohio,pennsylvania,western-new-york,washington,oregon,california";
  for (const [province, tag, extra] of [["on", "ytr", "&neighbours=ygk"], ["bc", "yka", ""]]) {
    await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=edge&name=Test_R1&tag=${tag}&province=${province}${extra}&external=${ids},qcny`, { to: "neighbours" });
    await expect(page.locator("[data-setup-external]")).toHaveCount(province === "on" ? 1 : 0);
    await expect(page.locator("[data-setup-external] input:checked")).toHaveCount(0);
    await expect(page.locator("[data-setup-step]")).not.toContainText(US_NETWORKS);
    await expect(page.locator("[role='alert'], .setup-note")).toHaveCount(0);
    expect(page.url()).not.toMatch(/external=|ohio|oregon|qcny/);
    await page.locator('[data-setup-neighbour="none"] input').check();
    await next(page);
    await nextUntil(page, "commands");
    const lines = await commandLines(page);
    expect(lines.filter((line) => line.startsWith("region def "))).toEqual([province === "on" ? "region def ytr|* on|* onqc|* can|* na" : "region def yka|* bc|* can|* na"]);
    await expect(page.locator("[data-setup-notes] .setup-note--warn")).toHaveCount(0);
  }
});

test("the tool says the region list didn't load when the cross-border scopes file is missing, and recovers", async ({ page }) => {
  let down = true;
  await page.route("**/assets/regions/cross-border-scopes.json*", (route) => (down ? route.fulfill({ status: 503, body: "" }) : route.continue()));
  await openLink(page, "/config/?type=repeater&board=esp32&status=running&reflash=0", { to: "town" });
  await expect(page.locator("[data-setup-step] [role='alert']")).toHaveText(T("tool.load-failed", "en"));
  down = false;
  await page.locator("[data-setup-retry]").click();
  await expect(page.locator("[data-setup-step] [role='alert']")).toHaveCount(0);
});

for (const lang of LANGS) {
  test(`${lang} a city repeater can carry a scope agreed with a network across the border`, async ({ page }) => {
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&${BELLEVILLE}`, { to: "role" });
    await expect(toggle(page)).not.toBeChecked();
    await expect(customBox(page)).toBeHidden();
    // Nothing is asked unless it is ticked.
    await expect(nextButton(page)).toBeEnabled();
    await toggle(page).check();
    await expect(customBox(page)).toBeVisible();
    await expect(customBox(page)).toBeFocused();
    await expect(page.locator('label[for="setup-custom"]')).toHaveText(T("custom.name", lang));
    await expect(page.locator("#setup-custom-hint")).toHaveText(T("custom.hint", lang));
    // Ticked but still empty: Next waits, and nothing is shouted at someone who hasn't typed yet.
    await expect(nextButton(page)).toBeDisabled();
    await expect(customMessage(page)).toHaveText("");
    // Anything the generator would refuse gets a plain message and keeps Next off.
    for (const bad of ["two words", "qcx_2", "québec", "x".repeat(30), "#qcx2"]) {
      await customBox(page).fill(bad);
      await expect(customMessage(page)).toHaveText(T("custom.invalid", lang));
      await expect(nextButton(page)).toBeDisabled();
      expect(page.url()).not.toContain("custom=");
    }
    await customBox(page).fill("two words");
    // The box itself, with its message showing, has no serious accessibility problem (the site's own page furniture is checked elsewhere).
    const found = await new AxeBuilder({ page }).include("[data-setup-step]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(found.violations.filter((violation) => ["serious", "critical"].includes(violation.impact)).map((violation) => violation.id), `${lang} agreed scope box`).toEqual([]);
    // Spaces round it and capitals are fixed for you.
    await customBox(page).fill("  QcX2 ");
    await expect(customMessage(page)).toHaveText("");
    await expect(nextButton(page)).toBeEnabled();
    expect(page.url()).toContain("custom=qcx2");
    await next(page);
    await nextUntil(page, "commands");
    expect(await commandLines(page)).toContain("region def ytr|* on|* onqc|* can|* na|* qcx2");
    // The generator's confirm note, and the explanation that names it, in the page's language.
    await expect(page.locator("[data-setup-notes]")).toContainText(T("note.network", lang, { network: "qcx2" }));
    await expect(page.locator('[data-setup-command="def"] .setup-command__why')).toContainText(T("tag.custom", lang, { tag: "qcx2" }));
    // It is still there on the way back, in the box.
    for (let back = 0; back < 3; back += 1) await page.locator("[data-setup-back]").click();
    await expectStep(page, "role");
    await expect(toggle(page)).toBeChecked();
    await expect(customBox(page)).toHaveValue("qcx2");
    // Unticking drops it from the lines and the link, and Next is free again.
    await toggle(page).uncheck();
    await expect(customBox(page)).toBeHidden();
    await expect(nextButton(page)).toBeEnabled();
    expect(page.url()).not.toContain("custom=");
    await next(page);
    await nextUntil(page, "commands");
    expect(await commandLines(page)).toContain("region def ytr|* on|* onqc|* can|* na");
    await expect(page.locator("[data-setup-notes]")).not.toContainText("qcx2");
  });
}

test("a custom scope that is already in the list adds nothing, and a bad one in a link is dropped", async ({ page }) => {
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&custom=on&${BELLEVILLE}`, { to: "role" });
  await expect(toggle(page)).toBeChecked();
  await expect(customBox(page)).toHaveValue("on");
  await next(page);
  await nextUntil(page, "commands");
  expect(await commandLines(page)).toContain("region def ytr|* on|* onqc|* can|* na");
  // Names the generator would refuse never make it out of the link: the box starts unticked.
  for (const bad of ["bad%20name", "QU%C3%89BEC", "x".repeat(30), ""]) {
    await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&custom=${bad}&${BELLEVILLE}`, { to: "role" });
    await expect(toggle(page)).not.toBeChecked();
    await expect(nextButton(page)).toBeEnabled();
  }
  // Capitals in a link are lowered, as they are when typed.
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&custom=QCX2&${BELLEVILLE}`, { to: "role" });
  await expect(customBox(page)).toHaveValue("qcx2");
});

test("an agreed scope follows a role change and goes when the region changes", async ({ page }) => {
  await mockGeocoder(page);
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&custom=qcx2&${BELLEVILLE}`, { to: "role" });
  await expect(customBox(page)).toHaveValue("qcx2");
  // City to edge: the scope stays, and the edge screen shows it already ticked.
  await choose(page, "edge");
  expect(page.url()).toContain("custom=qcx2");
  await next(page);
  await expectStep(page, "neighbours");
  await expect(toggle(page)).toBeChecked();
  await expect(customBox(page)).toHaveValue("qcx2");
  await page.locator('[data-setup-neighbour="ygk"] input').check();
  await next(page);
  await nextUntil(page, "commands");
  const edge = await commandLines(page);
  expect(edge).toContain("region def ytr|* ygk|* on|* onqc|* can|* na|* qcx2");
  expect(edge).toContain("region denyf *");
  // A ticked but empty box on the edge screen holds its own Next, and does not trap the city-or-edge screen.
  for (let back = 0; back < 3; back += 1) await page.locator("[data-setup-back]").click();
  await expectStep(page, "neighbours");
  await customBox(page).fill("");
  await expect(nextButton(page)).toBeDisabled();
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "role");
  await expect(nextButton(page)).toBeEnabled();
  // Edge to city: it stays too.
  await choose(page, "city");
  await expect(toggle(page)).toBeChecked();
  await customBox(page).fill("qcx2");
  expect(page.url()).toContain("custom=qcx2");
  // A different region starts the cross-border choices again.
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "town");
  await searchTown(page, "Kingston");
  await expect(page.locator("[data-setup-region]")).toContainText("ygk");
  expect(page.url()).not.toContain("custom=");
  await next(page);
  await expectStep(page, "role");
  await choose(page, "city");
  await expect(toggle(page)).not.toBeChecked();
});

for (const lang of LANGS) {
  test(`${lang} the cross-border box links to the idea page, which opens`, async ({ page }) => {
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&${BELLEVILLE}`, { to: "role" });
    const line = page.locator("[data-setup-custom-share]");
    await expect(line).toHaveText(linked("custom.share", lang));
    const anchor = line.locator("a");
    await expect(anchor).toHaveText(`${T("custom.share.link", lang)} ${T("link.new-tab", lang)}`);
    await expect(anchor).toHaveAttribute("target", "_blank");
    // Relative, so each language keeps its own page.
    await expect(anchor).toHaveAttribute("href", "../submit-idea/");
    const href = await anchor.evaluate((a) => a.href);
    expect(new URL(href).pathname).toBe(lang === "fr" ? "/fr/submit-idea/" : "/submit-idea/");
    const reply = await page.request.get(href);
    expect(reply.ok()).toBe(true);
    expect(await reply.text()).toContain(lang === "fr" ? "Partager une idée" : "Share an idea");
    // The edge screen shows the same line.
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=edge&name=Test_R1&${BELLEVILLE}`, { to: "neighbours" });
    await expect(page.locator("[data-setup-custom-share] a")).toHaveAttribute("href", "../submit-idea/");
  });
}

test("too many scopes for one repeater is said plainly, with no commands and no way forward", async ({ page }) => {
  // Every choice the tool offers fits today, so give the catalogue three more long reserved scopes to leave no room.
  await page.route("**/assets/regions/iata-regions.json*", async (route) => {
    const response = await route.fetch();
    const catalog = await response.json();
    catalog.policy.reservedScopes.push("a".repeat(29), "b".repeat(29), "c".repeat(29));
    await route.fulfill({ response, json: catalog });
  });
  const long = "x".repeat(29);
  await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&custom=${long}&${BELLEVILLE}`);
  await expect(page.locator("[data-setup-too-many]")).toHaveText(T("commands.too-many", "en"));
  await expect(codes(page)).toHaveCount(0);
  await expect(nextButton(page)).toBeDisabled();
  // Back and untick it, and the commands come back.
  for (let back = 0; back < 3; back += 1) await page.locator("[data-setup-back]").click();
  await expectStep(page, "role");
  await toggle(page).uncheck();
  await next(page);
  await nextUntil(page, "commands");
  expect(await commandLines(page)).toContain("region def ytr|* on|* onqc|* can|* na|* " + "a".repeat(29) + "|* " + "b".repeat(29) + "|* " + "c".repeat(29));
});

// ------------------------------------------------------------------ map location: a pin on a map, and two boxes

// Every tile is answered by the shared fixture (site-fixtures.mjs) unless a test says otherwise.
const BELLEVILLE_LINK = (lang = "en", extra = "") =>
  `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&${BELLEVILLE}${extra}`;
const leafletFiles = (requests) => requests.filter((url) => /\/vendor\/leaflet\/leaflet\.(?:js|css)(?:\?|$)/.test(url));
const tileZooms = (requests) => [...new Set(requests.filter((url) => url.startsWith("https://tile.openstreetmap.org/"))
  .map((url) => Number(new URL(url).pathname.split("/")[1])))];
const marker = (page) => page.locator("[data-setup-map] .leaflet-marker-icon");
const searchParam = (page, name) => new URL(page.url()).searchParams.get(name);
// Where the pin points: the bottom middle of Leaflet's default marker (25 × 41, anchored at 12, 41).
async function pinTip(page) {
  const box = await marker(page).boundingBox();
  return { x: box.x + 12.5, y: box.y + 41 };
}
async function mapMiddle(page) {
  const box = await page.locator("[data-setup-map]").boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, width: box.width, height: box.height };
}
// Axe on the tool alone: the site's own furniture is checked by the accessibility spec.
async function expectToolAxe(page, label) {
  const found = await new AxeBuilder({ page }).include("[data-setup-tool]").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const blocking = found.violations.filter((violation) => ["serious", "critical"].includes(violation.impact))
    .map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target) }));
  expect(blocking, `${label}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
}

for (const lang of LANGS) {
  test(`${lang} map location: Leaflet loads only here, the pin starts at the town, and the map and the boxes follow each other`, async ({ page }) => {
    await mockGeocoder(page);
    const requests = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto(siteRoute(`${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0`));
    await version(page, "1.16");
    await town(page, "Belleville", "ytr");
    await answer(page, "role", "city");
    await expectStep(page, "name");
    await page.locator("[data-setup-name]").fill("Belleville_R1");
    // Nothing of the map is fetched before its own step.
    expect(leafletFiles(requests)).toEqual([]);
    expect(tileZooms(requests)).toEqual([]);
    await next(page);
    await expectStep(page, "location");
    await expect(page.getByRole("heading", { level: 2, name: T("location.question", lang) })).toBeVisible();
    await expect(step(page)).toContainText(T("location.hint", lang));
    await expect(step(page)).toContainText(T("location.how", lang));
    await expect.poll(() => leafletFiles(requests).length).toBe(2);
    // The pin is Leaflet's own marker, from the site's copy, and it shows.
    await expect(marker(page)).toBeVisible();
    await expect(marker(page)).toHaveAttribute("src", /\/vendor\/leaflet\/images\/marker-icon(?:-2x)?\.png$/);
    await expect(marker(page)).toHaveAttribute("alt", T("location.pin", lang));
    await expect.poll(() => marker(page).evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator("[data-setup-map-status]")).toHaveCount(0);
    // A town opens at about zoom 13, credited to OpenStreetMap with a link that opens in a new tab.
    expect(tileZooms(requests)).toEqual([13]);
    const credit = page.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]');
    await expect(credit).toHaveAttribute("target", "_blank");
    await expect(credit).toHaveText(`${T("location.attribution.link", lang)} ${T("link.new-tab", lang)}`);
    // The pin and the boxes start at the place the town step found.
    await expect(pinBox(page, "lat")).toHaveValue("44.1628");
    await expect(pinBox(page, "lon")).toHaveValue("-77.3832");
    // Measured on screen, so the whole map is scrolled into view first.
    await page.locator("[data-setup-map]").scrollIntoViewIfNeeded();
    let middle = await mapMiddle(page);
    let tip = await pinTip(page);
    expect(Math.hypot(tip.x - middle.x, tip.y - middle.y)).toBeLessThan(3);

    // Clicking the map moves the pin there, and the boxes and the link follow, to 4 decimals.
    await page.locator("[data-setup-map]").click({ position: { x: middle.width / 2 + 60, y: middle.height / 2 + 30 } });
    await expect(pinBox(page, "lat")).not.toHaveValue("44.1628");
    middle = await mapMiddle(page);
    tip = await pinTip(page);
    expect(Math.hypot(tip.x - (middle.x + 60), tip.y - (middle.y + 30))).toBeLessThan(3);
    const lat = await pinBox(page, "lat").inputValue();
    const lon = await pinBox(page, "lon").inputValue();
    expect(lat).toMatch(/^\d+(?:\.\d{1,4})?$/);
    expect(Number(lat)).toBeLessThan(44.1628);   // lower on the map is further south
    expect(Number(lon)).toBeGreaterThan(-77.3832); // and to the right is further east
    await expect.poll(() => searchParam(page, "lat")).toBe(lat);
    await expect.poll(() => searchParam(page, "lon")).toBe(lon);

    // Typing in the boxes moves the pin, which the map brings to its middle.
    await pinBox(page, "lat").fill("44.17");
    await pinBox(page, "lon").fill("-77.39");
    middle = await mapMiddle(page);
    await expect.poll(async () => { const at = await pinTip(page); return Math.hypot(at.x - middle.x, at.y - middle.y); }).toBeLessThan(3);
    await expect.poll(() => searchParam(page, "lat")).toBe("44.17");
    await expect.poll(() => searchParam(page, "lon")).toBe("-77.39");
    // Only the pin moved: the place keeps its name.
    expect(searchParam(page, "town")).toBe("Belleville");
    await next(page);
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines).toContain("set lat 44.17");
    expect(lines).toContain("set lon -77.39");
    await expect(page.locator('[data-setup-command="lat"]')).toContainText(T("why.lat", lang));
    await expect(page.locator('[data-setup-command="lon"]')).toContainText(T("why.lon", lang));
    // Back on the map, the pin is where it was left.
    await page.locator("[data-setup-back]").click();
    await expectStep(page, "location");
    await expect(pinBox(page, "lat")).toHaveValue("44.17");
    await expect(pinBox(page, "lon")).toHaveValue("-77.39");
  });
}

test("dragging the pin moves it, and the boxes and the link follow", async ({ page }) => {
  await openLink(page, BELLEVILLE_LINK(), { to: "location" });
  await expect(marker(page)).toBeVisible();
  await page.locator("[data-setup-map]").scrollIntoViewIfNeeded();
  const start = await pinTip(page);
  // Take hold of the marker's head, above its tip, and drag it down and to the right.
  await page.mouse.move(start.x, start.y - 25);
  await page.mouse.down();
  await page.mouse.move(start.x + 40, start.y - 5, { steps: 8 });
  await page.mouse.move(start.x + 80, start.y + 15, { steps: 8 });
  await page.mouse.up();
  await expect(pinBox(page, "lat")).not.toHaveValue("44.1628");
  const tip = await pinTip(page);
  expect(Math.hypot(tip.x - (start.x + 80), tip.y - (start.y + 40))).toBeLessThan(4);
  expect(Number(await pinBox(page, "lat").inputValue())).toBeLessThan(44.1628);
  expect(Number(await pinBox(page, "lon").inputValue())).toBeGreaterThan(-77.3832);
  await expect.poll(() => searchParam(page, "lat")).toBe(await pinBox(page, "lat").inputValue());
});

test("the map opens close in for an address or coordinates, nearer for a town, and wide for a region's middle", async ({ page }) => {
  const cases = [
    ["town=111%20Wellington%20Street%2C%20Ottawa&kind=address&lat=45.4231&lon=-75.6988&tag=yow&province=on", 17],
    ["town=44.1628%2C%20-77.3832&kind=coordinates&lat=44.1628&lon=-77.3832&tag=ytr&province=on", 17],
    [BELLEVILLE, 13],
    ["tag=ytr&province=on", 10]
  ];
  for (const [where, zoom] of cases) {
    const requests = [];
    const listen = (request) => requests.push(request.url());
    page.on("request", listen);
    await openLink(page, `/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&${where}`, { to: "location" });
    await expect(marker(page)).toBeVisible();
    await expect(page.locator("[data-setup-map-status]")).toHaveCount(0);
    expect(tileZooms(requests), where).toEqual([zoom]);
    page.off("request", listen);
  }
});

// A region's middle on a public map would mislead, so with only a region the pin waits there for the person to move it.
const REGION_ONLY = "/config/?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&tag=ytr&province=on";
async function expectWaitingPin(page, region = "Quinte West", lang = "en") {
  await expect(page.locator("[data-setup-pin-start]")).toHaveText(T("location.start", lang, { region }));
  await expect(page.locator("[data-setup-pin-start]")).toContainText(region);
  await expect(marker(page)).toBeVisible();
  // Nothing is kept yet: the boxes are empty, the link holds no spot, and Next waits.
  await expect(pinBox(page, "lat")).toHaveValue("");
  await expect(pinBox(page, "lon")).toHaveValue("");
  await expect(nextButton(page)).toBeDisabled();
  expect(new URL(page.url()).search).not.toMatch(/(?:^|&)(?:town|kind|lat|lon)=/);
}

for (const lang of LANGS) {
  test(`${lang} the waiting line says the pin is in the middle of the region, by the region's name in the page's language`, async ({ page }) => {
    for (const [tag, province, english, french] of [["ytr", "on", "Quinte West", "Quinte West"], ["yow", "on", "Ottawa–Gatineau", "Ottawa–Gatineau"], ["yyt", "nl", "Newfoundland", "Terre-Neuve"]]) {
      await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&tag=${tag}&province=${province}`, { to: "location" });
      await expectWaitingPin(page, lang === "fr" ? french : english, lang);
    }
  });
}

test("a click on the pin leaves it where it is, and a double-click on the map zooms nothing", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await openLink(page, BELLEVILLE_LINK(), { to: "location" });
  await expect(marker(page)).toBeVisible();
  await expect.poll(() => tileZooms(requests)).toEqual([13]);
  await page.locator("[data-setup-map]").scrollIntoViewIfNeeded();
  // The middle of the pin's picture is above its tip: if the click went on to the map, the pin would jump up to it.
  await marker(page).click();
  await expect(pinBox(page, "lat")).toHaveValue("44.1628");
  await expect(pinBox(page, "lon")).toHaveValue("-77.3832");
  expect(searchParam(page, "lat")).toBe("44.1628");
  expect(searchParam(page, "lon")).toBe("-77.3832");
  // A double-click doesn't zoom: the + and - buttons and pinching do.
  const middle = await mapMiddle(page);
  await page.locator("[data-setup-map]").dblclick({ position: { x: middle.width / 2 + 80, y: middle.height / 2 + 60 } });
  await page.waitForTimeout(700);
  expect(tileZooms(requests)).toEqual([13]);
  await page.locator(".leaflet-control-zoom-in").click();
  await expect.poll(() => tileZooms(requests)).toEqual([13, 14]);
});

test("with only a region, the pin waits in its middle and Next waits until the person places it", async ({ page }) => {
  await openLink(page, REGION_ONLY, { to: "location" });
  await expectWaitingPin(page);
  // The pin sits in the middle of the region's MeshMapper zone, shown in the middle of the map.
  await page.locator("[data-setup-map]").scrollIntoViewIfNeeded();
  const middle = await mapMiddle(page);
  const tip = await pinTip(page);
  expect(Math.hypot(tip.x - middle.x, tip.y - middle.y)).toBeLessThan(3);
  // Moving away and back doesn't make it an answer.
  await page.locator("[data-setup-back]").click();
  await expectStep(page, "name");
  await next(page);
  await expectStep(page, "location");
  await expectWaitingPin(page);
  // A tap on the map places it: Next goes on, the line goes, and the spot is kept.
  await page.locator("[data-setup-map]").click({ position: { x: middle.width / 2 + 40, y: middle.height / 2 } });
  await expect(page.locator("[data-setup-pin-start]")).toHaveCount(0);
  await expect(nextButton(page)).toBeEnabled();
  const lat = await pinBox(page, "lat").inputValue();
  const lon = await pinBox(page, "lon").inputValue();
  expect(lat).not.toBe("");
  await expect.poll(() => searchParam(page, "lat")).toBe(lat);
  await next(page);
  expect(await commandLines(page)).toEqual(expect.arrayContaining([`set lat ${lat}`, `set lon ${lon}`]));
});

test("with only a region, dragging the pin, typing coordinates or disabling location each lets Next go on", async ({ page }) => {
  // Dragging the waiting pin.
  await openLink(page, REGION_ONLY, { to: "location" });
  await expectWaitingPin(page);
  await page.locator("[data-setup-map]").scrollIntoViewIfNeeded();
  const start = await pinTip(page);
  await page.mouse.move(start.x, start.y - 25);
  await page.mouse.down();
  await page.mouse.move(start.x + 30, start.y - 10, { steps: 8 });
  await page.mouse.move(start.x + 60, start.y + 5, { steps: 8 });
  await page.mouse.up();
  await expect(nextButton(page)).toBeEnabled();
  await expect(pinBox(page, "lat")).not.toHaveValue("");
  await expect(page.locator("[data-setup-pin-start]")).toHaveCount(0);

  // Typing: one box alone isn't a spot; both are.
  await openLink(page, REGION_ONLY, { to: "location" });
  await expectWaitingPin(page);
  await pinBox(page, "lat").fill("44.16");
  await expect(nextButton(page)).toBeDisabled();
  await pinBox(page, "lon").fill("-77.37");
  await expect(nextButton(page)).toBeEnabled();
  await expect(page.locator("[data-setup-pin-start]")).toHaveCount(0);
  await expect.poll(() => searchParam(page, "lat")).toBe("44.16");
  await next(page);
  expect(await commandLines(page)).toEqual(expect.arrayContaining(["set lat 44.16", "set lon -77.37"]));

  // Disabling location: Next goes on with no location lines. Turned back on, the pin waits again.
  await openLink(page, REGION_ONLY, { to: "location" });
  await expectWaitingPin(page);
  await page.locator("[data-setup-location-off]").check();
  await expect(nextButton(page)).toBeEnabled();
  await page.locator("[data-setup-location-off]").uncheck();
  await expectWaitingPin(page);
  await page.locator("[data-setup-location-off]").check();
  await next(page);
  expect((await commandLines(page)).some((line) => /^set (lat|lon) /.test(line))).toBe(false);
});

for (const lang of LANGS) {
  test(`${lang} a pin moved across a provincial line in the same region says so, and the province stays as chosen`, async ({ page }) => {
    // Ottawa and Gatineau are both in yow; the province, and so the scopes, differs.
    await openLink(page, `${ROUTES[lang]}?type=repeater&board=esp32&status=running&reflash=0&role=city&name=Test_R1&town=Ottawa&lat=45.4215&lon=-75.6972&tag=yow&province=on`, { to: "location" });
    await expect(marker(page)).toBeVisible();
    await expect(page.locator("[data-setup-other-region]")).toHaveCount(0);
    await pinBox(page, "lat").fill("45.4765");
    await pinBox(page, "lon").fill("-75.7013");
    await pinBox(page, "lon").press("Tab");
    await expect(page.locator("[data-setup-other-region]")).toHaveText(T("location.other-region", lang, { region: "Ottawa–Gatineau (yow), Québec" }));
    expect(searchParam(page, "tag")).toBe("yow");
    expect(searchParam(page, "province")).toBe("on");
    // Back on the Ontario side, the note goes.
    await pinBox(page, "lat").fill("45.4215");
    await pinBox(page, "lon").fill("-75.6972");
    await pinBox(page, "lon").press("Tab");
    await expect(page.locator("[data-setup-other-region]")).toHaveCount(0);
  });
}

for (const lang of LANGS) {
  test(`${lang} typed coordinates that aren't a spot in Canada say so and hold Next back`, async ({ page }) => {
    await openLink(page, BELLEVILLE_LINK(lang), { to: "location" });
    const message = page.locator("[data-setup-pin-message]");
    // The boxes are labelled, and say where their message is.
    await expect(page.getByLabel(T("location.lat", lang), { exact: true })).toHaveValue("44.1628");
    await expect(page.getByLabel(T("location.lon", lang), { exact: true })).toHaveValue("-77.3832");
    await expect(step(page).locator("fieldset legend")).toHaveText(T("location.typed", lang));
    // The longitude's minus sign forgotten: nothing is said while typing, and Next waits.
    await pinBox(page, "lon").fill("77.3832");
    await expect(message).toHaveText("");
    await expect(nextButton(page)).toBeDisabled();
    // Leaving the box says what's wrong, plainly.
    await pinBox(page, "lon").press("Tab");
    await expect(message).toHaveText(plain("location.invalid", lang));
    await expect(pinBox(page, "lon")).toHaveAttribute("aria-invalid", "true");
    await expect(nextButton(page)).toBeDisabled();
    // The link keeps the last pin that was a spot.
    expect(searchParam(page, "lon")).toBe("-77.3832");
    // Fixed, the message goes.
    await pinBox(page, "lon").fill("-77.3832");
    await expect(message).toHaveText("");
    await expect(nextButton(page)).toBeEnabled();
    for (const bad of ["abc", "44.1628, -77.3832", "", "12"]) {
      await pinBox(page, "lat").fill(bad);
      await pinBox(page, "lat").press("Tab");
      await expect(message, bad).toHaveText(plain("location.invalid", lang));
      await expect(nextButton(page), bad).toBeDisabled();
    }
    // A decimal comma is fine.
    await pinBox(page, "lat").fill("44,2");
    await expect(message).toHaveText("");
    await expect(pinBox(page, "lat")).not.toHaveAttribute("aria-invalid", "true");
    await expect(nextButton(page)).toBeEnabled();
    await expect.poll(() => searchParam(page, "lat")).toBe("44.2");
  });
}

for (const lang of LANGS) {
  test(`${lang} a pin moved into another region says so, and the region stays as chosen`, async ({ page }) => {
    await openLink(page, BELLEVILLE_LINK(lang), { to: "location" });
    await expect(page.locator("[data-setup-other-region]")).toHaveCount(0);
    // Kingston is in ygk, next door.
    await pinBox(page, "lat").fill("44.2298");
    await pinBox(page, "lon").fill("-76.481");
    await pinBox(page, "lon").press("Tab");
    await expect(page.locator("[data-setup-other-region]")).toHaveText(T("location.other-region", lang, { region: "Kingston (ygk), Ontario" }));
    expect(searchParam(page, "tag")).toBe("ytr");
    await expect(nextButton(page)).toBeEnabled();
    // Back in its own region, the note goes.
    await pinBox(page, "lat").fill("44.1628");
    await pinBox(page, "lon").fill("-77.3832");
    await pinBox(page, "lon").press("Tab");
    await expect(page.locator("[data-setup-other-region]")).toHaveCount(0);
  });
}

for (const lang of LANGS) {
  test(`${lang} Disable location shows the warning, hides the map and leaves set lat and set lon out`, async ({ page }) => {
    await openLink(page, BELLEVILLE_LINK(lang), { to: "location" });
    await expect(marker(page)).toBeVisible();
    const off = page.locator("[data-setup-location-off]");
    await expect(page.locator("label.setup-check").filter({ has: off })).toHaveText(T("location.off", lang));
    await expect(off).not.toBeChecked();
    await expect(page.locator("[data-setup-location-warning]")).toHaveCount(0);
    await off.check();
    await expect(page.locator("[data-setup-location-warning]")).toHaveText(T("location.off-warning", lang));
    await expect(page.locator("[data-setup-map]")).toHaveCount(0);
    await expect(page.locator("[data-setup-pin]")).toHaveCount(0);
    await expect(off).toBeChecked();
    await expect(off).toBeFocused();
    // The spot leaves the link, whatever was searched; the region stays.
    await expect.poll(() => searchParam(page, "shareLocation")).toBe("0");
    expect(new URL(page.url()).search).not.toMatch(/(?:^|&)(?:town|kind|lat|lon)=/);
    expect(searchParam(page, "tag")).toBe("ytr");
    await expect(nextButton(page)).toBeEnabled();
    await next(page);
    await expectStep(page, "commands");
    const lines = await commandLines(page);
    expect(lines.some((line) => /^set (lat|lon) /.test(line))).toBe(false);
    expect(lines).toContain("set name Test_R1");
    // Turned back on, the pin is where it was.
    await page.locator("[data-setup-back]").click();
    await expectStep(page, "location");
    await expect(off).toBeChecked();
    await expect(page.locator("[data-setup-location-warning]")).toBeVisible();
    await off.uncheck();
    await expect(marker(page)).toBeVisible();
    await expect(pinBox(page, "lat")).toHaveValue("44.1628");
    await expect(page.locator("[data-setup-location-warning]")).toHaveCount(0);
    await expect.poll(() => searchParam(page, "lat")).toBe("44.1628");
    expect(new URL(page.url()).searchParams.has("shareLocation")).toBe(false);
  });
}

test("the map step still works through the boxes when Leaflet or the tiles don't load", async ({ page }) => {
  await page.route("**/vendor/leaflet/leaflet.js*", (route) => route.abort());
  await openLink(page, BELLEVILLE_LINK(), { to: "location" });
  await expect(page.locator("[data-setup-map-failed]")).toHaveText(T("location.map-failed", "en"));
  await expect(page.locator("[data-setup-map]")).toHaveCount(0);
  await expect(step(page)).not.toContainText(T("location.how", "en"));
  await expect(pinBox(page, "lat")).toHaveValue("44.1628");
  await expect(nextButton(page)).toBeEnabled();
  await pinBox(page, "lat").fill("44.17");
  await pinBox(page, "lon").fill("-77.39");
  await next(page);
  expect(await commandLines(page)).toEqual(expect.arrayContaining(["set lat 44.17", "set lon -77.39"]));

  // Leaflet loads but no tile does: the same line, and the boxes still work.
  await page.unroute("**/vendor/leaflet/leaflet.js*");
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await openLink(page, BELLEVILLE_LINK(), { to: "location" });
  await expect(page.locator("[data-setup-map-failed]")).toHaveText(T("location.map-failed", "en"));
  await expect(page.locator("[data-setup-map]")).toHaveCount(0);
  await expect(pinBox(page, "lat")).toHaveValue("44.1628");
  await expect(nextButton(page)).toBeEnabled();
});

for (const lang of LANGS) {
  test(`${lang} the map location step has no serious accessibility problem, in light and dark, with a message, and disabled`, async ({ page }) => {
    await openLink(page, BELLEVILLE_LINK(lang), { to: "location" });
    await expect(marker(page)).toBeVisible();
    await expect(page.locator("[data-setup-map-status]")).toHaveCount(0);
    for (const scheme of ["default", "slate"]) {
      await page.locator(`input[data-md-color-scheme="${scheme}"]`).evaluate((element) => element.click());
      await expectToolAxe(page, `${lang} map (${scheme})`);
    }
    // The boxes are the keyboard way: neither the map nor the pin is a tab stop, and the zoom buttons speak the page's language.
    await expect(page.locator("[data-setup-map]")).toHaveClass(/leaflet-container/);
    expect(await page.locator("[data-setup-map]").evaluate((element) => element.hasAttribute("tabindex"))).toBe(false);
    expect(await marker(page).evaluate((element) => element.hasAttribute("tabindex"))).toBe(false);
    await expect(page.getByRole("button", { name: T("location.zoom-in", lang), exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: T("location.zoom-out", lang), exact: true })).toBeVisible();
    await expect(page.getByRole("group", { name: T("location.map", lang) })).toBeVisible();
    await pinBox(page, "lon").fill("77");
    await pinBox(page, "lon").press("Tab");
    await expect(page.locator("[data-setup-pin-message]")).not.toHaveText("");
    await expectToolAxe(page, `${lang} message`);
    await page.locator("[data-setup-location-off]").check();
    await expect(page.locator("[data-setup-location-warning]")).toBeVisible();
    await expectToolAxe(page, `${lang} disabled`);
  });
}
