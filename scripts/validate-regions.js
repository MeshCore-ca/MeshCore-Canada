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
const MUNICIPAL_OVERRIDES_PATH = path.join(ASSET_DIR, "municipal-overrides.json");
const RADIO_DENSITY_PATH = path.join(ASSET_DIR, "radio-density.json");
const SCRIPT_PATH = path.join(ASSET_DIR, "regions.js");
const STANDARD_PATH = path.join(ROOT, "docs", "config", "standard.md");

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

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  fields.push(field);
  check(!quoted, "membership contains an unterminated quoted field");
  return fields;
}

function checkExactKeys(value, allowed, context) {
  check(Boolean(value) && typeof value === "object" && !Array.isArray(value), `${context} must be an object`);
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const extras = Object.keys(value).filter((key) => !allowed.has(key)).sort();
  check(extras.length === 0, `${context} has unsupported fields: ${extras.join(", ")}`);
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

function newRegionParentJurisdiction(data, parent, leafSet) {
  if (!data.hierarchy[parent] || leafSet.has(parent)) return null;
  const parentChain = ancestryFor(data, parent);
  const jurisdiction = parentChain[1];
  if (
    parentChain[0] !== "can"
    || !Object.values(PR_TO_TAG).includes(jurisdiction)
  ) {
    return null;
  }
  return jurisdiction;
}

function canonicalLeafOrder(data, tags) {
  return unique(tags).sort((left, right) => {
    return ancestryFor(data, left).join("/").localeCompare(ancestryFor(data, right).join("/"));
  });
}

function profileTagsForLeaves(data, leaves) {
  return unique(canonicalLeafOrder(data, leaves).flatMap((tag) => ancestryFor(data, tag)));
}

function regionDefTokens(data, tags, parentOverrides = {}) {
  return tags.map((tag, index) => {
    if (index === tags.length - 1) return tag;
    const next = tags[index + 1];
    const nextParent = Object.prototype.hasOwnProperty.call(parentOverrides, next)
      ? parentOverrides[next]
      : data.hierarchy[next] && data.hierarchy[next].parent;
    return nextParent === tag ? tag : `${tag}|${nextParent || "*"}`;
  });
}

function validate(data, meshMapper, partition, digitalPartition, qa, municipalOverrides, radioDensity, scriptText, standardText) {
  check(data.authority && data.authority.standard === "MCC-REG-1", "catalog does not declare MCC-REG-1");
  check(data.authority && data.authority.version === "1.1-proposed", "catalog does not declare MCC-REG-1.1");
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
  const sharedRepeaterMembers = new Map();
  const sharedRepeaterProfiles = [];
  let sharedRepeaterAreaCount = 0;
  Object.entries(data.searchGroups || {}).forEach(([name, group]) => {
    checkExactKeys(group, new Set(["label", "members", "geographic", "emitInCommands", "repeaterConfig"]), `search group ${name}`);
    check(group.geographic === false, `search group ${name} must be explicitly non-geographic`);
    check(group.emitInCommands === false, `search group ${name} name must not enter commands`);
    check(Array.isArray(group.members) && group.members.length > 1, `search group ${name} needs at least two members`);
    (group.members || []).forEach((member) => check(leafSet.has(member), `search group ${name} references non-leaf ${member}`));
    check(new Set(group.members || []).size === (group.members || []).length, `search group ${name} has duplicate members`);

    const memberJurisdictions = unique((group.members || []).filter((member) => leafSet.has(member)).map((member) => ancestryFor(data, member)[1]));
    if (memberJurisdictions.length > 1) {
      check(Boolean(group.repeaterConfig), `cross-jurisdiction search group ${name} needs a shared repeater configuration`);
    }
    if (!group.repeaterConfig) return;

    sharedRepeaterAreaCount += 1;
    checkExactKeys(
      group.repeaterConfig,
      new Set(["mode", "defaultForMembers", "basis"]),
      `search group ${name} repeaterConfig`
    );
    check(group.repeaterConfig.mode === "shared-member-paths", `shared repeater area ${name} has an unsupported mode`);
    check(group.repeaterConfig.defaultForMembers === true, `shared repeater area ${name} must be the member default`);
    check(Boolean(String(group.repeaterConfig.basis || "").trim()), `shared repeater area ${name} needs a basis`);
    check(memberJurisdictions.length > 1, `shared repeater area ${name} must cross a province or territory`);
    const canonicalMembers = canonicalLeafOrder(data, group.members || []);
    check(JSON.stringify(group.members || []) === JSON.stringify(canonicalMembers), `shared repeater area ${name} members are not in canonical hierarchy order`);
    canonicalMembers.forEach((member) => {
      check(!sharedRepeaterMembers.has(member), `${member} belongs to more than one default shared repeater area`);
      sharedRepeaterMembers.set(member, name);
    });

    const profileTags = profileTagsForLeaves(data, canonicalMembers);
    const responseBytes = Buffer.byteLength(profileTags.join(","), "utf8") + 1;
    const defLine = `region def ${regionDefTokens(data, profileTags).join(" ")}`;
    check(profileTags.length <= MAX_PROFILE_TAGS, `shared repeater area ${name} exceeds ${MAX_PROFILE_TAGS} tags`);
    check(responseBytes <= MAX_RESPONSE_BYTES, `shared repeater area ${name} exceeds ${MAX_RESPONSE_BYTES} response bytes`);
    check(defLine.length <= MAX_REGION_DEF_CHARS, `shared repeater area ${name} exceeds the ${MAX_REGION_DEF_CHARS}-character region def limit`);
    check(!profileTags.includes(name), `shared repeater area ${name} incorrectly emits its group name`);
    sharedRepeaterProfiles.push({
      name,
      tags: profileTags.length,
      responseBytes,
      defChars: defLine.length
    });
  });

  const expectedExternalPaths = {
    "western-new-york": ["us", "us-ny"],
    washington: ["west", "pnw", "wa"],
    oregon: ["west", "pnw", "or"],
    pennsylvania: ["us", "us-pa"],
    ohio: ["us", "us-oh"],
    california: ["west", "ca"]
  };
  const expectedDocumentedPaths = new Set(["western-new-york", "washington", "oregon"]);
  const externalEntries = Object.entries(data.externalRegionPaths || {});
  const externalParents = new Map();
  const externalLabels = new Map();
  const externalProfiles = [];
  check(
    JSON.stringify(externalEntries.map(([id]) => id).sort()) ===
      JSON.stringify(Object.keys(expectedExternalPaths).sort()),
    "neighbouring paths must match the current traffic-evidenced set"
  );
  externalEntries.forEach(([id, record]) => {
    checkExactKeys(
      record,
      new Set([
        "label", "country", "areaCode", "path", "tagLabels", "geographic",
        "automatic", "eligibility", "authority", "trafficEvidence"
      ]),
      `neighbouring path ${id}`
    );
    check(Boolean(String(record.label || "").trim()), `neighbouring path ${id} needs a label`);
    check(record.country === "us", `neighbouring path ${id} must identify country us`);
    check(/^[A-Z]{2}$/.test(String(record.areaCode || "")), `neighbouring path ${id} has an invalid area code`);
    check(record.geographic === false, `neighbouring path ${id} must be non-geographic`);
    check(record.automatic === false, `neighbouring path ${id} must never be automatic`);
    check(
      ["border-or-shared-water", "observed-further-route"].includes(record.eligibility),
      `neighbouring path ${id} has an invalid eligibility rule`
    );

    const externalPath = Array.isArray(record.path) ? record.path : [];
    check(
      JSON.stringify(externalPath) === JSON.stringify(expectedExternalPaths[id] || []),
      `neighbouring path ${id} does not match its reviewed hierarchy`
    );
    check(externalPath.length >= 2, `neighbouring path ${id} needs a complete path`);
    check(unique(externalPath).length === externalPath.length, `neighbouring path ${id} repeats a tag`);
    checkExactKeys(record.tagLabels, new Set(externalPath), `neighbouring path ${id} tagLabels`);
    externalPath.forEach((tag, index) => {
      check(TAG_RE.test(tag), `neighbouring path ${id} has invalid tag ${tag}`);
      check(Buffer.byteLength(tag, "utf8") <= MAX_TAG_BYTES, `neighbouring tag exceeds ${MAX_TAG_BYTES} bytes: ${tag}`);
      check(!Object.prototype.hasOwnProperty.call(data.hierarchy, tag), `neighbouring tag collides with Canadian hierarchy: ${tag}`);
      check(Boolean(String(record.tagLabels && record.tagLabels[tag] || "").trim()), `neighbouring path ${id} has no label for ${tag}`);
      const parent = index ? externalPath[index - 1] : null;
      if (externalParents.has(tag)) {
        check(externalParents.get(tag) === parent, `neighbouring tag ${tag} has conflicting parents`);
      } else {
        externalParents.set(tag, parent);
      }
      if (externalLabels.has(tag)) {
        check(externalLabels.get(tag) === record.tagLabels[tag], `neighbouring tag ${tag} has conflicting labels`);
      } else {
        externalLabels.set(tag, record.tagLabels[tag]);
      }
    });

    checkExactKeys(record.authority, new Set(["status", "source", "sourceUrl"]), `neighbouring path ${id} authority`);
    const expectedStatus = expectedDocumentedPaths.has(id) ? "documented" : "provisional";
    check(record.authority && record.authority.status === expectedStatus, `neighbouring path ${id} has the wrong review status`);
    check(Boolean(String(record.authority && record.authority.source || "").trim()), `neighbouring path ${id} needs an authority source`);
    check(/^https:\/\//.test(String(record.authority && record.authority.sourceUrl || "")), `neighbouring path ${id} needs an HTTPS authority URL`);

    checkExactKeys(
      record.trafficEvidence,
      new Set(["source", "snapshot", "method", "routePatterns", "observations"]),
      `neighbouring path ${id} trafficEvidence`
    );
    check(record.trafficEvidence && record.trafficEvidence.source === "https://dev.meshcore.ca/", `neighbouring path ${id} has the wrong traffic source`);
    check(/^\d{4}-\d{2}-\d{2}$/.test(String(record.trafficEvidence && record.trafficEvidence.snapshot || "")), `neighbouring path ${id} has an invalid snapshot date`);
    check(record.trafficEvidence && record.trafficEvidence.method === "mixed-canada-us-resolved-route", `neighbouring path ${id} has an invalid evidence method`);
    check(Number.isInteger(record.trafficEvidence && record.trafficEvidence.routePatterns) && record.trafficEvidence.routePatterns > 0, `neighbouring path ${id} needs positive route-pattern evidence`);
    check(Number.isInteger(record.trafficEvidence && record.trafficEvidence.observations) && record.trafficEvidence.observations > 0, `neighbouring path ${id} needs positive route observations`);

    const parentOverrides = Object.fromEntries(externalPath.map((tag) => [tag, externalParents.get(tag)]));
    const responseBytes = Buffer.byteLength(externalPath.join(","), "utf8") + 1;
    const defLine = `region def ${regionDefTokens(data, externalPath, parentOverrides).join(" ")}`;
    check(externalPath.length <= MAX_PROFILE_TAGS, `neighbouring path ${id} exceeds ${MAX_PROFILE_TAGS} tags`);
    check(responseBytes <= MAX_RESPONSE_BYTES, `neighbouring path ${id} exceeds ${MAX_RESPONSE_BYTES} response bytes`);
    check(defLine.length <= MAX_REGION_DEF_CHARS, `neighbouring path ${id} exceeds the ${MAX_REGION_DEF_CHARS}-character region def limit`);
    externalProfiles.push({ name: id, tags: externalPath.length, responseBytes, defChars: defLine.length });
  });

  const representativeCanadianLeaves = ["tor", "wat"];
  representativeCanadianLeaves.forEach((tag) => check(leafSet.has(tag), `missing representative Canadian leaf ${tag}`));
  const representativeExternal = data.externalRegionPaths && data.externalRegionPaths["western-new-york"];
  if (representativeCanadianLeaves.every((tag) => leafSet.has(tag)) && representativeExternal) {
    const localTags = profileTagsForLeaves(data, representativeCanadianLeaves);
    const tags = unique(localTags.concat(representativeExternal.path));
    const overrides = Object.fromEntries(representativeExternal.path.map((tag, index) => [
      tag,
      index ? representativeExternal.path[index - 1] : null
    ]));
    const command = `region def ${regionDefTokens(data, tags, overrides).join(" ")}`;
    check(
      command === "region def can on on-gtha gta tor|on on-ktw wat|* us us-ny",
      `representative Ontario-WNY command is wrong: ${command}`
    );
    externalProfiles.push({
      name: "ontario-wny-fixture",
      tags: tags.length,
      responseBytes: Buffer.byteLength(tags.join(","), "utf8") + 1,
      defChars: command.length
    });
  }

  if (leafSet.has("mvrd") && externalEntries.length) {
    const records = externalEntries.map(([, record]) => record).sort((left, right) => {
      return left.path.join("/").localeCompare(right.path.join("/"));
    });
    const tags = unique(profileTagsForLeaves(data, ["mvrd"]).concat(records.flatMap((record) => record.path)));
    const overrides = {};
    records.forEach((record) => record.path.forEach((tag, index) => {
      overrides[tag] = index ? record.path[index - 1] : null;
    }));
    const command = `region def ${regionDefTokens(data, tags, overrides).join(" ")}`;
    const responseBytes = Buffer.byteLength(tags.join(","), "utf8") + 1;
    check(tags.length <= MAX_PROFILE_TAGS, `all current neighbouring paths exceed ${MAX_PROFILE_TAGS} tags`);
    check(responseBytes <= MAX_RESPONSE_BYTES, `all current neighbouring paths exceed ${MAX_RESPONSE_BYTES} response bytes`);
    check(command.length <= MAX_REGION_DEF_CHARS, `all current neighbouring paths exceed the ${MAX_REGION_DEF_CHARS}-character region def limit`);
    externalProfiles.push({
      name: "all-neighbouring-paths-fixture",
      tags: tags.length,
      responseBytes,
      defChars: command.length
    });
  }

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
  const membershipHeader = [
    "DGUID", "DAUID", "PRUID", "ERUID", "CDUID", "CDNAME", "CSDUID", "CSDNAME", "CSDTYPE",
    "provisional_leaf_tag", "provisional_assignment", "leaf_tag", "assignment"
  ];
  check(membershipLines[0] === membershipHeader.join(","), "membership header is invalid");
  check(membershipLines.length === 57_937, `expected 57,936 membership rows, found ${membershipLines.length - 1}`);
  const dguids = new Set();
  const membershipTags = new Set();
  const membershipCounts = new Map();
  const membershipRows = [];
  const membershipByDguid = new Map();
  const censusSubdivisions = new Map();
  const censusDivisions = new Map();
  membershipLines.slice(1).forEach((line, index) => {
    const fields = parseCsvLine(line);
    check(fields.length === membershipHeader.length, `membership row ${index + 2} has ${fields.length} fields, expected ${membershipHeader.length}`);
    const [
      dguid, dauid, pruid, eruid, cduid, cdname, csduid, csdname, csdtype,
      provisionalLeafTag, provisionalAssignment, leafTag, assignment
    ] = fields;
    check(Boolean(
      dguid && dauid && pruid && eruid && cduid && cdname && csduid && csdname && csdtype
      && provisionalLeafTag && provisionalAssignment && leafTag && assignment
    ), `membership row ${index + 2} is incomplete`);
    check(/^2021S0512\d{8}$/.test(dguid || ""), `membership row ${index + 2} has invalid DGUID ${dguid}`);
    check(/^\d{8}$/.test(dauid || ""), `membership row ${index + 2} has invalid DAUID ${dauid}`);
    check(/^\d{2}$/.test(pruid || ""), `membership row ${index + 2} has invalid PRUID ${pruid}`);
    check(/^\d{4}$/.test(eruid || ""), `membership row ${index + 2} has invalid ERUID ${eruid}`);
    check(/^\d{4}$/.test(cduid || ""), `membership row ${index + 2} has invalid CDUID ${cduid}`);
    check(/^\d{7}$/.test(csduid || ""), `membership row ${index + 2} has invalid CSDUID ${csduid}`);
    check(!dguids.has(dguid), `duplicate membership DGUID ${dguid}`);
    dguids.add(dguid);
    const membershipRecord = {
      dguid, dauid, pruid, eruid, cduid, cdname, csduid, csdname, csdtype,
      provisionalLeafTag, provisionalAssignment, leafTag, assignment
    };
    membershipRows.push(membershipRecord);
    membershipByDguid.set(dguid, membershipRecord);
    membershipTags.add(leafTag);
    membershipCounts.set(leafTag, (membershipCounts.get(leafTag) || 0) + 1);
    check(leafSet.has(leafTag), `membership references non-leaf ${leafTag}`);
    check(leafSet.has(provisionalLeafTag), `membership provisional owner references non-leaf ${provisionalLeafTag}`);
    const chain = ancestryFor(data, leafTag);
    check(chain[1] === PR_TO_TAG[pruid], `${dguid} crosses jurisdiction: ${pruid} -> ${leafTag}`);
    const provisionalChain = ancestryFor(data, provisionalLeafTag);
    check(provisionalChain[1] === PR_TO_TAG[pruid], `${dguid} provisional owner crosses jurisdiction: ${pruid} -> ${provisionalLeafTag}`);

    const priorCsd = censusSubdivisions.get(csduid);
    if (priorCsd) {
      check(priorCsd.pruid === pruid, `CSD ${csduid} has inconsistent PRUID`);
      check(priorCsd.cduid === cduid, `CSD ${csduid} has inconsistent CDUID`);
      check(priorCsd.name === csdname, `CSD ${csduid} has inconsistent name`);
      check(priorCsd.type === csdtype, `CSD ${csduid} has inconsistent type`);
      priorCsd.owners.add(leafTag);
      priorCsd.members.set(dguid, leafTag);
    } else {
      censusSubdivisions.set(csduid, {
        pruid,
        cduid,
        name: csdname,
        type: csdtype,
        owners: new Set([leafTag]),
        members: new Map([[dguid, leafTag]])
      });
    }

    const priorCd = censusDivisions.get(cduid);
    if (priorCd) {
      check(priorCd.pruid === pruid, `CD ${cduid} has inconsistent PRUID`);
      check(priorCd.name === cdname, `CD ${cduid} has inconsistent name`);
      priorCd.owners.add(leafTag);
      priorCd.members.set(dguid, leafTag);
    } else {
      censusDivisions.set(cduid, {
        pruid,
        name: cdname,
        owners: new Set([leafTag]),
        members: new Map([[dguid, leafTag]])
      });
    }
  });
  check(dguids.size === 57_936, `expected 57,936 unique DGUIDs, found ${dguids.size}`);
  check(censusSubdivisions.size === 5_161, `expected 5,161 Census Subdivisions, found ${censusSubdivisions.size}`);
  check(censusDivisions.size === 293, `expected 293 Census Divisions, found ${censusDivisions.size}`);
  check(JSON.stringify([...membershipTags].sort()) === JSON.stringify(leaves), "membership must populate every leaf and no other tag");
  leaves.forEach((tag) => check((membershipCounts.get(tag) || 0) > 0, `leaf ${tag} owns no DAs`));

  check(municipalOverrides && municipalOverrides.schema === "mcc-census-overrides/v2", "municipal override schema is invalid");
  check(municipalOverrides && municipalOverrides.censusVintage === 2021, "municipal overrides must use the 2021 Census vintage");
  const newRegions = municipalOverrides && Array.isArray(municipalOverrides.newRegions)
    ? municipalOverrides.newRegions
    : [];
  check(municipalOverrides && Array.isArray(municipalOverrides.newRegions), "municipal newRegions must be an array");
  const approvedNewTags = new Set();
  newRegions.forEach((record, index) => {
    checkExactKeys(
      record,
      new Set([
        "tag", "label", "parent", "anchorDguid", "status", "decision", "evidence",
        "reviewedAt", "approvedBy", "sourceIssue"
      ]),
      `approved new region ${index}`
    );
    const tag = String(record.tag || "");
    const parent = String(record.parent || "");
    const anchorDguid = String(record.anchorDguid || "");
    const anchor = membershipByDguid.get(anchorDguid);
    const parentJurisdiction = newRegionParentJurisdiction(data, parent, leafSet);
    check(!approvedNewTags.has(tag), `duplicate approved new region ${tag}`);
    approvedNewTags.add(tag);
    check(record.status === "approved", `new region ${tag} is not approved`);
    check(leafSet.has(tag), `new region ${tag} is not a catalog leaf`);
    check(Boolean(parentJurisdiction), `new region ${tag} has an invalid jurisdiction parent`);
    check(Boolean(anchor), `new region ${tag} references unknown anchor ${anchorDguid}`);
    if (anchor) {
      check(anchor.leafTag === tag, `new region ${tag} does not own its approved anchor`);
      check(PR_TO_TAG[anchor.pruid] === parentJurisdiction, `new region ${tag} anchor crosses jurisdiction`);
    }
    check(data.hierarchy[tag] && data.hierarchy[tag].parent === parent, `new region ${tag} catalog parent is wrong`);
    check(data.hierarchy[tag] && data.hierarchy[tag].label === record.label, `new region ${tag} catalog label is wrong`);
    check(data.status[tag] && data.status[tag].sourceUrl === record.sourceIssue, `new region ${tag} has the wrong review source`);
    check(Array.isArray(data.aliases[tag]) && data.aliases[tag].includes(tag), `new region ${tag} has no canonical alias`);
    check(
      !membershipRows.some((row) => row.provisionalLeafTag === tag),
      `new region ${tag} must not alter the frozen provisional ownership basis`
    );
  });

  const cohortOverrides = municipalOverrides && Array.isArray(municipalOverrides.cohortOverrides)
    ? municipalOverrides.cohortOverrides
    : [];
  check(municipalOverrides && Array.isArray(municipalOverrides.cohortOverrides), "municipal cohortOverrides must be an array");
  cohortOverrides.forEach((record, index) => {
    const level = String(record.level || "").toUpperCase();
    const geographyId = String(record.id || "");
    const leafTag = String(record.leafTag || "");
    const geography = level === "CSD" ? censusSubdivisions.get(geographyId) : censusDivisions.get(geographyId);
    check(["CD", "CSD"].includes(level), `municipal cohort override ${index} has invalid level ${level}`);
    check(record.status === "approved", `municipal cohort override ${level} ${geographyId} is not approved`);
    check(Boolean(geography), `municipal cohort override references unknown ${level} ${geographyId}`);
    check(leafSet.has(leafTag), `municipal cohort override ${level} ${geographyId} references non-leaf ${leafTag}`);
    check(Boolean(record.decision), `municipal cohort override ${level} ${geographyId} has no decision record`);
    check(Array.isArray(record.evidence) && record.evidence.length > 0, `municipal cohort override ${level} ${geographyId} has no evidence`);
    if (geography && leafSet.has(leafTag)) {
      check(ancestryFor(data, leafTag)[1] === PR_TO_TAG[geography.pruid], `municipal cohort override ${level} ${geographyId} crosses jurisdiction`);
      check([...geography.owners].every((owner) => owner === leafTag), `municipal cohort override ${level} ${geographyId} is not reflected in membership`);
    }
  });

  const splitExceptions = municipalOverrides && Array.isArray(municipalOverrides.splitExceptions)
    ? municipalOverrides.splitExceptions
    : [];
  check(municipalOverrides && Array.isArray(municipalOverrides.splitExceptions), "municipal splitExceptions must be an array");
  const approvedSplits = new Map();
  splitExceptions.forEach((exception, index) => {
    const csduid = String(exception.csduid || "");
    check(exception.status === "approved", `CSD split exception ${csduid || index} is not approved`);
    check(Boolean(censusSubdivisions.get(csduid)), `CSD split exception references unknown CSD ${csduid}`);
    check(!approvedSplits.has(csduid), `duplicate CSD split exception ${csduid}`);
    check(Array.isArray(exception.members), `CSD split exception ${csduid} has no member list`);
    const members = new Map();
    (exception.members || []).forEach((member) => {
      const dguid = String(member.dguid || "");
      const leafTag = String(member.leafTag || "");
      check(!members.has(dguid), `CSD split exception ${csduid} duplicates DGUID ${dguid}`);
      check(leafSet.has(leafTag), `CSD split exception ${csduid} references non-leaf ${leafTag}`);
      members.set(dguid, leafTag);
    });
    approvedSplits.set(csduid, members);
  });

  let splitCsdCount = 0;
  censusSubdivisions.forEach((record, csduid) => {
    if (record.owners.size <= 1) return;
    splitCsdCount += 1;
    const approvedMembers = approvedSplits.get(csduid);
    check(Boolean(approvedMembers), `CSD ${csduid} has an unreviewed split across ${[...record.owners].sort().join(", ")}`);
    if (!approvedMembers) return;
    check(approvedMembers.size === record.members.size, `approved split ${csduid} does not enumerate every DGUID`);
    record.members.forEach((owner, dguid) => {
      check(approvedMembers.get(dguid) === owner, `approved split ${csduid} does not match membership for ${dguid}`);
    });
  });
  approvedSplits.forEach((members, csduid) => {
    const record = censusSubdivisions.get(csduid);
    check(Boolean(record && record.owners.size > 1), `approved split exception ${csduid} does not produce a split`);
    if (record) check(members.size === record.members.size, `approved split exception ${csduid} does not enumerate the full CSD`);
  });

  const cambridgeRows = membershipRows.filter((row) => row.csduid === "3530010");
  const waterlooCdRows = membershipRows.filter((row) => row.cduid === "3530");
  check(
    cohortOverrides.some((record) => String(record.level).toUpperCase() === "CD" && String(record.id) === "3530" && record.leafTag === "wat" && record.status === "approved"),
    "Waterloo CD fixture must be backed by an approved 3530 -> wat decision"
  );
  check(cambridgeRows.length === 189, `Cambridge CSD 3530010 must contain 189 DAs, found ${cambridgeRows.length}`);
  check(cambridgeRows.every((row) => row.leafTag === "wat"), "Cambridge CSD 3530010, including Hespeler, must be wholly owned by wat");
  check(cambridgeRows.every((row) => row.csdname === "Cambridge" && row.cduid === "3530"), "Cambridge CSD fixture has inconsistent census context");
  check(waterlooCdRows.length === 766, `Waterloo CD 3530 must contain 766 DAs, found ${waterlooCdRows.length}`);
  check(waterlooCdRows.every((row) => row.leafTag === "wat"), "Waterloo CD 3530 must be wholly owned by wat");
  check(waterlooCdRows.every((row) => row.cdname === "Waterloo"), "Waterloo CD fixture has inconsistent census context");
  check(waterlooCdRows.every((row) => row.assignment === `approved-cd-override:${row.csduid}`), "Waterloo CD fixture was not generated from its approved decision");

  const provisionalOwnershipPayload = "DGUID,provisional_leaf_tag\n" + membershipRows
    .slice()
    .sort((left, right) => left.dguid.localeCompare(right.dguid))
    .map((row) => `${row.dguid},${row.provisionalLeafTag}\n`)
    .join("");
  const provisionalOwnershipHash = crypto.createHash("sha256").update(provisionalOwnershipPayload).digest("hex");
  checkExactKeys(radioDensity, new Set([
    "schema", "snapshotUtc", "provisionalOwnershipSha256", "privacy", "sourceAudit", "clusters"
  ]), "radio-density");
  check(radioDensity && radioDensity.schema === "mcc-radio-density/v2", "radio-density schema is invalid");
  check(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(String(radioDensity && radioDensity.snapshotUtc || "")), "radio-density snapshotUtc is invalid");
  check(/^[a-f0-9]{64}$/.test(String(radioDensity && radioDensity.provisionalOwnershipSha256 || "")), "radio-density provisional ownership hash is invalid");
  check(radioDensity && radioDensity.provisionalOwnershipSha256 === provisionalOwnershipHash, "radio-density snapshot was built from a different provisional ownership basis");
  const radioPrivacy = radioDensity && radioDensity.privacy || {};
  checkExactKeys(radioPrivacy, new Set([
    "clusterMaximumDiameterKilometres", "decisionEvidenceUnit", "decisionRoles",
    "devNodeTimestampAvailable", "devOnlyUse", "kAnonymity", "liveFreshnessDays",
    "observedRoles", "publishedGeographicCountMinimum", "rawCoordinatesPersisted",
    "rawIdentifiersPersisted"
  ]), "radio-density privacy");
  check(radioPrivacy.kAnonymity === 5, "radio-density must enforce k-anonymity of five nodes");
  check(radioPrivacy.publishedGeographicCountMinimum === radioPrivacy.kAnonymity, "radio-density geographic aggregates must use the declared k-anonymity floor");
  check(radioPrivacy.rawCoordinatesPersisted === 0, "radio-density must persist zero raw coordinates");
  check(radioPrivacy.rawIdentifiersPersisted === 0, "radio-density must persist zero raw identifiers");
  check(Number(radioPrivacy.clusterMaximumDiameterKilometres) > 0 && Number(radioPrivacy.clusterMaximumDiameterKilometres) <= 30, "radio-density clusters must be no wider than 30 km");
  check(Number(radioPrivacy.liveFreshnessDays) > 0 && Number(radioPrivacy.liveFreshnessDays) <= 30, "radio-density live freshness window must be no more than 30 days");
  check(radioPrivacy.devNodeTimestampAvailable === false, "radio-density must record that dev nodes have no per-node timestamp");
  check(radioPrivacy.devOnlyUse === "advisory-density-only", "dev-only nodes must not be decision evidence");
  check(radioPrivacy.decisionEvidenceUnit === "cluster-census-subdivision-candidate", "radio-density decision evidence must be CSD-specific");
  check(
    JSON.stringify([...(radioPrivacy.decisionRoles || [])].sort()) === JSON.stringify(["repeater", "room", "sensor"]),
    "radio-density decision roles must be repeater, room, and sensor only"
  );
  check(
    JSON.stringify([...(radioPrivacy.observedRoles || [])].sort()) ===
      JSON.stringify(["companion", "repeater", "room", "sensor"]),
    "radio-density observation must account for every supported positioned node role"
  );
  const sourceAudit = radioDensity && radioDensity.sourceAudit || {};
  checkExactKeys(sourceAudit, new Set([
    "crossSourceCoordinateConflictsExcluded", "crossSourceRoleMismatches",
    "decisionEligibleFixedInfrastructureInsideCanada", "deduplicatedPositionedNodes", "dev",
    "devMatchedLive", "devOnlyInsideCanada", "devOnlyPositionedNodes", "devRejectedCoordinate",
    "devRejectedRole", "duplicateDevRecords", "duplicateLiveRecords", "fixedInfrastructureInsideCanada",
    "insideCanada", "live", "liveRejectedCoordinate", "liveRejectedRole", "liveRejectedStale",
    "suppressedCandidateAggregates", "suppressedGeographicClusters", "suppressedSmallClusters"
  ]), "radio-density sourceAudit");
  checkExactKeys(sourceAudit.live, new Set([
    "acceptedFreshPositionedRecords", "pages", "records", "responseSha256", "url"
  ]), "radio-density live audit");
  checkExactKeys(sourceAudit.dev, new Set([
    "acceptedPositionedRecords", "nodeTimestampAvailable", "pages", "records", "responseSha256", "url"
  ]), "radio-density dev audit");
  check(sourceAudit.live && sourceAudit.live.url === "https://live.meshcore.ca/api/nodes", "radio-density live source is not the canonical endpoint");
  check(sourceAudit.dev && sourceAudit.dev.url === "https://dev.meshcore.ca/api/v1/nodes", "radio-density dev source is not the canonical endpoint");
  check(/^[a-f0-9]{64}$/.test(String(sourceAudit.live && sourceAudit.live.responseSha256 || "")), "radio-density live response hash is invalid");
  check(/^[a-f0-9]{64}$/.test(String(sourceAudit.dev && sourceAudit.dev.responseSha256 || "")), "radio-density dev response hash is invalid");
  check(sourceAudit.dev && sourceAudit.dev.nodeTimestampAvailable === false, "radio-density dev audit must record unavailable node timestamps");
  check(Number(sourceAudit.devOnlyPositionedNodes) > 0, "radio-density must account for positioned dev-only nodes");
  check(Number(sourceAudit.decisionEligibleFixedInfrastructureInsideCanada) > 0, "radio-density has no live-fresh decision evidence");
  const radioClusters = radioDensity && Array.isArray(radioDensity.clusters) ? radioDensity.clusters : [];
  check(radioDensity && Array.isArray(radioDensity.clusters), "radio-density clusters must be an array");
  check(radioClusters.length > 0, "radio-density must contain at least one privacy-safe cluster");
  const radioClusterIds = new Set();
  radioClusters.forEach((cluster, index) => {
    checkExactKeys(cluster, new Set([
      "censusSubdivisions", "decisionNodeCount", "id", "nodeCount", "observedNodeCount"
    ]), `radio cluster ${index}`);
    const clusterId = String(cluster.id || "");
    const nodeCount = Number(cluster.nodeCount);
    check(/^radio-[a-f0-9]{12}$/.test(clusterId), `radio cluster ${index} has a non-anonymous ID`);
    check(!radioClusterIds.has(clusterId), `duplicate radio cluster ID ${clusterId}`);
    radioClusterIds.add(clusterId);
    check(Number.isInteger(nodeCount) && nodeCount >= radioPrivacy.kAnonymity, `radio cluster ${clusterId} is below k-anonymity`);
    check(cluster.observedNodeCount === nodeCount, `radio cluster ${clusterId} observed count differs from its published count`);
    check(!Object.prototype.hasOwnProperty.call(cluster, "candidateCounts"), `radio cluster ${clusterId} exposes non-CSD-specific candidate evidence`);
    check(Array.isArray(cluster.censusSubdivisions), `radio cluster ${clusterId} has no CSD aggregates`);
    let observedTotal = 0;
    let decisionTotal = 0;
    (cluster.censusSubdivisions || []).forEach((participation) => {
      checkExactKeys(participation, new Set([
        "decisionCandidateCounts", "decisionNodeCount", "id", "observedNodeCount"
      ]), `radio cluster ${clusterId} CSD participation`);
      const csduid = String(participation.id || "");
      const count = Number(participation.observedNodeCount);
      const csd = censusSubdivisions.get(csduid);
      check(Boolean(csd), `radio cluster ${clusterId} references unknown CSD ${csduid}`);
      check(Number.isInteger(count) && count >= radioPrivacy.kAnonymity, `radio cluster ${clusterId} exposes a CSD count below k-anonymity`);
      check(count <= nodeCount, `radio cluster ${clusterId} has a CSD count above nodeCount`);
      observedTotal += count;
      const candidateEntries = Object.entries(participation.decisionCandidateCounts || {});
      if (!candidateEntries.length) {
        check(!Object.prototype.hasOwnProperty.call(participation, "decisionNodeCount"), `radio cluster ${clusterId} has an empty decision total for ${csduid}`);
        return;
      }
      let candidateTotal = 0;
      candidateEntries.forEach(([tag, candidateCount]) => {
        check(leafSet.has(tag), `radio cluster ${clusterId} references non-leaf ${tag}`);
        check(Number.isInteger(candidateCount) && candidateCount >= radioPrivacy.kAnonymity, `radio cluster ${clusterId} exposes a candidate bucket below k-anonymity`);
        if (csd && leafSet.has(tag)) {
          check(ancestryFor(data, tag)[1] === PR_TO_TAG[csd.pruid], `radio cluster ${clusterId} candidate ${tag} crosses the CSD jurisdiction`);
        }
        candidateTotal += Number(candidateCount);
      });
      check(candidateTotal === Number(participation.decisionNodeCount), `radio cluster ${clusterId} decision counts do not equal the CSD total`);
      check(candidateTotal <= count, `radio cluster ${clusterId} decision count exceeds the observed CSD count`);
      decisionTotal += candidateTotal;
    });
    check(observedTotal === nodeCount, `radio cluster ${clusterId} CSD counts do not equal nodeCount`);
    if (decisionTotal) {
      check(decisionTotal === Number(cluster.decisionNodeCount), `radio cluster ${clusterId} decision totals are inconsistent`);
    } else {
      check(!Object.prototype.hasOwnProperty.call(cluster, "decisionNodeCount"), `radio cluster ${clusterId} has an empty decision total`);
    }
  });

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
  check(qa && qa.sourceCounts.censusDivisions === 293, "QA Census Division count is wrong");
  check(qa && qa.sourceCounts.censusSubdivisions === 5_161, "QA Census Subdivision count is wrong");
  check(qa && qa.sourceCounts.leafRegions === expectedLeaves, "QA leaf count is wrong");
  check(qa && qa.censusCoherence && qa.censusCoherence.officialCensusDivisions === 293, "QA census coherence CD count is wrong");
  check(qa && qa.censusCoherence && qa.censusCoherence.officialCensusSubdivisions === 5_161, "QA census coherence CSD count is wrong");
  check(qa && qa.censusCoherence && qa.censusCoherence.automaticSplitCsdCount === 0, "QA reports an automatic municipality split");
  check(qa && qa.censusCoherence && qa.censusCoherence.approvedSplitExceptions === splitCsdCount, "QA approved CSD split count differs from membership");
  check(qa && qa.radioDensity && qa.radioDensity.used === true, "QA does not record use of the radio-density snapshot");
  check(qa && qa.radioDensity && qa.radioDensity.schema === "mcc-radio-density/v2", "QA radio-density schema is wrong");
  check(qa && qa.radioDensity && qa.radioDensity.snapshotUtc === radioDensity.snapshotUtc, "QA radio-density snapshot differs from the locked evidence");
  check(qa && qa.radioDensity && qa.radioDensity.clusterCount === radioClusters.length, "QA radio-density cluster count is wrong");
  check(qa && qa.invariants.everyDigitalDaAssignedExactlyOnce === true, "QA does not prove total DA ownership");
  check(qa && qa.invariants.everyLeafOwnsAtLeastOneDa === true, "QA reports an empty leaf");
  check(qa && qa.invariants.crossJurisdictionAssignments === 0, "QA reports cross-jurisdiction assignments");
  check(qa && qa.invariants.automaticMunicipalitySplits === 0, "QA invariant reports an automatic municipality split");
  check(qa && qa.invariants.cambridgeCsdOwnedByWaterloo === true, "QA does not preserve Cambridge CSD in wat");
  check(qa && qa.invariants.waterlooCdOwnedByWaterloo === true, "QA does not preserve Waterloo CD in wat");
  check(qa && qa.invariants.positiveAreaOverlapPairs === 0, "QA reports positive-area overlaps");
  check(qa && qa.invariants.invalidLeafGeometries === 0, "QA reports invalid leaf geometry");
  check(qa && qa.invariants.displayGeometryVerified === true, "QA does not verify the simplified display geometry");
  check(qa && qa.invariants.displaySeedsResolvedExactlyOnce === expectedLeaves, "QA display seed routing count is wrong");
  check(qa && qa.artifactHashes.membershipSha256 === sha256(MEMBERSHIP_PATH), "membership hash differs from QA");
  check(qa && qa.artifactHashes.partitionSha256 === sha256(PARTITION_PATH), "partition hash differs from QA");
  check(qa && qa.artifactHashes.digitalPartitionSha256 === sha256(DIGITAL_PARTITION_PATH), "digital partition hash differs from QA");
  check(/^[a-f0-9]{64}$/.test(String(qa && qa.inputHashes && qa.inputHashes.municipalOverridesCanonicalSha256 || "")), "QA municipal override hash is missing");
  check(/^[a-f0-9]{64}$/.test(String(qa && qa.inputHashes && qa.inputHashes.radioDensityCanonicalSha256 || "")), "QA radio-density hash is missing");

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
  sharedRepeaterProfiles.forEach((profile) => {
    maxTags = Math.max(maxTags, profile.tags);
    maxResponseBytes = Math.max(maxResponseBytes, profile.responseBytes);
    maxRegionDefChars = Math.max(maxRegionDefChars, profile.defChars);
  });
  externalProfiles.forEach((profile) => {
    maxTags = Math.max(maxTags, profile.tags);
    maxResponseBytes = Math.max(maxResponseBytes, profile.responseBytes);
    maxRegionDefChars = Math.max(maxRegionDefChars, profile.defChars);
  });

  check(!scriptText.includes("region dump"), "obsolete 'region dump' command remains in regions.js");
  check(scriptText.includes('verificationCommands = ["region"]'), "guided verification must use bare region command");
  check(scriptText.includes('commands.concat(["region", "region save", "region"])'), "technical flow must verify before and after saving");
  check(scriptText.includes("Run <code>region</code> and confirm"), "guided flow must verify before saving");
  check(scriptText.includes("Too many regions selected"), "command generation must fail closed on firmware limits");
  check(
    scriptText.includes("if (regionDefLine.length <= 160)") &&
      scriptText.includes('lines.push(parent ? "region put " + tag + " " + parent : "region put " + tag)'),
    "command generation must fall back to bounded region put lines"
  );
  check(scriptText.includes("Provinces and territories may be mixed."), "wide-coverage UI does not support cross-province selection");
  check(scriptText.includes("Large or cross-border coverage"), "UI does not offer large and cross-border forwarding");
  check(scriptText.includes("Different repeaters can carry different paths to spread traffic."), "UI does not explain path distribution");
  check(scriptText.includes("Neighbouring network paths"), "UI does not expose traffic-evidenced U.S. paths");
  check(scriptText.includes("requestedExternalPaths"), "map does not restore neighbouring path selections");
  check(scriptText.includes("is-external"), "UI does not distinguish neighbouring tags");
  check(scriptText.includes("Shared repeater area"), "UI does not identify shared repeater configurations");
  check(scriptText.includes("shared-member-paths"), "UI does not load shared repeater area definitions");
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
    "Census Subdivision (CSD)",
    "all 189 DAs in Cambridge CSD `3530010`",
    "all 766 DAs in Waterloo CD `3530`",
    "Privacy-safe radio-density snapshot",
    "Boundary editor proposals",
    "positive-area overlap",
    "canada-region-membership.csv",
    "Run bare `region`",
    "Cross-province repeater areas",
    "Large and neighbouring network paths",
    "Large coverage does not require a mountain",
    "Do not put every available path on every repeater",
    "Western New York",
    "`west → pnw → or`",
    "never draws U.S. geometry",
    "shared repeater area",
    "region def can on on-alg ott|can qc gatout",
    "32 tags",
    "172 response bytes",
    "No generated CLI line may exceed 160 characters"
  ].forEach((phrase) => check(standardText.includes(phrase), `standard is missing required rule: ${phrase}`));

  return {
    hierarchy: hierarchyTags.length,
    leaves: leaves.length,
    digitalDAs: dguids.size,
    censusDivisions: censusDivisions.size,
    censusSubdivisions: censusSubdivisions.size,
    approvedCsdSplits: splitCsdCount,
    radioClusters: radioClusters.length,
    partitionFeatures: partitionFeatures.length,
    digitalFeatures: digitalFeatures.length,
    meshMapperInputs: sourceFeatures.length,
    meshMapperCanonicalTags: mappedCanonical.size,
    searchGroups: Object.keys(data.searchGroups || {}).length,
    sharedRepeaterAreas: sharedRepeaterAreaCount,
    externalRegionPaths: externalEntries.length,
    ambiguousAliases: ambiguousAliases.length,
    maxTags,
    maxResponseBytes,
    maxRegionDefChars
  };
}

function main() {
  const data = readJson(DATA_PATH);
  const meshMapper = readJson(MESH_MAPPER_PATH);
  const partition = readJson(PARTITION_PATH);
  const digitalPartition = readJson(DIGITAL_PARTITION_PATH);
  const qa = readJson(QA_PATH);
  const municipalOverrides = readJson(MUNICIPAL_OVERRIDES_PATH);
  const radioDensity = readJson(RADIO_DENSITY_PATH);
  let scriptText = "";
  let standardText = "";
  try {
    scriptText = fs.readFileSync(SCRIPT_PATH, "utf8");
    standardText = fs.readFileSync(STANDARD_PATH, "utf8");
  } catch (error) {
    failures.push(`required source could not be read: ${error.message}`);
  }

  const summary = data && meshMapper && partition && digitalPartition && qa && municipalOverrides && radioDensity
    ? validate(data, meshMapper, partition, digitalPartition, qa, municipalOverrides, radioDensity, scriptText, standardText)
    : null;

  warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
  if (failures.length) {
    failures.forEach((failure) => console.error(`ERROR: ${failure}`));
    console.error(`Region validation failed with ${failures.length} error(s).`);
    process.exit(1);
  }
  console.log(`Exclusive national partition validation passed: ${JSON.stringify(summary)}`);
}

if (require.main === module) main();

module.exports = { ancestryFor, newRegionParentJurisdiction };
