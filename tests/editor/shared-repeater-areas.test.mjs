import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const catalog = JSON.parse(await readFile(
  new URL("../../docs/assets/regions/canada-regions.json", import.meta.url),
  "utf8"
));
const regionsScript = await readFile(
  new URL("../../docs/assets/regions/regions.js", import.meta.url),
  "utf8"
);
const editorHtml = await readFile(
  new URL("../../docs/config/editor/index.html", import.meta.url),
  "utf8"
);

function regionInternals() {
  const marker = "  if (window.document$";
  assert.ok(regionsScript.includes(marker));
  const instrumented = regionsScript.replace(
    marker,
    "  globalThis.__mccRegionTest = { prepareCatalog, expandSharedRepeaterLeaves, recommend };\n\n" + marker
  );
  const context = {
    URL,
    URLSearchParams,
    console,
    fetch() {
      throw new Error("Unexpected asset request in unit test");
    },
    window: {
      location: {
        origin: "https://meshcore.ca",
        pathname: "/config/",
        search: ""
      },
      setTimeout
    },
    document: {
      currentScript: {
        src: "https://meshcore.ca/assets/regions/regions.js"
      },
      readyState: "loading",
      addEventListener() {}
    }
  };
  runInNewContext(instrumented, context);
  return context.__mccRegionTest;
}

function ancestry(tag) {
  const path = [];
  let current = tag;
  while (current) {
    path.unshift(current);
    current = catalog.hierarchy[current]?.parent;
  }
  return path;
}

function sharedCommand(members) {
  const leaves = [...new Set(members)].sort((left, right) => {
    return ancestry(left).join("/").localeCompare(ancestry(right).join("/"));
  });
  const tags = [...new Set(leaves.flatMap(ancestry))];
  const tokens = tags.map((tag, index) => {
    if (index === tags.length - 1) return tag;
    const nextParent = catalog.hierarchy[tags[index + 1]]?.parent || "*";
    return nextParent === tag ? tag : `${tag}|${nextParent}`;
  });
  return `region def ${tokens.join(" ")}`;
}

function combinedCommand(members, externalIds) {
  const leaves = [...new Set(members)].sort((left, right) => {
    return ancestry(left).join("/").localeCompare(ancestry(right).join("/"));
  });
  const external = externalIds
    .map((id) => catalog.externalRegionPaths[id])
    .sort((left, right) => left.path.join("/").localeCompare(right.path.join("/")));
  const tags = [...new Set(leaves.flatMap(ancestry).concat(external.flatMap((record) => record.path)))];
  const parentOverrides = new Map();
  external.forEach((record) => {
    record.path.forEach((tag, index) => parentOverrides.set(tag, index ? record.path[index - 1] : null));
  });
  const tokens = tags.map((tag, index) => {
    if (index === tags.length - 1) return tag;
    const next = tags[index + 1];
    const nextParent = parentOverrides.has(next)
      ? parentOverrides.get(next)
      : catalog.hierarchy[next]?.parent;
    return nextParent === tag ? tag : `${tag}|${nextParent || "*"}`;
  });
  return `region def ${tokens.join(" ")}`;
}

test("National Capital Region keeps separate map leaves and emits one multi-branch repeater tree", () => {
  const ncr = catalog.searchGroups.ncr;
  assert.equal(ncr.geographic, false);
  assert.equal(ncr.emitInCommands, false);
  assert.deepEqual(ncr.members, ["ott", "gatout"]);
  assert.deepEqual(
    ncr.members.map((tag) => ancestry(tag)[1]),
    ["on", "qc"]
  );
  assert.equal(
    sharedCommand(ncr.members),
    "region def can on on-alg ott|can qc gatout"
  );
});

test("every declared cross-province group uses the shared member-path policy", () => {
  for (const [id, group] of Object.entries(catalog.searchGroups)) {
    const jurisdictions = new Set(group.members.map((tag) => ancestry(tag)[1]));
    if (jurisdictions.size < 2) continue;
    assert.deepEqual(group.repeaterConfig, {
      mode: "shared-member-paths",
      defaultForMembers: true,
      basis: group.repeaterConfig.basis
    }, id);
    assert.equal(sharedCommand(group.members).includes(` ${id} `), false, id);
  }
});

