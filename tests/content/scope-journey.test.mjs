import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import "../../docs/assets/regions/modules/iata-scopes.js";
import "../../docs/assets/regions/modules/scope-migration.js";
const catalog = JSON.parse(readFileSync("docs/assets/regions/iata-regions.json", "utf8"));
const scope = globalThis.MeshCoreIataScopes, migration = globalThis.MeshCoreScopeMigration;
const profile = (activation, bridge = true) => scope.profile(catalog, {home:"ytr",province:"on",bridge,activation});
const list = "*^\n ytr F\n on F\n onqc F\n can F\n na F";

test("preparation never changes wildcard/default or removes legacy scopes", () => {
  assert.equal(profile(undefined).activation,"prepare");
  assert.doesNotMatch(scope.commands(profile(undefined),"1.16").join("\n"), /region denyf|region default/);
  for (const firmware of ["1.10","1.14","1.15","1.16"]) {
    const prep = profile("prepare");
    assert.doesNotMatch(scope.commands(prep,firmware).join("\n"), /region (?:denyf|allowf) \*|region default|region remove/);
    assert.equal(scope.forwards(prep,"*"),null);
    assert.equal(scope.forwards(prep,"ytr"),true);
    assert.equal(scope.forwards(prep,"yul"),false);
    if (firmware === "1.10") continue;
    const old = migration.parse("*^ F\n ott F\n on F", "on");
    const plan = migration.plan(old,prep,firmware);
    assert.deepEqual(plan.removed,[]);
    assert.deepEqual(plan.wildcard,{before:true,after:true});
    assert.deepEqual(plan.defaultScope,{before:"on",after:"on"});
    assert.doesNotMatch(plan.commands.join("\n"),/region remove|region default|region (?:allowf|denyf) \*/);
  }
});
test("activation keeps the existing flat policy and independent forwarding decisions", () => {
  assert.ok(scope.commands(profile("activate"),"1.16").includes("region denyf *"));
  assert.ok(scope.commands(profile("activate"),"1.16").includes("region default ytr"));
  assert.equal(scope.forwards(profile("activate"),"*"),false);
  assert.equal(scope.forwards(profile("activate",false),"*"),true);
  assert.equal(scope.forwards(profile("activate"),"on"),true);
  assert.equal(scope.forwards(profile("activate"),"yul"),false);
});
test("verification distinguishes missing, nested, unexpected, wildcard and default mismatches", () => {
  assert.equal(migration.verify(migration.parse(list,"ytr"),profile("activate"),"1.16").complete,true);
  assert.equal(migration.verify(migration.parse(list,"ytr"),profile("activate"),"1.16").matches,true);
  assert.equal(migration.verify(migration.parse(list),profile("activate"),"1.16").complete,false);
  assert.equal(migration.verify(migration.parse(list,"on"),profile("activate"),"1.16").matches,false);
  assert.equal(migration.verify(migration.parse(list.replace("*^","*^ F"),"ytr"),profile("activate"),"1.16").wildcard,false);
  assert.deepEqual(migration.verify(migration.parse(list.replace(" ytr F"," ytr"),"ytr"),profile("activate"),"1.16").incorrect,["ytr"]);
  assert.deepEqual(migration.verify(migration.parse(list.replace(" ytr F\n on F"," on F\n  ytr F"),"ytr"),profile("activate"),"1.16").incorrect,["ytr"]);
  assert.equal(migration.verify(migration.parse(list,"<null>"),profile("activate"),"1.16").defaultMatches,false);
  assert.deepEqual(migration.verify(migration.parse(list.replace(" na F",""),"ytr"),profile("activate"),"1.16").missing,["na"]);
  assert.deepEqual(migration.verify(migration.parse(list+"\n old F","ytr"),profile("activate"),"1.16").unexpected,["old"]);
  assert.equal(migration.verify(migration.parse(list+"\n old F"),profile("prepare"),"1.16").matches,true);
  assert.equal(migration.verify(migration.parse(list),profile("activate"),"1.14").complete,true);
  assert.throws(()=>migration.parse("region\n"+list));
});
test("a published zone or settings check never invents a rollout announcement", () => {
  const records=JSON.parse(readFileSync("data/iata-region-profiles.json","utf8")).regions;
  for (const [tag,record] of Object.entries(catalog.profiles)) assert.deepEqual(record.rollout,records[tag]?.rollout || {phase:"unconfirmed",checkedAt:null,evidence:null});
});
