import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const data = JSON.parse(
  readFileSync(join(root, "data", "communities.json"), "utf8"),
);
const provinceDir = join(root, "docs", "provinces");

const expectedCommunities = new Map([
  ["salish-mesh", ["https://salishmesh.net/"]],
  [
    "calgary-area-meshcore",
    ["https://t.me/meshtAlta", null],
  ],
  [
    "yqlmesh",
    [
      "https://www.yqlmesh.com",
      "https://www.facebook.com/groups/839542635605360",
      "https://discord.gg/89DUBvmvu2",
    ],
  ],
  ["southern-alberta", [null, "https://t.me/meshtAlta"]],
  [
    "yyc-meshcore-discord",
    ["https://discord.gg/CznDhsRWnJ", "https://meshmonitoring.com/"],
  ],
  ["stoonmesh", ["https://discord.gg/7yGnJuMGkG"]],
  [
    "greater-ottawa-mesh-enthusiasts",
    ["https://discord.gg/WSyNd8SfNr", "https://ottawamesh.ca/"],
  ],
  ["gta-lora-meshes", ["https://discord.gg/wSHbeb86r4"]],
  [
    "quinte-mesh-network",
    ["https://discord.gg/V5esJEP67X", "https://quintemesh.ca/"],
  ],
  ["mesh-quebec", ["https://qcmesh.net"]],
  ["montreal-mesh", ["https://www.montrealmesh.ca"]],
  ["reseau-mesh-capitale-yqb", ["https://discord.gg/UhGjTF2MfA"]],
  [
    "reseau-mesh-saguenay-lac-saint-jean-ytf",
    [
      "https://discord.gg/wUR394yXt",
      "https://www.facebook.com/share/g/1GjkHAyZAM/",
      "https://ytf.meshmapper.net/",
    ],
  ],
  ["reseau-libre", ["https://lora.reseaulibre.ca/"]],
  [
    "southern-new-brunswick",
    ["https://www.facebook.com/groups/613466831163684"],
  ],
  ["lunenburg-county-mesh", ["http://www.lunenburgcountymesh.ca"]],
]);