test("adding either shared-area member expands every member path", () => {
  const internals = regionInternals();
  const prepared = internals.prepareCatalog(JSON.parse(JSON.stringify(catalog)));
  const resolution = { primary: { seed: { tag: "tor" } } };

  for (const group of Object.values(catalog.searchGroups)) {
    if (!group.repeaterConfig?.defaultForMembers) continue;
    for (const member of group.members) {
      const recommendation = internals.recommend(
        prepared,
        resolution,
        "high-site",
        ["tor", member],
        []
      );
      const expected = ["tor", ...group.members].sort((left, right) => {
        return ancestry(left).join("/").localeCompare(ancestry(right).join("/"));
      });
      assert.deepEqual(Array.from(recommendation.leaves), expected, member);
      assert.ok(group.members.every((tag) => recommendation.tags.includes(tag)), member);
    }
  }
});

test("configurator and editor expose generic cross-province behavior without merging geometry", () => {
  assert.match(regionsScript, /Provinces and territories may be mixed\./);
  assert.match(regionsScript, /Add any Canadian region/);
  assert.match(regionsScript, /All map boundaries remain separate\./);
  assert.match(editorHtml, /This editor changes Canadian map cells only\./);
  assert.match(editorHtml, /Choose cross-province and U\.S\. paths in the configurator\./);
});

test("only traffic-evidenced neighbouring paths are offered and none is automatic geography", () => {
  assert.deepEqual(
    Object.keys(catalog.externalRegionPaths).sort(),
    ["california", "ohio", "oregon", "pennsylvania", "washington", "western-new-york"]
  );
  for (const [id, record] of Object.entries(catalog.externalRegionPaths)) {
    assert.equal(record.country, "us", id);
    assert.equal(record.geographic, false, id);
    assert.equal(record.automatic, false, id);
    assert.ok(record.trafficEvidence.routePatterns > 0, id);
    assert.ok(record.trafficEvidence.observations > 0, id);
    assert.equal(record.trafficEvidence.method, "mixed-canada-us-resolved-route", id);
  }
  assert.deepEqual(catalog.externalRegionPaths["western-new-york"].path, ["us", "us-ny"]);
  assert.deepEqual(catalog.externalRegionPaths.washington.path, ["west", "pnw", "wa"]);
  assert.deepEqual(catalog.externalRegionPaths.oregon.path, ["west", "pnw", "or"]);
});

test("Ontario bridge selection emits complete Canadian and Western New York branches", () => {
  assert.equal(
    combinedCommand(["tor", "wat"], ["western-new-york"]),
    "region def can on on-gtha gta tor|on on-ktw wat|* us us-ny"
  );
  assert.match(regionsScript, /Different repeaters can carry different paths to spread traffic\./);
  assert.match(regionsScript, /Add one only when this repeater should forward traffic for that area\./);
  assert.match(regionsScript, /Nothing outside Canada is added to the boundary map\./);
  assert.match(regionsScript, /requestedExternalPaths/);
});

test("config-to-map handoff preserves large Canadian and neighbouring selections", () => {
  assert.match(regionsScript, /params\.set\("type", "large"\)/);
  assert.match(regionsScript, /params\.set\("regions", state\.selectedMetros\.join\(","\)\)/);
  assert.match(regionsScript, /params\.set\("external", state\.selectedExternalPaths\.join\(","\)\)/);
  assert.match(regionsScript, /refreshTool\(data, els, state, updateMapLinks\)/);
  assert.match(regionsScript, /map\.fitBounds\(selectedLayer\.getBounds\(\)/);
});

test("documented neighbouring paths do not inherit Canadian draft warnings", () => {
  assert.ok(
    regionsScript.match(/if \(data\.externalTagLabels && data\.externalTagLabels\[tag\]\) return false;/g)?.length >= 2
  );
});
