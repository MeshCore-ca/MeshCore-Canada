export const PROPOSAL_TYPE_BOUNDARY = "boundary";
export const PROPOSAL_TYPE_NEW_REGION = "new-region";

export const PROPOSAL_SCHEMA_V1 = "mcc-region-editor-proposal/v1";
export const PROPOSAL_SCHEMA_V2 = "mcc-region-editor-proposal/v2";

export function schemaForProposalType(type) {
  if (type === PROPOSAL_TYPE_BOUNDARY) return PROPOSAL_SCHEMA_V1;
  if (type === PROPOSAL_TYPE_NEW_REGION) return PROPOSAL_SCHEMA_V2;
  return "";
}

export function proposalTypeForSchema(schema) {
  if (schema === PROPOSAL_SCHEMA_V1) return PROPOSAL_TYPE_BOUNDARY;
  if (schema === PROPOSAL_SCHEMA_V2) return PROPOSAL_TYPE_NEW_REGION;
  return "";
}

export function buildEditorProposal(options) {
  const proposal = {
    schema: options.schema,
    baseMembershipSha256: options.baseMembershipSha256,
    changes: options.changes
  };
  if (options.schema === PROPOSAL_SCHEMA_V2) {
    proposal.newRegion = {
      tag: options.newRegion.tag,
      label: options.newRegion.label,
      parent: options.newRegion.parent,
      anchorDguid: options.newRegion.anchorDguid
    };
  }
  const submittedBy = String(options.submittedBy || "").trim();
  if (submittedBy) proposal.submittedBy = submittedBy;
  proposal.reason = String(options.reason || "").trim();
  return proposal;
}

export function isEditableTarget(target) {
  if (!target || typeof target !== "object") return false;
  if (target.isContentEditable === true) return true;
  const tagName = String(target.tagName || "").toLowerCase();
  if (["input", "textarea", "select", "option"].includes(tagName)) return true;
  if (typeof target.closest === "function") {
    return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
  }
  return false;
}

export function hierarchyPath(options) {
  const values = ["Canada", options.jurisdictionLabel];
  const parentLabels = Array.isArray(options.parentLabels) ? options.parentLabels : [];
  parentLabels.forEach((label) => {
    if (label && !values.includes(label)) values.push(label);
  });
  if (options.leafLabel && !values.includes(options.leafLabel)) values.push(options.leafLabel);
  return values.filter(Boolean);
}
