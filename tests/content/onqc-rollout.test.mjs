import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const companionPages = ["start/companion", "meshcore/flash-companion", "config/standard"];

test("every personal companion entry point tells people to set a default scope now", () => {
  for (const french of [false, true]) {
    for (const page of companionPages) {
      const path = `docs/${page}${french ? ".fr" : ""}.md`;
      const source = readFileSync(path, "utf8");
      assert.doesNotMatch(source, /Phase 2|phase 2|January 2027|janvier 2027|Default Region Scope\*\* (empty|vide)/, path);
      assert.match(source, french ? /portée par défaut/i : /set (your|a) default (region )?scope/i, path);
      assert.match(source, french ? /Ontario[\s\S]*Québec[\s\S]*`onqc`/ : /Ontario[\s\S]*Québec[\s\S]*`onqc`/, path);
      assert.match(source, french ? /code de votre province/ : /your province['’]s code/, path);
    }
  }
});

test("the companion pages keep the how-to for the Default Region Scope setting", () => {
  for (const french of [false, true]) {
    for (const page of ["start/companion", "config/standard"]) {
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

test("standards opt-in and planning assignments stay separate from rollout approval", () => {
  const script = readFileSync("docs/assets/regions/regions.js", "utf8");
  assert.match(script, /standardDefaults: false/);
  assert.match(script, /data-onqc-settings-summary/);
  for (const french of [false, true]) {
    const source = readFileSync(`docs/config/standard${french ? ".fr" : ""}.md`, "utf8");
    assert.match(source, french ? /pas une extension approuvée/ : /not adopted\s+parts of that rollout/);
    assert.match(source, french ? /pas une configuration complète de la phase 1/ : /not a complete Phase 1 setup/);
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
