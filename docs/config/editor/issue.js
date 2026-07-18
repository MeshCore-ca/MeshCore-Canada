export const DEFAULT_SUBMISSION_ENDPOINT = "https://api.meshcore.ca:21323/api/meshcore-canada/submissions";
export const SUBMISSION_CONTRACT_VERSION = 1;
export const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
export const MAX_SUBMISSION_BYTES = 2 * 1024 * 1024;

const ISSUE_ORIGIN = "https://github.com";
const ISSUE_PATH_PREFIX = "/MeshCore-ca/MeshCore-Canada/issues/";
const CONFIG_TIMEOUT_MS = 15000;
const SUBMISSION_TIMEOUT_MS = 30000;

const PUBLIC_API_ERRORS = Object.freeze({
  invalid_request: "The submission request was not accepted.",
  invalid_submission: "The submission was not accepted.",
  invalid_proposal: "The proposal no longer matches the current region data.",
  stale_base: "The region map changed after this edit began. Reload the editor and try again.",
  payload_too_large: "This submission is too large to send at once. Save it and contact a maintainer.",
  turnstile_failed: "The anti-spam check was not accepted. Let it refresh and try again.",
  rate_limited: "Too many submissions were sent from this connection. Wait a few minutes and try again.",
  service_unavailable: "The submission service is temporarily unavailable. Try again shortly."
});

export class SubmissionError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "SubmissionError";
    this.code = options.code || "submission_failed";
    this.status = options.status || 0;
    this.retryable = options.retryable !== false;
  }
}

function cleanEndpoint(value) {
  const raw = String(value || DEFAULT_SUBMISSION_ENDPOINT).trim();
  let url;
  try {
    url = new URL(raw);
  } catch (_error) {
    throw new SubmissionError("The submission service address is invalid.", {
      code: "invalid_endpoint",
      retryable: false
    });
  }
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new SubmissionError("The submission service must use HTTPS.", {
      code: "invalid_endpoint",
      retryable: false
    });
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new SubmissionError("The submission service address is invalid.", {
      code: "invalid_endpoint",
      retryable: false
    });
  }
  return url.href.replace(/\/$/, "");
}

function timeoutMilliseconds(value, fallback) {
  const parsed = Number(value === undefined ? fallback : value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 120000 ? parsed : fallback;
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new SubmissionError(timeoutMessage, { code: "request_timeout" });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function sortJson(value) {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    const sorted = {};
    Object.keys(value).sort().forEach((key) => {
      sorted[key] = sortJson(value[key]);
    });
    return sorted;
  }
  return value;
}

export function canonicalSubmissionJson(submission) {
  const json = JSON.stringify(sortJson(submission));
  if (!json) {
    throw new SubmissionError("A validated submission is required.", {
      code: "invalid_submission",
      retryable: false
    });
  }
  return json;
}

export const canonicalProposalJson = canonicalSubmissionJson;

export async function submissionSha256(submission, cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl || !cryptoImpl.subtle || typeof TextEncoder !== "function") {
    throw new SubmissionError("This browser cannot verify the submitted data.", {
      code: "hash_unavailable",
      retryable: false
    });
  }
  const digest = await cryptoImpl.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonicalSubmissionJson(submission))
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const proposalSha256 = submissionSha256;

export function configuredSubmissionEndpoint(documentObject = globalThis.document) {
  const meta = documentObject && documentObject.querySelector(
    'meta[name="meshcore-submission-endpoint"]'
  );
  return cleanEndpoint(meta && meta.content ? meta.content : DEFAULT_SUBMISSION_ENDPOINT);
}

async function responseJson(response, message) {
  try {
    return await response.json();
  } catch (_error) {
    throw new SubmissionError(message, {
      code: "invalid_response",
      status: response.status
    });
  }
}

