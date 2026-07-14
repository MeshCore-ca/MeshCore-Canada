#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ASSET_DIR = path.join(ROOT, "docs", "assets", "regions");
const DATA_PATH = path.join(ASSET_DIR, "canada-regions.json");
const MESH_MAPPER_PATH = path.join(ASSET_DIR, "meshmapper-canada-regions.json");
const MEMBERSHIP_PATH = path.join(ASSET_DIR, "canada-region-membership.csv");
const PARTITION_PATH = path.join(ASSET_DIR, "canada-region-partition.geojson");
const DIGITAL_PARTITION_PATH = path.join(ASSET_DIR, "canada-region-partition-digital.geojson");
const QA_PATH = path.join(ASSET_DIR, "canada-region-partition.qa.json");
const SCRIPT_PATH = path.join(ASSET_DIR, "regions.js");
const STANDARD_PATH = path.join(ROOT, "docs", "regions", "standard.md");

const MAX_TAG_BYTES = 29;
const MAX_PROFILE_TAGS = 32;
const MAX_RESPONSE_BYTES = 172;
const MAX_REGION_DEF_CHARS = 160;
const TAG_RE = /^[a-z0-9-]+$/;
const PR_TO_TAG = {
  "10": "nl", "11": "pe", "12": "ns", "13": "nb", "24": "qc", "35": "on", "46": "mb",
  "47": "sk", "48": "ab", "59": "bc", "60": "yt", "61": "nt", "62": "nu"
};

