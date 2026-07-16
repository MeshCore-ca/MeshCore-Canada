import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULT_SUBMISSION_ENDPOINT } from "../../docs/config/editor/issue.js";
import {
  COMMUNITY_IDEA_SCHEMA,
  COMMUNITY_SUBMISSION_ENDPOINT,
  buildCommunityIdea,
  buildManualGithubLink,
  buildSubmissionText
} from "../../docs/javascripts/community-submission.js";

const validData = {
  category: "Documentation correction",
  experience: "Active mesh user",
  summary: "  Make the setup note clearer  ",
  region: "  Waterloo Region, Ontario  ",
  need: "The first line is unclear.\r\nThe second line has the detail.",
  idea: "Add a short example.",
  context: "",
  followUp: "  @meshfriend  ",
  publicAcknowledged: true
};

test("community ideas use the same anonymous endpoint as boundary edits", () => {
  assert.equal(COMMUNITY_SUBMISSION_ENDPOINT, DEFAULT_SUBMISSION_ENDPOINT);
  assert.equal(
    COMMUNITY_SUBMISSION_ENDPOINT,
    "https://api.meshcore.ca:21323/api/meshcore-canada/submissions"
  );
});

test("builds the exact canonical community idea contract", () => {
  assert.deepEqual(buildCommunityIdea(validData), {
    schema: COMMUNITY_IDEA_SCHEMA,
    category: "Documentation correction",
    experience: "Active mesh user",
    summary: "Make the setup note clearer",
    need: "The first line is unclear.\nThe second line has the detail.",
    idea: "Add a short example.",
    publicAcknowledged: true,
    region: "Waterloo Region, Ontario",
    followUp: "@meshfriend"
  });
});

test("validates consent, enums, controls, and Unicode before submission", () => {
  assert.throws(
    () => buildCommunityIdea({ ...validData, publicAcknowledged: false }),
    /submission can be public/
  );
  assert.throws(
    () => buildCommunityIdea({ ...validData, category: "Made up" }),
    /valid contribution type/
  );
  assert.throws(
    () => buildCommunityIdea({ ...validData, summary: "bad\u0000text" }),
    /invalid text/
  );
  assert.throws(
    () => buildCommunityIdea({ ...validData, summary: "bad\ud800text" }),
    /invalid text/
  );
  assert.doesNotThrow(
    () => buildCommunityIdea({ ...validData, summary: "A useful radio idea 📻" })
  );
});

test("keeps preview and bounded manual GitHub fallbacks", () => {
  const proposal = buildCommunityIdea(validData);
  const preview = buildSubmissionText(proposal);
  assert.match(preview, /^# Make the setup note clearer/m);
  assert.match(preview, /## Public follow-up contact\n\n@meshfriend/);
  assert.equal(buildManualGithubLink(proposal).fullyPrefilled, true);

  const long = buildCommunityIdea({
    ...validData,
    need: "%".repeat(2000),
    idea: "%".repeat(2000),
    context: "%".repeat(2000)
  });
  const fallback = buildManualGithubLink(long);
  assert.equal(fallback.fullyPrefilled, false);
  assert.match(fallback.url, /template=community_idea\.yml/);
  assert.doesNotMatch(fallback.url, /need=/);
});

test("page exposes anonymous submission, anti-spam, result, and manual fallback controls", async () => {
  const [html, controller] = await Promise.all([
    readFile(new URL("../../docs/submit-idea.md", import.meta.url), "utf8"),
    readFile(new URL("../../docs/javascripts/submission-form.js", import.meta.url), "utf8")
  ]);
  for (const id of [
    "submit-community-idea",
    "submission-turnstile",
    "submission-anti-spam-status",
    "submission-anti-spam-retry",
    "submission-result",
    "submission-website",
    "open-github-submission",
    "copy-submission"
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing ${id}`);
  }
  assert.match(html, /No GitHub account is needed/);
  assert.match(controller, /import\(transportModuleUrl\)/);
  assert.match(controller, /submitSubmission\(/);
  assert.match(controller, /COMMUNITY_SUBMISSION_ENDPOINT/);
  assert.match(controller, /elements\.result\.replaceChildren/);
});