export function validateSubmissionConfig(value, endpoint = DEFAULT_SUBMISSION_ENDPOINT) {
  const siteKey = value && value.turnstileSiteKey;
  const action = value && value.turnstileAction;
  if (
    !value ||
    value.version !== SUBMISSION_CONTRACT_VERSION ||
    typeof siteKey !== "string" ||
    siteKey.length < 3 ||
    siteKey.length > 200 ||
    typeof action !== "string" ||
    !/^[A-Za-z0-9_-]{1,32}$/.test(action)
  ) {
    throw new SubmissionError("The submission service returned invalid public configuration.", {
      code: "invalid_config"
    });
  }
  return Object.freeze({
    version: SUBMISSION_CONTRACT_VERSION,
    endpoint: cleanEndpoint(endpoint),
    turnstileSiteKey: siteKey,
    turnstileAction: action
  });
}

export async function fetchSubmissionConfig(options = {}) {
  const endpoint = cleanEndpoint(options.endpoint || DEFAULT_SUBMISSION_ENDPOINT);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new SubmissionError("This browser cannot contact the submission service.", {
      code: "fetch_unavailable",
      retryable: false
    });
  }
  let response;
  try {
    response = await fetchWithTimeout(fetchImpl, `${endpoint}/config`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      mode: "cors",
      referrerPolicy: "no-referrer"
    }, timeoutMilliseconds(options.timeoutMs, CONFIG_TIMEOUT_MS),
    "The submission service took too long to respond. Try again shortly.");
  } catch (_error) {
    if (_error instanceof SubmissionError) throw _error;
    throw new SubmissionError("The submission service could not be reached. Try again shortly.", {
      code: "network_error"
    });
  }
  if (!response.ok) {
    throw new SubmissionError("Spam protection is temporarily unavailable. Try again shortly.", {
      code: "config_unavailable",
      status: response.status
    });
  }
  return validateSubmissionConfig(
    await responseJson(response, "The submission service returned an unreadable configuration."),
    endpoint
  );
}

export function buildSubmissionRequest(submission, turnstileToken, website = "") {
  if (!submission || typeof submission !== "object" || Array.isArray(submission)) {
    throw new SubmissionError("A validated submission is required.", {
      code: "invalid_submission",
      retryable: false
    });
  }
  const token = String(turnstileToken || "").trim();
  if (!token || token.length > 2048) {
    throw new SubmissionError("Complete the anti-spam check before submitting.", {
      code: "turnstile_required",
      retryable: true
    });
  }
  const honeypot = String(website || "");
  if (honeypot.length > 200) {
    throw new SubmissionError("The submission could not be sent.", {
      code: "invalid_request",
      retryable: false
    });
  }
  return {
    version: SUBMISSION_CONTRACT_VERSION,
    submission,
    turnstileToken: token,
    website: honeypot
  };
}

export function validateSubmissionResponse(value, expectedSubmissionSha256) {
  const issueNumber = value && value.issueNumber;
  const issueUrl = value && value.issueUrl;
  const responseSubmissionSha256 = value && value.submissionSha256;
  if (
    !value ||
    value.ok !== true ||
    !Number.isSafeInteger(issueNumber) ||
    issueNumber < 1 ||
    typeof issueUrl !== "string" ||
    typeof responseSubmissionSha256 !== "string" ||
    !/^[0-9a-f]{64}$/i.test(responseSubmissionSha256) ||
    typeof expectedSubmissionSha256 !== "string" ||
    responseSubmissionSha256.toLowerCase() !== expectedSubmissionSha256.toLowerCase() ||
    (value.duplicate !== undefined && typeof value.duplicate !== "boolean")
  ) {
    throw new SubmissionError("The submission was received, but the review link was invalid.", {
      code: "invalid_response"
    });
  }
  let url;
  try {
    url = new URL(issueUrl);
  } catch (_error) {
    throw new SubmissionError("The submission was received, but the review link was invalid.", {
      code: "invalid_response"
    });
  }
  if (
    url.origin !== ISSUE_ORIGIN ||
    url.pathname !== `${ISSUE_PATH_PREFIX}${issueNumber}` ||
    url.search ||
    url.hash
  ) {
    throw new SubmissionError("The submission was received, but the review link was invalid.", {
      code: "invalid_response"
    });
  }
  return Object.freeze({
    ok: true,
    issueNumber,
    issueUrl: url.href,
    submissionSha256: responseSubmissionSha256.toLowerCase(),
    duplicate: value.duplicate === true
  });
}