function normalize(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function searchIndex(community) {
  const page = data.directory_pages.find((candidate) =>
    candidate.codes.includes(community.province),
  );
  return normalize(
    [
      community.name,
      community.service_area,
      community.province,
      page.title,
      ...page.aliases,
      ...community.places,
      ...community.aliases,
    ].join(" "),
  );
}

function idsMatching(query) {
  const normalizedQuery = normalize(query);
  return data.communities
    .filter((community) => searchIndex(community).includes(normalizedQuery))
    .map((community) => community.id);
}

test("all 16 legacy listings and every contact URL are migrated", () => {
  assert.equal(data.communities.length, 16);
  assert.deepEqual(
    new Set(data.communities.map((community) => community.id)),
    new Set(expectedCommunities.keys()),
  );

  for (const community of data.communities) {
    assert.deepEqual(
      community.contacts.map((contact) => contact.url),
      expectedCommunities.get(community.id),
      `${community.id} contact migration`,
    );
  }

  assert.deepEqual(data.province_contacts, [
    {
      id: "alberta-meshcore-canada-telegram",
      province: "AB",
      type: "telegram",
      label: "Alberta topic in MeshCore Canada",
      url: "https://t.me/MeshCoreCAN",
      health: "needs-review",
      last_checked: null,
    },
  ]);
});

test("the generated directory cannot drift from structured data", () => {
  const output = execFileSync(
    "python",
    [join(root, "scripts", "validate-communities.py")],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
  assert.match(output, /Community directory validated: 16 listings/);
});

test("search covers reviewed place names and common aliases", () => {
  assert.deepEqual(idsMatching("YQL"), ["yqlmesh"]);
  assert.deepEqual(idsMatching("Ottawa"), ["greater-ottawa-mesh-enthusiasts"]);
  assert.deepEqual(idsMatching("Western Quebec"), [
    "greater-ottawa-mesh-enthusiasts",
  ]);
  assert.deepEqual(idsMatching("Belleville"), ["quinte-mesh-network"]);
  assert.deepEqual(idsMatching("Quebec City"), ["reseau-mesh-capitale-yqb"]);
  assert.deepEqual(idsMatching("YTF"), [
    "reseau-mesh-saguenay-lac-saint-jean-ytf",
  ]);
  assert.deepEqual(idsMatching("Montréal"), ["montreal-mesh", "reseau-libre"]);
  assert.deepEqual(idsMatching("Calgary"), [
    "calgary-area-meshcore",
    "yyc-meshcore-discord",
  ]);
});

test("the list remains complete without JavaScript or a map", () => {
  const index = readFileSync(join(provinceDir, "index.md"), "utf8");
  assert.match(index, /works without a map, location permission, or a GitHub account/);
  assert.equal(
    [...index.matchAll(/data-community-card(?=[\s>])/g)].length,
    data.communities.length,
  );
  for (const community of data.communities) {
    assert.match(index, new RegExp(`id="directory-${community.id}"`));
  }
});

test("overview counts, empty states, and page metadata are generated", () => {
  const index = readFileSync(join(provinceDir, "index.md"), "utf8");
  const active = data.communities.filter(
    (community) => community.status === "active",
  ).length;
  const forming = data.communities.filter(
    (community) => community.status === "forming",
  ).length;
  assert.match(index, new RegExp(`<strong>${active}</strong> active`));
  assert.match(index, new RegExp(`<strong>${forming}</strong> forming`));

  for (const page of data.directory_pages) {
    const markdown = readFileSync(join(provinceDir, `${page.slug}.md`), "utf8");
    assert.match(markdown, /^---\r?\n/);
    assert.match(markdown, /\ntitle: .+\n/);
    assert.match(markdown, /\ndescription: .+\n/);
    assert.match(markdown, /\nowner: directory-stewards\n/);
    assert.match(markdown, /\nlast_reviewed: 2026-07-19\n/);
    assert.match(markdown, /\nreview_by: 2027-01-15\n/);
    assert.match(markdown, /\npage_styles:\n  - assets\/styles\/communities\.css\n/);

    const communities = data.communities.filter((community) =>
      page.codes.includes(community.province),
    );
    if (communities.length === 0) {
      assert.match(markdown, /Help add the first listing/);
      assert.match(markdown, /Add a community/);
      assert.match(markdown, /Browse all Canadian communities/);
    }
  }
});

test("Saskatchewan retains the only local one-byte override", () => {
  const overrides = data.communities.filter(
    (community) => Object.keys(community.settings.overrides).length > 0,
  );
  assert.equal(data.national_defaults.path_hash_mode, "3-byte");
  assert.deepEqual(
    overrides.map((community) => [
      community.id,
      community.settings.overrides.path_hash_mode,
    ]),
    [["stoonmesh", "1-byte"]],
  );

  const saskatchewan = readFileSync(
    join(provinceDir, "saskatchewan.md"),
    "utf8",
  );
  assert.match(saskatchewan, /Local setting differs from the Canada baseline/);
  assert.match(
    saskatchewan,
    /Path hash mode: <strong>1-byte<\/strong>/,
  );
});

test("detail cards do not duplicate national radio settings", () => {
  for (const page of data.directory_pages) {
    const markdown = readFileSync(join(provinceDir, `${page.slug}.md`), "utf8");
    assert.doesNotMatch(markdown, /910\.525/);
    assert.doesNotMatch(markdown, /62\.5 kHz/);
    assert.doesNotMatch(markdown, /set path\.hash\.mode/);
    assert.match(markdown, /Send a community update/);
  }
});

test("raw HTML links use built-site routes instead of Markdown source paths", () => {
  const pages = [
    "index.md",
    ...data.directory_pages.map((page) => `${page.slug}.md`),
  ];
  for (const filename of pages) {
    const markdown = readFileSync(join(provinceDir, filename), "utf8");
    assert.doesNotMatch(markdown, /<a[^>]+href="[^"]+\.md(?:#|\")/);
  }
});