const failures = [];
const warnings = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${path.relative(ROOT, file)} could not be read: ${error.message}`);
    return null;
  }
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeAlias(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ancestryFor(data, tag) {
  const result = [];
  const seen = new Set();
  let current = tag;
  while (current) {
    if (seen.has(current)) {
      failures.push(`hierarchy cycle found at ${tag}`);
      break;
    }
    seen.add(current);
    result.unshift(current);
    current = data.hierarchy[current] && data.hierarchy[current].parent;
  }
  return result;
}

function validate(data, meshMapper, partition, digitalPartition, qa, scriptText, standardText) {
  check(data.authority && data.authority.standard === "MCC-REG-1", "catalog does not declare MCC-REG-1");
  check(data.authority && data.authority.geographicModel === "exclusive-national-partition", "catalog is not an exclusive partition");
  check(data.authority && data.authority.currentBoundaryStatus === "generated-candidate", "boundary status must be generated-candidate");
  check(data.meta && data.meta.rootTag === "can", "root tag must be can");
  check(!Object.prototype.hasOwnProperty.call(data, "routingOverlays"), "routingOverlays are forbidden");
  check(!Object.prototype.hasOwnProperty.call(data, "profiles"), "profile-added scopes are forbidden");

  const hierarchyTags = Object.keys(data.hierarchy || {});
  const children = new Map();
  hierarchyTags.forEach((tag) => {
    const parent = data.hierarchy[tag].parent;
    if (parent) children.set(parent, (children.get(parent) || []).concat(tag));
  });
  const leaves = hierarchyTags.filter((tag) => !(children.get(tag) || []).length).sort();
  const seedTags = (data.seeds || []).map((seed) => seed.tag).sort();
  const expectedNodes = Number(data.strategy && data.strategy.hierarchyNodes);
  const expectedLeaves = Number(data.strategy && data.strategy.generatedLeafRegions);

  check(hierarchyTags.length === expectedNodes, `expected ${expectedNodes} hierarchy nodes, found ${hierarchyTags.length}`);
  check(leaves.length === expectedLeaves, `expected ${expectedLeaves} leaves, found ${leaves.length}`);
  check(seedTags.length === expectedLeaves, `expected ${expectedLeaves} seeds, found ${seedTags.length}`);
  check(JSON.stringify(leaves) === JSON.stringify(seedTags), "every leaf must have exactly one matching seed");
  check(new Set(seedTags).size === seedTags.length, "seed tags must be unique");

  const jurisdictions = hierarchyTags.filter((tag) => data.hierarchy[tag].parent === "can");
  check(jurisdictions.length === 13, `expected 13 jurisdictions, found ${jurisdictions.length}`);
  hierarchyTags.forEach((tag) => {
    const entry = data.hierarchy[tag];
    check(TAG_RE.test(tag), `invalid tag characters: ${tag}`);
    check(Buffer.byteLength(tag, "utf8") <= MAX_TAG_BYTES, `tag exceeds ${MAX_TAG_BYTES} bytes: ${tag}`);
    if (entry.parent !== null) check(Boolean(data.hierarchy[entry.parent]), `${tag} has missing parent ${entry.parent}`);
    check(!entry.sharedParents, `${tag} has forbidden sharedParents`);
    const chain = ancestryFor(data, tag);
    check(chain[0] === "can", `${tag} does not descend from can`);
    check(Boolean(data.status && data.status[tag]), `${tag} has no status record`);
  });
  check(Object.keys(data.status || {}).length === hierarchyTags.length, "status records must match hierarchy records exactly");

  const leafSet = new Set(leaves);
  Object.entries(data.searchGroups || {}).forEach(([name, group]) => {
    check(group.geographic === false, `search group ${name} must be explicitly non-geographic`);
    check(group.emitInCommands === false, `search group ${name} must not enter commands`);
    check(Array.isArray(group.members) && group.members.length > 1, `search group ${name} needs at least two members`);
    (group.members || []).forEach((member) => check(leafSet.has(member), `search group ${name} references non-leaf ${member}`));
  });

  const aliasOwners = new Map();
  Object.entries(data.aliases || {}).forEach(([owner, aliases]) => {
    check(Boolean(data.hierarchy[owner]), `alias owner ${owner} is unknown`);
    aliases.forEach((alias) => {
      const normalized = normalizeAlias(alias);
      if (!normalized) return;
      if (!aliasOwners.has(normalized)) aliasOwners.set(normalized, new Set());
      aliasOwners.get(normalized).add(owner);
    });
  });
  const ambiguousAliases = [...aliasOwners.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([alias, owners]) => `${alias}=[${[...owners].sort().join(",")}]`)
    .sort();
  if (ambiguousAliases.length) {
    warnings.push(`ambiguous aliases require context: ${ambiguousAliases.join("; ")}`);
    check(scriptText.includes("That name matches more than one region"), "UI must fail closed on ambiguous aliases");
  }

  const sourceFeatures = meshMapper && Array.isArray(meshMapper.features) ? meshMapper.features : [];
  check(sourceFeatures.length === Number(meshMapper && meshMapper.featureCount), "MeshMapper feature count does not match metadata");
  check(sourceFeatures.length === 29, `expected 29 MeshMapper source features, found ${sourceFeatures.length}`);
  check(sourceFeatures.length === Object.keys(data.meshMapperTagMap || {}).length, "every MeshMapper source needs one crosswalk");
  const mappedCanonical = new Set();
  sourceFeatures.forEach((feature) => {
    const rawTag = String(feature.properties.tag || feature.properties.code || "").toLowerCase();
    const target = data.meshMapperTagMap[rawTag];
    check(leafSet.has(target), `MeshMapper feature ${rawTag} maps to non-leaf ${target}`);
    if (target) mappedCanonical.add(target);
  });
  check(mappedCanonical.size === 27, `expected 27 canonical MeshMapper mappings, found ${mappedCanonical.size}`);
  check(Object.values(data.meshMapperReview || {}).some((review) => review.state === "quarantined"), "known source outlier must remain quarantined");

  const membershipText = fs.readFileSync(MEMBERSHIP_PATH, "utf8").trimEnd();
  const membershipLines = membershipText.split(/\r?\n/);
  check(membershipLines[0] === "DGUID,DAUID,PRUID,ERUID,leaf_tag,assignment", "membership header is invalid");
  check(membershipLines.length === 57_937, `expected 57,936 membership rows, found ${membershipLines.length - 1}`);
  const dguids = new Set();
  const membershipTags = new Set();
  const membershipCounts = new Map();
  membershipLines.slice(1).forEach((line, index) => {
    const [dguid, dauid, pruid, eruid, leafTag, assignment] = line.split(",");
    check(Boolean(dguid && dauid && pruid && eruid && leafTag && assignment), `membership row ${index + 2} is incomplete`);
    check(!dguids.has(dguid), `duplicate membership DGUID ${dguid}`);
    dguids.add(dguid);
    membershipTags.add(leafTag);
    membershipCounts.set(leafTag, (membershipCounts.get(leafTag) || 0) + 1);
    check(leafSet.has(leafTag), `membership references non-leaf ${leafTag}`);
    const chain = ancestryFor(data, leafTag);
    check(chain[1] === PR_TO_TAG[pruid], `${dguid} crosses jurisdiction: ${pruid} -> ${leafTag}`);
  });
  check(dguids.size === 57_936, `expected 57,936 unique DGUIDs, found ${dguids.size}`);
  check(JSON.stringify([...membershipTags].sort()) === JSON.stringify(leaves), "membership must populate every leaf and no other tag");
  leaves.forEach((tag) => check((membershipCounts.get(tag) || 0) > 0, `leaf ${tag} owns no DAs`));

  const partitionFeatures = partition && Array.isArray(partition.features) ? partition.features : [];
  const partitionTags = partitionFeatures.map((feature) => String(feature.properties && feature.properties.tag || "")).sort();
  check(partition && partition.type === "FeatureCollection", "partition is not a FeatureCollection");
  check(partitionFeatures.length === expectedLeaves, `expected ${expectedLeaves} partition features, found ${partitionFeatures.length}`);
  check(JSON.stringify(partitionTags) === JSON.stringify(leaves), "partition tags must match leaf tags exactly");
  partitionFeatures.forEach((feature) => {
    const props = feature.properties || {};
    const geometry = feature.geometry || {};
    check(Boolean(props.registryId && props.label && props.parent && props.jurisdiction), `partition feature ${props.tag} has incomplete properties`);
    check(["Polygon", "MultiPolygon"].includes(geometry.type), `partition feature ${props.tag} has invalid geometry type`);
    check(Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0, `partition feature ${props.tag} is empty`);
    check(props.parent === data.hierarchy[props.tag].parent, `partition parent mismatch for ${props.tag}`);
    check(Number(props.daCount) === membershipCounts.get(props.tag), `partition DA count mismatch for ${props.tag}`);
  });
  const digitalFeatures = digitalPartition && Array.isArray(digitalPartition.features) ? digitalPartition.features : [];
  const digitalTags = digitalFeatures.map((feature) => String(feature.properties && feature.properties.tag || "")).sort();
  check(digitalPartition && digitalPartition.type === "FeatureCollection", "digital partition is not a FeatureCollection");
  check(digitalFeatures.length === expectedLeaves, `expected ${expectedLeaves} digital features, found ${digitalFeatures.length}`);
  check(JSON.stringify(digitalTags) === JSON.stringify(leaves), "digital partition tags must match leaf tags exactly");
  digitalFeatures.forEach((feature) => {
    const props = feature.properties || {};
    const geometry = feature.geometry || {};
    check(["Polygon", "MultiPolygon"].includes(geometry.type), `digital feature ${props.tag} has invalid geometry type`);
    check(Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0, `digital feature ${props.tag} is empty`);
    check(Number(props.daCount) === membershipCounts.get(props.tag), `digital DA count mismatch for ${props.tag}`);
  });

  check(qa && qa.model === "exclusive-national-da-partition", "QA model is not the exclusive national partition");
  check(qa && qa.sourceCounts.digitalDisseminationAreas === 57_936, "QA digital DA count is wrong");
  check(qa && qa.sourceCounts.cartographicDisseminationAreas === 57_932, "QA cartographic DA count is wrong");
  check(qa && qa.sourceCounts.leafRegions === expectedLeaves, "QA leaf count is wrong");
  check(qa && qa.invariants.everyDigitalDaAssignedExactlyOnce === true, "QA does not prove total DA ownership");
  check(qa && qa.invariants.everyLeafOwnsAtLeastOneDa === true, "QA reports an empty leaf");
  check(qa && qa.invariants.crossJurisdictionAssignments === 0, "QA reports cross-jurisdiction assignments");
  check(qa && qa.invariants.positiveAreaOverlapPairs === 0, "QA reports positive-area overlaps");
  check(qa && qa.invariants.invalidLeafGeometries === 0, "QA reports invalid leaf geometry");
  check(qa && qa.invariants.displayGeometryVerified === true, "QA does not verify the simplified display geometry");
  check(qa && qa.invariants.displaySeedsResolvedExactlyOnce === expectedLeaves, "QA display seed routing count is wrong");
  check(qa && qa.artifactHashes.membershipSha256 === sha256(MEMBERSHIP_PATH), "membership hash differs from QA");
  check(qa && qa.artifactHashes.partitionSha256 === sha256(PARTITION_PATH), "partition hash differs from QA");
  check(qa && qa.artifactHashes.digitalPartitionSha256 === sha256(DIGITAL_PARTITION_PATH), "digital partition hash differs from QA");

  let maxTags = 0;
  let maxResponseBytes = 0;
  let maxRegionDefChars = 0;
  leaves.forEach((tag) => {
    const tags = unique(ancestryFor(data, tag));
    const responseBytes = Buffer.byteLength(tags.join(","), "utf8") + 1;
    const defChars = `region def ${tags.join(" ")}`.length;
    maxTags = Math.max(maxTags, tags.length);
    maxResponseBytes = Math.max(maxResponseBytes, responseBytes);
    maxRegionDefChars = Math.max(maxRegionDefChars, defChars);
    check(tags.length <= MAX_PROFILE_TAGS, `${tag} path exceeds ${MAX_PROFILE_TAGS} tags`);
    check(responseBytes <= MAX_RESPONSE_BYTES, `${tag} path exceeds ${MAX_RESPONSE_BYTES} response bytes`);
    check(defChars <= MAX_REGION_DEF_CHARS, `${tag} region def exceeds ${MAX_REGION_DEF_CHARS} characters`);
  });

  check(!scriptText.includes("region dump"), "obsolete 'region dump' command remains in regions.js");
  check(scriptText.includes('verificationCommands = ["region"]'), "guided verification must use bare region command");
  check(scriptText.includes('commands.concat(["region", "region save", "region"])'), "technical flow must verify before and after saving");
  check(scriptText.includes("Check, save, and verify"), "guided flow must verify before saving");
  check(scriptText.includes("Too many regions selected"), "command generation must fail closed on firmware limits");
  check(scriptText.includes('"canada-region-partition.geojson"'), "UI does not load the generated partition");
  check(scriptText.includes('"canada-region-partition-digital.geojson"'), "UI does not load the complete resolver partition");
  check(!scriptText.includes('fetch(new URL("meshmapper-canada-regions.json"'), "UI must not load raw MeshMapper polygons");
  check(!scriptText.includes("data.meshMapperRegions"), "UI still references raw MeshMapper geometry");
  check(!scriptText.includes("L.circle([seed.lat"), "UI still draws overlapping strategy circles");
  check(scriptText.includes("data-role=\"region-children\""), "map is missing parent-to-subregion browsing");

  [
    "one geographic partition",
    "one and only one leaf",
    "57,936 DAs",
    "57,932 DAs",
    "Selecting a larger region",
    "positive-area overlap",
    "canada-region-membership.csv",
    "Run bare `region`"
  ].forEach((phrase) => check(standardText.includes(phrase), `standard is missing required rule: ${phrase}`));

  return {
    hierarchy: hierarchyTags.length,
    leaves: leaves.length,
    digitalDAs: dguids.size,
    partitionFeatures: partitionFeatures.length,
    digitalFeatures: digitalFeatures.length,
    meshMapperInputs: sourceFeatures.length,
    meshMapperCanonicalTags: mappedCanonical.size,
    searchGroups: Object.keys(data.searchGroups || {}).length,
    ambiguousAliases: ambiguousAliases.length,
    maxTags,
    maxResponseBytes,
    maxRegionDefChars
  };
}

const data = readJson(DATA_PATH);
const meshMapper = readJson(MESH_MAPPER_PATH);
const partition = readJson(PARTITION_PATH);
const digitalPartition = readJson(DIGITAL_PARTITION_PATH);
const qa = readJson(QA_PATH);
let scriptText = "";
let standardText = "";
try {
  scriptText = fs.readFileSync(SCRIPT_PATH, "utf8");
  standardText = fs.readFileSync(STANDARD_PATH, "utf8");
} catch (error) {
  failures.push(`required source could not be read: ${error.message}`);
}

const summary = data && meshMapper && partition && digitalPartition && qa
  ? validate(data, meshMapper, partition, digitalPartition, qa, scriptText, standardText)
  : null;

warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR: ${failure}`));
  console.error(`Region validation failed with ${failures.length} error(s).`);
  process.exit(1);
}
console.log(`Exclusive national partition validation passed: ${JSON.stringify(summary)}`);
