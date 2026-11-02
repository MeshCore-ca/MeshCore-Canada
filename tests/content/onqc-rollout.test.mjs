import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const companionPages = ["start/companion", "meshcore/flash-companion", "config/guide"];

// The admonition that starts with `!!! note "..."`: its title line and its indented body.
function scopeNote(source, path) {
  const lines = source.split("\n");
  const start = lines.findIndex(line => line.startsWith("!!! note "));
  assert.notEqual(start, -1, `${path} has no scope note`);
  let end = start + 1;
  while (end < lines.length && (lines[end].trim() === "" || lines[end].startsWith("    "))) end += 1;
  return lines.slice(start, end).join("\n");
}

test("every personal companion entry point tells people to set a default scope now", () => {
  for (const french of [false, true]) {
    for (const page of companionPages) {
      const path = `docs/${page}${french ? ".fr" : ""}.md`;
      const source = readFileSync(path, "utf8");
      assert.doesNotMatch(source, /Phase 2|phase 2|January 2027|janvier 2027|Default Region Scope\*\* (empty|vide)/, path);
      const note = scopeNote(source, path);
      assert.match(note, french ? /^!!! note "Réglez dès maintenant votre portée par défaut"/ : /^!!! note "Set your default scope now"/, path);
      assert.match(note, french
        ? /\*\*Ontario ou Québec :\*\* utilisez `onqc`/
        : /\*\*Ontario or Québec:\*\* use `onqc`/, path);
      assert.match(note, french
        ? /\*\*Ailleurs :\*\* utilisez le code de votre province/
        : /\*\*Elsewhere:\*\* use your province['’]s code/, path);
      // The "why", the same on every page.
      assert.match(note.replace(/\s+/g, " "), french
        ? /Les répéteurs de bordure ne retransmettent pas les messages sans portée : sans portée par défaut, vos messages risquent de ne pas dépasser votre secteur/
        : /Edge repeaters don['’]t pass on messages that have no scope, so without a default scope your messages may not reach beyond your own area/, path);
    }
  }
});

test("the companion guide shows the default scope steps with its six screenshots", () => {
  const shots = ["01-connected", "02-settings", "03-select-region", "04-add-region", "05-pick-onqc", "06-saved"];
  for (const french of [false, true]) {
    const source = readFileSync(`docs/start/companion${french ? ".fr" : ""}.md`, "utf8");
    assert.match(source, french ? /\{#regler-votre-portee-par-defaut\}/ : /\{#set-your-default-scope\}/);
    for (const shot of shots) {
      const image = source.match(new RegExp(`!\\[([^\\]]{20,})\\]\\(\\.\\./assets/images/onqc-scopes/companion-${shot}\\.webp\\)`));
      assert.ok(image, `${french ? "FR" : "EN"} companion guide needs ${shot} with alt text`);
    }
    // The other pages point to those steps instead of repeating them.
    for (const page of ["meshcore/flash-companion", "config/guide"]) {
      const other = readFileSync(`docs/${page}${french ? ".fr" : ""}.md`, "utf8");
      assert.match(other, french ? /companion\.md#regler-votre-portee-par-defaut/ : /companion\.md#set-your-default-scope/, page);
    }
  }
});

test("the companion pages keep the how-to for the Default Region Scope setting", () => {
  for (const french of [false, true]) {
    for (const page of ["start/companion", "config/guide"]) {
      const source = readFileSync(`docs/${page}${french ? ".fr" : ""}.md`, "utf8");
      assert.match(source, /Network Settings/, page);
      assert.match(source, /Default Region Scope/, page);
    }
  }
});

test("the scripts no longer tell companions to wait for a later phase", () => {
  const profile = readFileSync("docs/assets/javascripts/region-profile.js", "utf8");
  const regions = readFileSync("docs/assets/regions/regions.js", "utf8");
  for (const [name, source] of [["region-profile.js", profile], ["regions.js", regions]]) {
    assert.doesNotMatch(source, /Phase 2|phase 2|January 2027|janvier 2027|repeaters first|les répéteurs d’abord/, name);
  }
  assert.match(profile, /Default Region Scope/);
  assert.match(profile, /onqc/);
});

test("standards opt-in stays in the configurator and starter regions stay apart from MeshMapper zones", () => {
  const script = readFileSync("docs/assets/regions/regions.js", "utf8");
  assert.match(script, /standardDefaults: false/);
  assert.match(script, /data-onqc-settings-summary/);
  for (const french of [false, true]) {
    const source = readFileSync(`docs/config/guide${french ? ".fr" : ""}.md`, "utf8").replace(/\s+/g, " ");
    assert.match(source, french ? /ce ne sont pas des zones MeshMapper/ : /not MeshMapper zones, and they don't claim radio coverage/);
  }
});

test("current country-scope guidance uses can in both languages without rewriting migration examples", () => {
  for (const french of [false, true]) {
    for (const page of ["start/companion", "analyzer/iata-codes"]) {
      const path = `docs/${page}${french ? ".fr" : ""}.md`;
      const source = readFileSync(path, "utf8");
      assert.match(source, /`can`/, path);
      assert.doesNotMatch(source, /`ca`/, path);
    }
    const proposal = readFileSync(`docs/proposals/onqc-scopes${french ? ".fr" : ""}.md`, "utf8");
    assert.match(proposal, /region remove can/);
    assert.match(proposal, /`can`/);
  }
  const map = readFileSync("docs/assets/regions/regions.js", "utf8");
  assert.match(map, /City, province, mesh scope where defined, can, and na/);
  assert.doesNotMatch(map, /mesh scope where defined, ca,/);
  assert.match(readFileSync("docs/start/companion.fr.md", "utf8"), /\{#choisir-un-scope\}/, "Keep existing French companion links working");
});

test("scope explanations do not promise universal delivery or geographic containment", () => {
  const english = readFileSync("docs/proposals/onqc-scopes.md", "utf8");
  const french = readFileSync("docs/proposals/onqc-scopes.fr.md", "utf8");
  assert.doesNotMatch(english, /Everyone in Ontario and Québec can talk|contained no matter what|still reaches everyone|Every repeater carries `can` now|Edge repeaters still block/);
  assert.doesNotMatch(french, /Tout le monde en Ontario et au Québec peut se parler|contenus quoi qu’il arrive|joint quand même tout le monde|Chaque répéteur porte `can` dès maintenant|bordure bloquent toujours/);
  assert.match(english, /forwarding rules and hop limits/);
  assert.match(french, /règles de retransmission et les limites de sauts/);
  assert.match(english, /After coordinated activation/);
  assert.match(french, /Après l’activation coordonnée/);
});
