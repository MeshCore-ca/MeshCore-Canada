const ISSUE_ENDPOINT = "https://github.com/MeshCore-ca/MeshCore-Canada/issues/new";
const ISSUE_TEMPLATE = "region_boundary_proposal.yml";

// GitHub returns 414 for oversized issue-prefill URLs but does not publish a
// fixed limit. Signed-out users are redirected through a re-encoded return_to
// URL, so keep ample room for that second encoding step.
export const MAX_GITHUB_ISSUE_URL_LENGTH = 3000;

function displayTag(tag, labelForTag) {
  if (typeof labelForTag !== "function") return tag;
  const label = String(labelForTag(tag) || "").trim();
  return label && label !== tag ? `${label} (${tag})` : tag;
}

function transitionSummary(changes, labelForTag) {
  const transitions = new Set(changes.map((change) =>
    `${displayTag(change.from, labelForTag)} → ${displayTag(change.to, labelForTag)}`
  ));
  return [...transitions].sort().join("; ");
}

function issueTitle(changes, affectedRegions) {
  const count = changes.length;
  const suffix = `${count} ${count === 1 ? "cell" : "cells"}`;
  const candidate = transitionsAreSimple(changes)
    ? `[Region proposal] ${affectedRegions} · ${suffix}`
    : `[Region proposal] ${suffix} across multiple regions`;
  return candidate.length <= 180 ? candidate : `[Region proposal] ${suffix}`;
}

function transitionsAreSimple(changes) {
  return new Set(changes.map((change) => `${change.from}\0${change.to}`)).size === 1;
}

function buildUrl(params) {
  return `${ISSUE_ENDPOINT}?${new URLSearchParams(params).toString()}`;
}

/**
 * Build a GitHub issue-form URL for a proposal that has already passed the
 * browser validator. Large proposals fall back to metadata-only prefill; the
 * caller must download the returned JSON for manual attachment.
 */
export function buildRegionProposalIssue(proposal, options = {}) {
  const changes = Array.isArray(proposal && proposal.changes) ? proposal.changes : [];
  if (!changes.length) throw new Error("A validated proposal must contain changes.");

  const affectedRegions = transitionSummary(changes, options.labelForTag);
  const title = issueTitle(changes, affectedRegions);
  const proposalJson = `${JSON.stringify(proposal, null, 2)}\n`;
  const proposalMarkdown = `\`\`\`json\n${proposalJson}\`\`\`\n`;
  const common = {
    template: ISSUE_TEMPLATE,
    title,
    affected_regions: affectedRegions,
    change_count: String(changes.length),
    base_membership_sha256: String(proposal.baseMembershipSha256 || ""),
    reason: String(proposal.reason || "")
  };
  if (proposal.submittedBy) common.submitted_by = String(proposal.submittedBy);

  const completeUrl = buildUrl({ ...common, proposal: proposalMarkdown });
  const maximum = Number.isFinite(options.maxUrlLength)
    ? options.maxUrlLength
    : MAX_GITHUB_ISSUE_URL_LENGTH;
  if (completeUrl.length <= maximum) {
    return { url: completeUrl, requiresAttachment: false, proposalJson, title };
  }

  const fallback = {
    ...common,
    affected_regions: affectedRegions.length <= 500
      ? affectedRegions
      : "See the attached canonical proposal JSON."
  };
  let fallbackUrl = buildUrl(fallback);
  if (fallbackUrl.length > maximum) {
    fallbackUrl = buildUrl({
      template: ISSUE_TEMPLATE,
      title,
      affected_regions: "See the attached canonical proposal JSON.",
      change_count: String(changes.length),
      base_membership_sha256: String(proposal.baseMembershipSha256 || ""),
      reason: "See the attached canonical proposal JSON."
    });
  }
  return {
    url: fallbackUrl,
    requiresAttachment: true,
    proposalJson,
    title
  };
}
