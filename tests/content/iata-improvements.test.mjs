import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { compareSnapshots, reviewText } from "../../scripts/check-meshmapper-changes.mjs";

const read = name => readFileSync(name, "utf8");
const catalog = JSON.parse(read("docs/assets/regions/iata-regions.json"));
const boundaries = JSON.parse(read("docs/assets/regions/iata-boundaries.geojson"));
const snapshot = JSON.parse(read("docs/assets/regions/meshmapper-iata-boundaries.geojson"));
const context = vm.createContext({ TextEncoder });
for (const name of ["iata-scopes", "scope-migration"]) vm.runInContext(read(`docs/assets/regions/modules/${name}.js`), context);
vm.runInContext(read("docs/assets/javascripts/place-search.js"), context);
const scope = context.MeshCoreIataScopes, migration = context.MeshCoreScopeMigration, places = context.MeshCorePlaceSearch;
const plain = value => JSON.parse(JSON.stringify(value));

test("remaining city centres have assigned IATA planning regions", () => {
  for (const [tag, lat, lon] of [["yhz",44.648,-63.575],["yqm",46.088,-64.778],["yfc",45.964,-66.643], ["ysj",45.273,-66.063],
    ["yqr",50.445,-104.618],["yxe",52.134,-106.67],["ylw",49.888,-119.496],["yxs",53.9171,-122.7497],["ysb",46.492,-80.993]]) {
    assert.deepEqual(plain(scope.matches(boundaries,lat,lon)).map(f => f.properties.tag), [tag]);
    assert.equal(catalog.status[tag].state, "starter");
  }
  assert.equal(new Set(catalog.seeds.flatMap(seed => seed.provinces)).size, 13);
});

test("ambiguous place names keep province choices and never accept a mismatched suffix", () => {
  assert.deepEqual(plain(places.lookupQueries("Saint-Jean")), ["Saint-Jean", "Saint John", "St. John's"]);
  assert.deepEqual(plain(places.lookupQueries("Saint-Jean, NB")), ["Saint John"]);
  assert.deepEqual(plain(places.lookupQueries("Saint-Jean, NL")), ["St. John's"]);
  assert.equal(places.placeCandidates([{key:"geonames",name:"Cambridge Bay",province:"Nunavut",category:"Hameau constitué",lat:69.113889,lng:-105.05278}],"Cambridge Bay, NU").length,1);
  const rows = [
    { key: "geonames", name: "Saint-Jean", province: "Québec", category: "Ville", lat:45.3,lng:-73.3 },
    { key: "geonames", name: "Saint-Jean", province: "New Brunswick", category: "City", lat:45.273,lng:-66.063 },
    { key: "geonames", name: "Saint-Jean", province: "Newfoundland and Labrador", category: "City", lat:47.56,lng:-52.71 },
  ];
  assert.equal(places.placeCandidates(rows,"Saint-Jean").length,3);
  assert.equal(places.placeCandidates(rows,"Saint-Jean, QC")[0].province,"Québec");
  assert.equal(places.placeCandidates(rows,"Saint-Jean, Ontario").length,0);
});

test("migration compares permissions and default separately from the home marker", () => {
  const current=migration.parse("* F\n can F\n  on F\n   on-alg F\n    ott^ F\n yow", "default scope is on");
  assert.equal(current.home,"ott");
  assert.equal(current.defaultScope,"on");
  const desired=scope.profile(catalog,{home:"yow",province:"on",bridge:true});
  const plan=plain(migration.plan(current,desired,"1.16"));
  assert.deepEqual(plan.kept,["yow","on","can"]);
  assert.deepEqual(plan.added,["onqc"]);
  assert.deepEqual(plan.removed,["on-alg","ott"]);
  assert.deepEqual(plan.changed,["yow","on"]);
  assert.ok(plan.commands.indexOf("region remove ott")<plan.commands.indexOf("region remove on-alg"));
  assert.ok(plan.commands.includes("region home yow"));
  assert.deepEqual(plan.wildcard,{before:true,after:false});
  assert.deepEqual(plan.defaultScope,{before:"on",after:"yow"});
  assert.ok(!plan.commands.includes("region remove *"));
  assert.ok(!plan.commands.some(line=>/set |password|erase|reboot/.test(line)));
  assert.equal(migration.parse("* F\n yow^ F").defaultScope,null);
});

