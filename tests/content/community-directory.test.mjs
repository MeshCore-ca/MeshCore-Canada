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
    "alberta-meshcore-networks",
    [
      "https://albertamesh.ca/",
      "https://discord.gg/CznDhsRWnJ",
      "https://albertamesh.ca/airdrie/",
      "https://albertamesh.ca/calgary/",
      "https://albertamesh.ca/edmonton/",
      "https://albertamesh.ca/lethbridge/",
      "https://albertamesh.ca/why-meshcore/",
      "https://albertamesh.ca/monitoring-tools/",
    ],
  ],
  [
    "airdrie-meshcore-network",
    [
      "https://albertamesh.ca/airdrie/",
      "https://albertamesh.ca/airdrie/configuration/",
      "https://discord.gg/CznDhsRWnJ",
      "https://yyc.meshmapper.net/?lat=51.28120&lon=-113.99718&zoom=13.43",
      "https://waev.app/#/live-map/@51.28107,-113.99966,14.47z",
    ],
  ],
  ["calgary-area-meshcore", ["https://t.me/meshtAlta", null]],
  [
    "calgary-meshcore-network",
    [
      "https://meshcorecalgary.ca/",
      "https://albertamesh.ca/calgary/",
      "https://discord.gg/CznDhsRWnJ",
      "https://yyc.meshmapper.net/?lat=51.01674&lon=-114.00149&zoom=11.00",
      "https://corescopeyyc.meshmonitoring.com/#/live",
      "https://albertamesh.ca/calgary/#rx-channels",
    ],
  ],
  [
    "edmonton-meshcore-network",
    [
      "https://albertamesh.ca/edmonton/",
      "https://albertamesh.ca/edmonton/configuration/",
      "https://discord.gg/CznDhsRWnJ",
      "https://yeg.meshmapper.net/?lat=53.45752&lon=-113.58320&zoom=10.03",
    ],
  ],
  [
    "yegmesh-ca",
    [
      "https://yegmesh.ca/p/getting-started",
      "https://yegmesh.ca/p/meshcore-defaults",
      "https://discord.gg/CznDhsRWnJ",
      "https://yeg.meshmapper.net/?lat=53.45752&lon=-113.58320&zoom=10.03",
    ],
  ],
  [
    "yqlmesh",
    [
      "https://www.yqlmesh.com/",
      "https://albertamesh.ca/lethbridge/",
      "https://discord.gg/cFY9GSR37W",
      "https://yql.meshmapper.net/?lat=49.69091&lon=-112.86356&zoom=12.14",
      "https://facebook.com/groups/YQLMesh",
      "https://instagram.com/YQLMesh",
      "https://x.com/YQLMesh",
      "https://www.reddit.com/r/YQLMesh",
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
      community.summary ?? "",
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

test("all 21 structured listings and every curated contact URL are preserved", () => {
  assert.equal(data.communities.length, 21);
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
  assert.match(output, /Community directory validated: 21 listings/);
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
  assert.deepEqual(idsMatching("Airdrie"), [
    "alberta-meshcore-networks",
    "airdrie-meshcore-network",
  ]);
  assert.deepEqual(idsMatching("Edmonton"), [
    "alberta-meshcore-networks",
    "edmonton-meshcore-network",
    "yegmesh-ca",
  ]);
  assert.deepEqual(idsMatching("AlbertaMesh"), [
    "alberta-meshcore-networks",
    "airdrie-meshcore-network",
    "calgary-meshcore-network",
    "edmonton-meshcore-network",
  ]);
  assert.deepEqual(idsMatching("Calgary"), [
    "alberta-meshcore-networks",
    "airdrie-meshcore-network",
    "calgary-area-meshcore",
    "calgary-meshcore-network",
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
  assert.match(index, new RegExp(`<strong>${active}</strong> listed active`));
  assert.match(index, new RegExp(`<strong>${forming}</strong> listed forming`));

  for (const page of data.directory_pages) {
    const markdown = readFileSync(join(provinceDir, `${page.slug}.md`), "utf8");
    assert.match(markdown, /^---\r?\n/);
    assert.match(markdown, /\ntitle: .+\n/);
    assert.match(markdown, /\ndescription: .+\n/);
    assert.match(markdown, /\nowner: directory-stewards\n/);
    assert.match(markdown, /\nlast_reviewed: 2026-07-19\n/);
    assert.match(markdown, /\nreview_by: 2027-01-15\n/);
    assert.match(markdown, /\npage_styles:\n  - assets\/styles\/communities\.css(?:\?v=\d{8}-\d+)?\n/);

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

test("all listings inherit the three-byte Canada baseline", () => {
  assert.equal(data.national_defaults.path_hash_mode, "3-byte");
  assert.equal(
    data.communities.every(
      (community) => community.settings.inherit_national === true,
    ),
    true,
  );

  const stoonmesh = data.communities.find(
    (community) => community.id === "stoonmesh",
  );
  assert.deepEqual(stoonmesh.settings.overrides, {});

  const saskatchewan = readFileSync(
    join(provinceDir, "saskatchewan.md"),
    "utf8",
  );
  assert.doesNotMatch(
    saskatchewan,
    /Local setting differs from the Canada baseline/,
  );
  assert.doesNotMatch(saskatchewan, /1-byte/);
  assert.match(saskatchewan, /Uses the Canada baseline/);
});

test("summaries and added social contact types render from structured data", () => {
  const yqlmesh = data.communities.find(
    (community) => community.id === "yqlmesh",
  );
  assert.equal(yqlmesh.summary, "Connecting Lethbridge, one node at a time");
  assert.deepEqual(
    yqlmesh.contacts.slice(-4).map((contact) => contact.type),
    ["facebook", "instagram", "x", "reddit"],
  );

  const alberta = readFileSync(join(provinceDir, "alberta.md"), "utf8");
  assert.match(
    alberta,
    /Building Alberta&#x27;s community-operated off-grid LoRa mesh network/,
  );
  assert.match(alberta, /<strong>Instagram:<\/strong>/);
  assert.match(alberta, /<strong>X:<\/strong>/);
  assert.match(alberta, /<strong>Reddit:<\/strong>/);
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
