// Browser port of region editor export validation; scripts/validate-region-proposal.py
// is the authoritative maintainer-side check.
//
// This module has no Node-only or browser-only dependencies: it uses only
// standard JS (RegExp, Map, Set, JSON) so it can run unmodified in a
// <script type="module"> in the static editor page and under `node --test`.

const PROPOSAL_SCHEMA = "mcc-region-editor-proposal/v1";
const ALLOWED_TOP_LEVEL_KEYS = new Set([
  "schema",
  "baseMembershipSha256",
  "submittedBy",
  "reason",
  "changes",
]);
const MAX_PROPOSAL_CHANGES = 25000;
const DGUID_RE = /^[A-Za-z0-9-]{8,64}$/;
const TAG_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  // Python's str.strip()/str.split() treat U+001C-U+001F (FS/GS/RS/US) and
  // U+0085 (NEL) as whitespace, but JS \s does not. Collapse them alongside \s (then trim, so
  // leading/trailing runs are removed like Python strip()) BEFORE the
  // control-character scan, matching the server's _clean_text semantics.
  const cleaned = value.replace(/[\s\x1c-\x1f\u0085]+/g, " ").trim();
  if (cleaned.length > maxLength) return "";
  for (const ch of cleaned) {
    const codePoint = ch.codePointAt(0);
    if (codePoint < 32 || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return "";
  }
  return cleaned;
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function err(code, message) {
  return { ok: false, errors: [{ code, message }], canonical: null };
}

/**
 * Validate an incoming region-boundary proposal against the current
 * membership context, mirroring the server's export_proposal rules 1-10.
 *
 * @param {unknown} proposal
 * @param {{
 *   baseMembershipSha256: string,
 *   membership: Map<string, {leaf_tag: string, PRUID: string}>,
 *   leafTags: Set<string>,
 *   leafProvinces: Map<string, Set<string>>,
 *   seedTags: Map<string, string>,
 * }} context
 * @returns {{ok: boolean, errors: Array<{code: string, message: string}>, canonical: object|null}}
 */
export function validateProposal(proposal, context) {
  // Rule 1: schema + allowed top-level keys.
  if (!isPlainObject(proposal) || proposal.schema !== PROPOSAL_SCHEMA) {
    return err("bad-schema", "The proposal format is not supported.");
  }
  for (const key of Object.keys(proposal)) {
    if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
      return err("unsupported-field", "The proposal contains unsupported fields.");
    }
  }

  // Rule 2: base membership hash must match.
  if (
    typeof proposal.baseMembershipSha256 !== "string" ||
    proposal.baseMembershipSha256 !== context.baseMembershipSha256
  ) {
    return err("stale-base", "The map changed after this edit began. Reload and try again.");
  }

  // Rule 3: changes array bounds.
  const rawChanges = proposal.changes;
  if (!Array.isArray(rawChanges) || rawChanges.length === 0) {
    return err("no-changes", "Choose at least one cell before exporting.");
  }
  if (rawChanges.length > MAX_PROPOSAL_CHANGES) {
    return err("too-many-changes", "Choose fewer cells before exporting.");
  }

  // Rule 4: each change is a well-formed {DGUID, from, to} with no duplicates.
  const requested = new Map();
  for (const change of rawChanges) {
    if (!isPlainObject(change) || Object.keys(change).length !== 3) {
      return err("bad-change", "The proposal contains an invalid change.");
    }
    const { DGUID, from, to } = change;
    if (
      !("DGUID" in change) ||
      !("from" in change) ||
      !("to" in change) ||
      typeof DGUID !== "string" ||
      !DGUID_RE.test(DGUID) ||
      typeof from !== "string" ||
      !TAG_RE.test(from) ||
      typeof to !== "string" ||
      !TAG_RE.test(to)
    ) {
      return err("bad-change", "The proposal contains an invalid change.");
    }
    if (requested.has(DGUID)) {
      return err("duplicate-dguid", "The proposal contains a duplicate cell.");
    }
    requested.set(DGUID, { DGUID, from, to });
  }

  const sortedDguids = [...requested.keys()].sort();

  // Rule 5: every DGUID must exist in membership, and from must match it.
  for (const dguid of sortedDguids) {
    const row = context.membership.get(dguid);
    if (!row) {
      return err("unknown-dguid", "One or more cells no longer exist. Reload and try again.");
    }
    if (requested.get(dguid).from !== row.leaf_tag) {
      return err("from-mismatch", "The map changed after this edit began. Reload and try again.");
    }
  }

  // Rule 6: all changed rows must share a single province.
  const provinces = new Set(sortedDguids.map((dguid) => context.membership.get(dguid).PRUID));
  if (provinces.size !== 1) {
    return err("multi-province", "A proposal may change cells in only one province or territory.");
  }
  const [pruid] = provinces;

  // Rule 7: target must be a leaf tag belonging exclusively to that province.
  for (const dguid of sortedDguids) {
    const target = requested.get(dguid).to;
    const targetProvinces = context.leafProvinces.get(target);
    const isSoleProvince = !!targetProvinces && targetProvinces.size === 1 && targetProvinces.has(pruid);
    if (!context.leafTags.has(target) || !isSoleProvince) {
      return err("bad-target", "A target region must belong to the same province or territory.");
    }
  }

  // Rule 8: a region anchor cell cannot be moved away from its region.
  for (const dguid of sortedDguids) {
    const seed = context.seedTags.get(dguid);
    if (seed && seed !== requested.get(dguid).to) {
      return err("anchor-moved", "A region anchor cell cannot be moved away from its region.");
    }
  }

  // Rule 9: a change must actually change something.
  for (const dguid of sortedDguids) {
    const request = requested.get(dguid);
    if (request.to === request.from) {
      return err("no-op", "The proposal contains a change that has no effect.");
    }
  }

  // Assemble canonical changes, sorted by DGUID, with `from` re-derived from
  // membership rather than trusted from the caller's input.
  const canonicalChanges = sortedDguids.map((dguid) => ({
    DGUID: dguid,
    from: context.membership.get(dguid).leaf_tag,
    to: requested.get(dguid).to,
  }));

  // Rule 10: submittedBy (optional) and reason (required), both cleaned.
  const submittedByRaw = proposal.submittedBy;
  const submittedBy = cleanText(submittedByRaw, 80);
  if (submittedByRaw && !submittedBy) {
    return err("bad-submitted-by", "The submitted-by value is invalid.");
  }
  const reason = cleanText(proposal.reason, 1000);
  if (!reason) {
    return err("bad-reason", "Add a short reason for this boundary change.");
  }

  const canonical = {
    schema: PROPOSAL_SCHEMA,
    baseMembershipSha256: context.baseMembershipSha256,
  };
  if (submittedBy) canonical.submittedBy = submittedBy;
  canonical.reason = reason;
  canonical.changes = canonicalChanges;

  return { ok: true, errors: [], canonical };
}
