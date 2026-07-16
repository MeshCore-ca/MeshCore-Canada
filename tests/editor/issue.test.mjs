import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_SUBMISSION_ENDPOINT,
  MAX_SUBMISSION_BYTES,
  SUBMISSION_CONTRACT_VERSION,
  TURNSTILE_SCRIPT_URL,
  buildSubmissionRequest,
  canonicalProposalJson,
  canonicalSubmissionJson,
  configuredSubmissionEndpoint,
  fetchSubmissionConfig,
  loadTurnstile,
  proposalSha256,
  submissionSha256,
  renderTurnstile,
  submitRegionProposal,
  submitSubmission,
  validateSubmissionConfig,
  validateSubmissionResponse
} from "../../docs/config/editor/issue.js";

const canonicalProposal = {
  schema: "mcc-region-editor-proposal/v1",
  baseMembershipSha256: "a".repeat(64),
  submittedBy: "Local operator",
  reason: "These census cells belong with the neighbouring radio community.",
  changes: [
    { DGUID: "2021S05120001", from: "wat", to: "wel" }
  ]
};

const canonicalProposalHash = await submissionSha256(canonicalProposal);
const editorHtml = await readFile(
  new URL("../../docs/config/editor/index.html", import.meta.url),
  "utf8"
);

const successBody = {
  ok: true,
  issueNumber: 123,
  issueUrl: "https://github.com/MeshCore-ca/MeshCore-Canada/issues/123",
  submissionSha256: canonicalProposalHash,
  duplicate: false
};

function jsonResponse(body, options = {}) {
  return {
    ok: options.ok !== false,
    status: options.status || 200,
    async json() { return body; }
  };
}

test("uses the shared anonymous submission API by default and allows a trusted page override", () => {
  const productionEndpoint = "https://api.meshcore.ca:21323/api/meshcore-canada/submissions";
  assert.equal(DEFAULT_SUBMISSION_ENDPOINT, productionEndpoint);
  assert.ok(editorHtml.includes(
    `name="meshcore-submission-endpoint" content="${productionEndpoint}"`
  ));
  assert.equal(configuredSubmissionEndpoint(null), DEFAULT_SUBMISSION_ENDPOINT);
  assert.equal(configuredSubmissionEndpoint({
    querySelector() { return { content: "https://proposals.example.ca/v1/" }; }
  }), "https://proposals.example.ca/v1");
  assert.throws(() => configuredSubmissionEndpoint({
    querySelector() { return { content: "http://proposals.example.ca/v1" }; }
  }), /must use HTTPS/);
});

test("fetches and validates the versioned public Turnstile config without credentials", async () => {
  let request;
  const config = await fetchSubmissionConfig({
    endpoint: "https://proposals.example.ca/v1",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse({
        version: 1,
        turnstileSiteKey: "0x4AAAA-public-site-key",
        turnstileAction: "meshcore_submission"
      });
    }
  });

  assert.deepEqual(config, {
    version: SUBMISSION_CONTRACT_VERSION,
    endpoint: "https://proposals.example.ca/v1",
    turnstileSiteKey: "0x4AAAA-public-site-key",
    turnstileAction: "meshcore_submission"
  });
  assert.equal(request.url, "https://proposals.example.ca/v1/config");
  const { signal, ...requestOptions } = request.options;
  assert.equal(signal.aborted, false);
  assert.deepEqual(requestOptions, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "omit",
    mode: "cors",
    referrerPolicy: "no-referrer"
  });
});

test("rejects malformed or mismatched public config", () => {
  assert.throws(() => validateSubmissionConfig({
    version: 2,
    turnstileSiteKey: "site-key",
    turnstileAction: "meshcore_submission"
  }), /invalid public configuration/);
  assert.throws(() => validateSubmissionConfig({
    version: 1,
    turnstileSiteKey: "site-key",
    turnstileAction: "contains spaces"
  }), /invalid public configuration/);
});

test("builds the exact generic submission wrapper including the honeypot", () => {
  assert.deepEqual(buildSubmissionRequest(canonicalProposal, "turnstile-token", ""), {
    version: 1,
    submission: canonicalProposal,
    turnstileToken: "turnstile-token",
    website: ""
  });
  assert.throws(
    () => buildSubmissionRequest(canonicalProposal, "", ""),
    /Complete the anti-spam check/
  );
  assert.throws(
    () => buildSubmissionRequest(canonicalProposal, "x".repeat(2049), ""),
    /Complete the anti-spam check/
  );
  assert.throws(
    () => buildSubmissionRequest(canonicalProposal, "turnstile-token", "x".repeat(201)),
    /could not be sent/
  );
});

test("posts a canonical submission without cookies and accepts a safe issue response", async () => {
  let request;
  const result = await submitSubmission({
    endpoint: "https://proposals.example.ca/v1",
    submission: canonicalProposal,
    turnstileToken: "turnstile-token",
    website: "",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse(successBody, { status: 201 });
    }
  });

  assert.deepEqual(result, successBody);
  assert.equal(request.url, "https://proposals.example.ca/v1");
  const { signal, ...requestOptions } = request.options;
  assert.equal(signal.aborted, false);
  assert.deepEqual(requestOptions, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    credentials: "omit",
    mode: "cors",
    referrerPolicy: "no-referrer",
    body: JSON.stringify({
      version: 1,
      submission: canonicalProposal,
      turnstileToken: "turnstile-token",
      website: ""
    })
  });
});


