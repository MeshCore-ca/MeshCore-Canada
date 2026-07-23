import {
  PROPOSAL_SCHEMA_V1,
  PROPOSAL_SCHEMA_V2
} from "../domain/proposal-types.js?v=20260722-2";

const DRAFT_PREFIX = "mcc-region-editor-draft";
const DRAFT_VERSION = 1;
const HASH_RE = /^[0-9a-f]{64}$/;
const PROVINCE_RE = /^[0-9]{2}$/;
const DGUID_RE = /^[A-Za-z0-9-]{8,64}$/;

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function cleanChanges(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((change) => {
    if (
      !change ||
      typeof change !== "object" ||
      !DGUID_RE.test(String(change.DGUID || "")) ||
      typeof change.to !== "string" ||
      change.to.length > 29 ||
      seen.has(change.DGUID)
    ) {
      return [];
    }
    seen.add(change.DGUID);
    return [{ DGUID: String(change.DGUID), to: String(change.to) }];
  });
}

export function draftKey(schema, authorityHash, province) {
  if (
    ![PROPOSAL_SCHEMA_V1, PROPOSAL_SCHEMA_V2].includes(schema) ||
    !HASH_RE.test(String(authorityHash || "")) ||
    !PROVINCE_RE.test(String(province || ""))
  ) {
    return "";
  }
  return [DRAFT_PREFIX, schema.endsWith("/v2") ? "v2" : "v1", authorityHash, province].join(":");
}

export function serializableDraft(value) {
  const schema = value && value.schema;
  const baseMembershipSha256 = String(value && value.baseMembershipSha256 || "").toLowerCase();
  const province = String(value && value.province || "");
  if (!draftKey(schema, baseMembershipSha256, province)) return null;
  const draft = {
    version: DRAFT_VERSION,
    schema,
    baseMembershipSha256,
    province,
    target: cleanText(value.target, 29),
    reason: cleanText(value.reason, 1000),
    changes: cleanChanges(value.changes),
    savedAt: Number.isFinite(value.savedAt) ? value.savedAt : Date.now()
  };
  if (schema === PROPOSAL_SCHEMA_V2) {
    draft.newRegion = {
      label: cleanText(value.newRegion && value.newRegion.label, 80),
      tag: cleanText(value.newRegion && value.newRegion.tag, 29),
      anchorDguid: DGUID_RE.test(String(value.newRegion && value.newRegion.anchorDguid || ""))
        ? String(value.newRegion.anchorDguid)
        : ""
    };
  }
  return draft;
}

export function saveDraft(storage, value) {
  const draft = serializableDraft(value);
  if (!storage || !draft) return { ok: false, key: "", draft: null };
  const key = draftKey(draft.schema, draft.baseMembershipSha256, draft.province);
  try {
    storage.setItem(key, JSON.stringify(draft));
    return { ok: true, key, draft };
  } catch (_error) {
    return { ok: false, key, draft };
  }
}

export function loadDraft(storage, schema, authorityHash, province) {
  const key = draftKey(schema, authorityHash, province);
  if (!storage || !key) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const draft = serializableDraft(JSON.parse(raw));
    if (
      !draft ||
      draft.schema !== schema ||
      draft.baseMembershipSha256 !== authorityHash ||
      draft.province !== province
    ) {
      return null;
    }
    return draft;
  } catch (_error) {
    return null;
  }
}

export function removeDraft(storage, schema, authorityHash, province) {
  const key = draftKey(schema, authorityHash, province);
  if (!storage || !key) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (_error) {
    return false;
  }
}

export function hasStaleDraft(storage, schema, authorityHash, province) {
  if (!storage || !schema || !province) return false;
  const schemaPart = schema.endsWith("/v2") ? "v2" : "v1";
  const prefix = [DRAFT_PREFIX, schemaPart, ""].join(":");
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (
        typeof key === "string" &&
        key.startsWith(prefix) &&
        key.endsWith(`:${province}`) &&
        key !== draftKey(schema, authorityHash, province)
      ) {
        return true;
      }
    }
  } catch (_error) {
    return false;
  }
  return false;
}
