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