test("keeps the region proposal compatibility alias on the generic envelope", async () => {
  let requestBody;
  const result = await submitRegionProposal({
    proposal: canonicalProposal,
    turnstileToken: "turnstile-token",
    fetchImpl: async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return jsonResponse(successBody);
    }
  });

  assert.deepEqual(result, successBody);
  assert.deepEqual(requestBody, {
    version: 1,
    submission: canonicalProposal,
    turnstileToken: "turnstile-token",
    website: ""
  });
});
test("canonical hash is stable across object key order", async () => {
  const reordered = {
    changes: canonicalProposal.changes,
    reason: canonicalProposal.reason,
    submittedBy: canonicalProposal.submittedBy,
    baseMembershipSha256: canonicalProposal.baseMembershipSha256,
    schema: canonicalProposal.schema
  };
  assert.equal(canonicalSubmissionJson(reordered), canonicalSubmissionJson(canonicalProposal));
  assert.equal(await submissionSha256(reordered), canonicalProposalHash);
  assert.equal(canonicalProposalJson(reordered), canonicalSubmissionJson(reordered));
  assert.equal(await proposalSha256(reordered), canonicalProposalHash);
});

test("only accepts the exact public MeshCore Canada issue URL and submitted hash", () => {
  assert.deepEqual(validateSubmissionResponse(successBody, canonicalProposalHash), successBody);
  assert.throws(() => validateSubmissionResponse({
    ...successBody,
    issueUrl: "https://example.net/MeshCore-ca/MeshCore-Canada/issues/123"
  }, canonicalProposalHash), /review link was invalid/);
  assert.throws(() => validateSubmissionResponse({
    ...successBody,
    issueUrl: "https://github.com/MeshCore-ca/MeshCore-Canada/issues/124"
  }, canonicalProposalHash), /review link was invalid/);
  assert.throws(() => validateSubmissionResponse({
    ...successBody,
    issueUrl: "https://github.com/MeshCore-ca/MeshCore-Canada/issues/123?redirect=evil"
  }, canonicalProposalHash), /review link was invalid/);
  assert.throws(() => validateSubmissionResponse(successBody, "c".repeat(64)), /review link was invalid/);
});

test("surfaces a bounded public API error while leaving retry to the caller", async () => {
  await assert.rejects(
    submitSubmission({
      submission: canonicalProposal,
      turnstileToken: "turnstile-token",
      fetchImpl: async () => jsonResponse({
        ok: false,
        error: {
          code: "rate-limited",
          message: `This untrusted server text must not be shown. ${"x".repeat(300)}`
        }
      }, { ok: false, status: 429 })
    }),
    (error) => {
      assert.equal(error.code, "rate_limited");
      assert.equal(error.status, 429);
      assert.equal(error.retryable, true);
      assert.equal(error.message, "Too many submissions were sent from this connection. Wait a few minutes and try again.");
      return true;
    }
  );
});

test("rejects an oversized submission before contacting the service", async () => {
  let contacted = false;
  await assert.rejects(submitSubmission({
    submission: { value: "x".repeat(MAX_SUBMISSION_BYTES) },
    turnstileToken: "turnstile-token",
    fetchImpl: async () => { contacted = true; return jsonResponse(successBody); }
  }), (error) => error.code === "payload_too_large" && error.retryable === false);
  assert.equal(contacted, false);
});

test("times out a stalled config request", async () => {
  await assert.rejects(fetchSubmissionConfig({
    timeoutMs: 5,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    })
  }), (error) => error.code === "request_timeout");
});

test("renders Turnstile explicitly without a hidden response field", () => {
  let receivedContainer;
  let receivedOptions;
  const callbacks = {
    onToken() {},
    onError() {},
    onExpired() {},
    onTimeout() {}
  };
  const widgetId = renderTurnstile({
    render(container, options) {
      receivedContainer = container;
      receivedOptions = options;
      return 42;
    }
  }, "#challenge", {
    turnstileSiteKey: "0x4AAAA-public-site-key",
    turnstileAction: "meshcore_submission"
  }, callbacks);

  assert.equal(widgetId, 42);
  assert.equal(receivedContainer, "#challenge");
  assert.deepEqual(receivedOptions, {
    sitekey: "0x4AAAA-public-site-key",
    action: "meshcore_submission",
    theme: "dark",
    appearance: "interaction-only",
    "response-field": false,
    callback: callbacks.onToken,
    "error-callback": callbacks.onError,
    "expired-callback": callbacks.onExpired,
    "timeout-callback": callbacks.onTimeout
  });
  assert.equal(
    TURNSTILE_SCRIPT_URL,
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  );
});

test("loads the official Turnstile script dynamically", async () => {
  const listeners = {};
  const script = {
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  let appended;
  const windowObject = {};
  const documentObject = {
    createElement(name) {
      assert.equal(name, "script");
      return script;
    },
    head: {
      appendChild(node) { appended = node; }
    }
  };

  const loading = loadTurnstile({ windowObject, documentObject });
  assert.equal(appended, script);
  assert.equal(script.src, TURNSTILE_SCRIPT_URL);
  assert.equal(script.async, true);
  assert.equal(script.defer, true);
  windowObject.turnstile = { render() {} };
  listeners.load();
  assert.equal(await loading, windowObject.turnstile);
});