function publicApiError(value, status) {
  const rawCode = value && value.error && value.error.code;
  let code = typeof rawCode === "string" && /^[a-z0-9_-]{1,80}$/.test(rawCode)
    ? rawCode.replaceAll("-", "_")
    : "submission_rejected";
  if (["body_too_large", "too_many_changes", "proposal_payload_too_large"].includes(code)) {
    code = "payload_too_large";
  } else if (
    code === "internal_error" ||
    code === "upstream_failed" ||
    code.endsWith("_unavailable") ||
    code.startsWith("github_")
  ) {
    code = "service_unavailable";
  }
  const retryable = code === "turnstile_failed" ||
    code === "rate_limited" ||
    code === "service_unavailable" ||
    status === 408 ||
    status === 429 ||
    status >= 500;
  return new SubmissionError(
    PUBLIC_API_ERRORS[code] || "The submission could not be sent.",
    { code, status, retryable }
  );
}

export async function submitSubmission(options = {}) {
  const endpoint = cleanEndpoint(options.endpoint || DEFAULT_SUBMISSION_ENDPOINT);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const payload = buildSubmissionRequest(
    options.submission,
    options.turnstileToken,
    options.website
  );
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).byteLength > MAX_SUBMISSION_BYTES) {
    throw new SubmissionError(PUBLIC_API_ERRORS.payload_too_large, {
      code: "payload_too_large",
      retryable: false
    });
  }
  const expectedSubmissionSha256 = await submissionSha256(payload.submission, options.cryptoImpl);
  let response;
  try {
    response = await fetchWithTimeout(fetchImpl, endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "omit",
      mode: "cors",
      referrerPolicy: "no-referrer",
      body
    }, timeoutMilliseconds(options.timeoutMs, SUBMISSION_TIMEOUT_MS),
    "The submission service took too long to respond. Your work is still here; try again.");
  } catch (_error) {
    if (_error instanceof SubmissionError) throw _error;
    throw new SubmissionError("The submission service could not be reached. Your work is still here; try again.", {
      code: "network_error"
    });
  }
  const data = await responseJson(response, "The submission service returned an unreadable response.");
  if (!response.ok) {
    throw publicApiError(data, response.status);
  }
  return validateSubmissionResponse(data, expectedSubmissionSha256);
}

export function submitRegionProposal(options = {}) {
  return submitSubmission({ ...options, submission: options.proposal });
}

let turnstileLoader;

export function loadTurnstile(options = {}) {
  const windowObject = options.windowObject || globalThis.window;
  const documentObject = options.documentObject || globalThis.document;
  if (windowObject && windowObject.turnstile && typeof windowObject.turnstile.render === "function") {
    return Promise.resolve(windowObject.turnstile);
  }
  if (!documentObject || !documentObject.head) {
    return Promise.reject(new SubmissionError("Spam protection cannot load in this browser.", {
      code: "turnstile_unavailable",
      retryable: false
    }));
  }
  if (turnstileLoader) return turnstileLoader;
  turnstileLoader = new Promise((resolve, reject) => {
    const script = documentObject.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      if (windowObject.turnstile && typeof windowObject.turnstile.render === "function") {
        resolve(windowObject.turnstile);
      } else {
        turnstileLoader = null;
        reject(new SubmissionError("Spam protection did not start. Reload the page and try again.", {
          code: "turnstile_unavailable"
        }));
      }
    }, { once: true });
    script.addEventListener("error", () => {
      turnstileLoader = null;
      reject(new SubmissionError("Spam protection could not load. Check your connection and try again.", {
        code: "turnstile_unavailable"
      }));
    }, { once: true });
    documentObject.head.appendChild(script);
  });
  return turnstileLoader;
}

export function renderTurnstile(turnstile, container, config, callbacks = {}) {
  if (!turnstile || typeof turnstile.render !== "function") {
    throw new SubmissionError("Spam protection is unavailable.", { code: "turnstile_unavailable" });
  }
  return turnstile.render(container, {
    sitekey: config.turnstileSiteKey,
    action: config.turnstileAction,
    theme: "dark",
    appearance: "interaction-only",
    "response-field": false,
    callback: callbacks.onToken,
    "error-callback": callbacks.onError,
    "expired-callback": callbacks.onExpired,
    "timeout-callback": callbacks.onTimeout
  });
}