test("migration detaches retained children before removing obsolete parents", () => {
  const old=migration.parse("* F\n old F\n  yow F");
  const desired=scope.profile(catalog,{home:"yow",province:"on"});
  for (const firmware of ["1.14","1.15","1.16"]) {
    const result=migration.plan(old,desired,firmware);
    assert.equal(result.commands[0],"region put yow");
    assert.equal(result.commands[1],"region remove old");
    if(firmware==="1.14") assert.ok(!result.commands.some(line=>line.startsWith("region default")));
  }
  for(const text of ["", "* F\n yow F\n yow F", "* F\n   yow F", "* F\n\tyow F", "* F\n yow;erase F", "* F\n yow F\n…", "region\n* F", "* F\n old^ F\n yow^ F", "* F\n __proto__ F", "* F\n" + Array.from({length:32},(_,i)=>` r${i} F`).join("\n")]) assert.throws(()=>migration.parse(text), text);
  assert.throws(()=>migration.parse("* F\n yow F","default scope is missing"));
});

test("guide and configurator share firmware-specific scope and standard commands", () => {
  assert.match(read("docs/assets/javascripts/scopes-picker.js"),/scopeEngine.commands\(profile, firmwareId\(version\)\)/);
  assert.match(read("docs/assets/regions/regions.js"),/iataScopes.standardCommands\(settings.firmware, false\)/);
  assert.deepEqual(plain(scope.standardCommands("1.10")),["set advert.interval 240","set flood.advert.interval 47","set flood.max 16"]);
  assert.equal(scope.standardCommands("1.16")[0],"set path.hash.mode 2");
});

test("profiles do not confuse directory contact checks with radio approval or appointment", () => {
  const records = JSON.parse(read("data/iata-region-profiles.json")).regions;
  assert.equal(Object.keys(catalog.profiles).length,catalog.seeds.length);
  assert.ok(catalog.profiles.yow.communities.some(c=>c.id==="greater-ottawa-mesh-enthusiasts"));
  assert.ok(catalog.profiles.yqr.communities.some(c=>c.id==="yqrmesh"));
  for(const [tag,profile] of Object.entries(catalog.profiles)) {
    assert.deepEqual(profile.maintainer,records[tag]?.maintainer || null);
    assert.deepEqual(profile.settingsReview,records[tag]?.settingsReview || {status:"unconfirmed",checkedAt:null,evidence:null});
    for(const community of profile.communities) assert.match(community.route,/^\/provinces\/[a-z-]+\/#community-[a-z-]+$/);
  }
});

test("source review detects renames, geometry changes, removals and starter collisions but ignores fetch time", () => {
  assert.equal(compareSnapshots(snapshot,{...snapshot,fetchedAt:"2099-01-01"}).needsReview,false);
  const next=structuredClone(snapshot), removed=next.features.pop().properties.tag;
  next.features[0].properties.name="Changed @everyone <script>";
  next.features[1].geometry.coordinates[0][0][0]+=0.01;
  const extra=structuredClone(next.features[2]); extra.properties.tag="yqr"; next.features.push(extra);
  const result=compareSnapshots(snapshot,next,["yqr"]);
  assert.deepEqual(result.added,["yqr"]); assert.deepEqual(result.removed,[removed]);
  assert.deepEqual(result.collisions,["yqr"]); assert.equal(result.changed.length,2);
  assert.doesNotMatch(reviewText(result),/@everyone|<script>/);
  const workflow=read(".github/workflows/meshmapper-review.yml");
  assert.match(workflow,/refs\/heads\/main/); assert.match(workflow,/issues: write/);
  assert.doesNotMatch(workflow,/contents: write|git push|ssh |deploy|pull_request_target/);
});
