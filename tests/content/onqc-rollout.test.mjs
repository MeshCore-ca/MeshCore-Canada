import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("every personal companion entry point gates ON/QC scopes on the announced Phase 2", () => {
  for (const french of [false, true]) {
    for (const page of ["start/companion", "meshcore/flash-companion", "config/standard"]) {
      const path = `docs/${page}${french ? ".fr" : ""}.md`;
      const source = readFileSync(path, "utf8");
      assert.match(source, french ? /La phase 2 n’est pas ouverte/ : /Phase 2 is not open/, path);
      assert.match(source, french ? /janvier 2027/ : /January 2027/, path);
      assert.match(source, french ? /Default Region Scope\*\* vide/ : /Default Region Scope\*\* empty/, path);
      assert.match(source, french ? /\*\*sans portée\*\*/ : /\*\*unscoped\*\*/, path);
      assert.match(source, french ? /\*\*Quand la phase 2 sera annoncée\*\*/ : /\*\*When Phase 2 is\s+announced\*\*/, path);
      assert.match(source, french ? /#ordre-de-deploiement/ : /#rollout-order/, path);
    }
  }
});

test("standards opt-in, Phase 3 and planning assignments stay separate from rollout approval", () => {
  const script = readFileSync("docs/assets/regions/regions.js", "utf8");
  assert.match(script, /standardDefaults: false/);
  assert.match(script, /data-onqc-settings-summary/);
  for (const french of [false, true]) {
    const source = readFileSync(`docs/config/standard${french ? ".fr" : ""}.md`, "utf8");
    assert.match(source, french ? /\*\*phase 3\*\*[\s\S]*après la phase 2 et une annonce locale/ : /\*\*Phase 3\*\*[\s\S]*after Phase 2 and announced locally/);
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
