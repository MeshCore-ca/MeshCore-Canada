(() => {
  "use strict";

  const form = document.getElementById("community-submission-form");
  if (!form) return;

  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : window.location.href;
  const communityModuleUrl = new URL("./community-submission.js", scriptUrl).href;
  const transportModuleUrl = new URL("../config/editor/issue.js", scriptUrl).href;
  const elements = {
    preview: document.getElementById("submission-preview"),
    status: document.getElementById("submission-status"),
    copy: document.getElementById("copy-submission"),
    submit: document.getElementById("submit-community-idea"),
    github: document.getElementById("open-github-submission"),
    githubNote: document.getElementById("submission-github-note"),
    result: document.getElementById("submission-result"),
    turnstile: document.getElementById("submission-turnstile"),
    antiSpamStatus: document.getElementById("submission-anti-spam-status"),
    antiSpamRetry: document.getElementById("submission-anti-spam-retry"),
    website: document.getElementById("submission-website")
  };

  let modules = null;
  let config = null;
  let turnstile = null;
  let widgetId = null;
  let token = "";
  let resetTimer = null;
  let initialising = false;
  let submitting = false;
  let revision = 0;
  let preparedRevision = -1;
  let preparedProposal = null;
  let preparedText = "";

  async function loadModules() {
    if (!modules) {
      const [community, transport] = await Promise.all([
        import(communityModuleUrl),
        import(transportModuleUrl)
      ]);
      modules = { community, transport };
    }
    return modules;
  }

  function updateActions() {
    const current = preparedProposal && preparedRevision === revision;
    elements.submit.disabled = !current || !config || !token || submitting;
    elements.copy.disabled = !current || submitting;
  }

  function setAntiSpamStatus(message, state = "") {
    elements.antiSpamStatus.textContent = message;
    elements.antiSpamStatus.dataset.state = state;
  }

  function clearResult() {
    elements.result.replaceChildren();
    elements.result.dataset.state = "";
  }

  function showResult(value, changedWhileSubmitting) {
    const prefix = changedWhileSubmitting
      ? "The submitted version has a public review issue. Newer changes are not included. "
      : value.duplicate
        ? "This idea was already submitted. "
        : "Your idea now has a public review issue. ";
    const link = document.createElement("a");
    link.href = value.issueUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `Open issue #${value.issueNumber}`;
    elements.result.replaceChildren(document.createTextNode(prefix), link);
    elements.result.dataset.state = "success";
  }

  function values() {
    const value = (id) => document.getElementById(id).value;
    return {
      category: value("submission-category"),
      experience: value("submission-experience"),
      summary: value("submission-summary"),
      region: value("submission-region"),
      need: value("submission-need"),
      idea: value("submission-idea"),
      context: value("submission-context"),
      followUp: value("submission-follow-up"),
      publicAcknowledged: document.getElementById("submission-public").checked
    };
  }

  function clearGithubNote() {
    elements.githubNote.hidden = true;
    elements.githubNote.textContent = "";
  }

  function markUnprepared() {
    preparedProposal = null;
    preparedText = "";
    preparedRevision = -1;
    elements.github.href = "#";
    elements.github.classList.add("is-disabled");
    elements.github.setAttribute("aria-disabled", "true");
    elements.preview.hidden = true;
    clearGithubNote();
    clearResult();
    if (!submitting) elements.status.textContent = "Review the updated answers before submitting.";
    updateActions();
  }

  function selectPreviewText() {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(elements.preview);
    selection.removeAllRanges();
    selection.addRange(range);
    elements.preview.focus();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("Browser copy command failed");
  }

  function resetTurnstile(message) {
    token = "";
    if (resetTimer) {
      window.clearTimeout(resetTimer);
      resetTimer = null;
    }
    if (turnstile && widgetId !== null) {
      try {
        setAntiSpamStatus(message || "Running a new anti-spam check…");
        turnstile.reset(widgetId);
      } catch (_error) {
        if (typeof turnstile.remove === "function") {
          try { turnstile.remove(widgetId); } catch (_removeError) {}
        }
        widgetId = null;
        elements.turnstile.replaceChildren();
        setAntiSpamStatus("The anti-spam check could not restart. Retry it below.", "error");
        elements.antiSpamRetry.hidden = false;
      }
    }
    updateActions();
  }

  function scheduleReset(message, delay) {
    token = "";
    updateActions();
    if (resetTimer) window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => resetTurnstile(message), delay);
  }

  function callbacks() {
    return {
      onToken(value) {
        token = String(value || "");
        setAntiSpamStatus("Anti-spam check complete.", "success");
        elements.antiSpamRetry.hidden = true;
        updateActions();
      },
      onError() {
        setAntiSpamStatus("The anti-spam check failed. It will retry automatically.", "error");
        scheduleReset("Retrying the anti-spam check…", 1000);
      },
      onExpired() {
        setAntiSpamStatus("The anti-spam check expired. Running it again…");
        scheduleReset("Running a new anti-spam check…", 250);
      },
      onTimeout() {
        setAntiSpamStatus("The anti-spam check timed out. Running it again…", "error");
        scheduleReset("Retrying the anti-spam check…", 1000);
      }
    };
  }

  async function initialiseSubmission() {
    if (initialising) return;
    initialising = true;
    elements.antiSpamRetry.hidden = true;
    setAntiSpamStatus("Loading anti-spam protection…");
    try {
      const loaded = await loadModules();
      config = await loaded.transport.fetchSubmissionConfig({
        endpoint: loaded.community.COMMUNITY_SUBMISSION_ENDPOINT
      });
      turnstile = await loaded.transport.loadTurnstile();
      if (widgetId === null) {
        setAntiSpamStatus("Complete the anti-spam check if prompted.");
        widgetId = loaded.transport.renderTurnstile(
          turnstile,
          elements.turnstile,
          config,
          callbacks()
        );
      } else {
        resetTurnstile("Running a new anti-spam check…");
      }
    } catch (error) {
      config = null;
      token = "";
      setAntiSpamStatus(
        error.message || "Anti-spam protection is unavailable. Copy the idea or use the manual GitHub option.",
        "error"
      );
      elements.antiSpamRetry.hidden = false;
    } finally {
      initialising = false;
      updateActions();
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      const loaded = await loadModules();
      preparedProposal = loaded.community.buildCommunityIdea(values());
      preparedText = loaded.community.buildSubmissionText(preparedProposal);
      preparedRevision = revision;
      elements.preview.textContent = preparedText;
      elements.preview.hidden = false;
      clearResult();

      const manual = loaded.community.buildManualGithubLink(preparedProposal);
      elements.github.href = manual.url;
      elements.github.classList.remove("is-disabled");
      elements.github.setAttribute("aria-disabled", "false");
      if (manual.fullyPrefilled) {
        clearGithubNote();
      } else {
        elements.githubNote.textContent = "This idea is too long for a reliable GitHub prefill. Copy the prepared text before using the manual GitHub option.";
        elements.githubNote.hidden = false;
      }
      elements.status.textContent = config && token
        ? "Review the text below, then submit it. No GitHub account is needed."
        : "Idea prepared. You can copy it now; anonymous submission will be available when the anti-spam check completes.";
      updateActions();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      elements.preview.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    } catch (error) {
      markUnprepared();
      elements.status.textContent = error.message || "Check the form and try again.";
    }
  });

  form.addEventListener("input", () => {
    revision += 1;
    if (preparedProposal) markUnprepared();
  });

  elements.copy.addEventListener("click", async () => {
    if (!preparedText || preparedRevision !== revision) return;
    try {
      await copyText(preparedText);
      elements.status.textContent = "Copied. You can paste the idea into the forum or Discord.";
    } catch (_error) {
      selectPreviewText();
      elements.status.textContent = "Copy was blocked by the browser. The preview is selected; copy it manually.";
    }
  });

  elements.submit.addEventListener("click", async () => {
    if (!preparedProposal || preparedRevision !== revision) {
      elements.status.textContent = "Review the current answers before submitting.";
      return;
    }
    if (!config || !token || submitting) {
      elements.status.textContent = "Wait for the anti-spam check, then try Submit idea again.";
      return;
    }
    const loaded = await loadModules();
    const submission = preparedProposal;
    const currentToken = token;
    const submittedRevision = revision;
    token = "";
    submitting = true;
    elements.submit.textContent = "Submitting…";
    elements.submit.setAttribute("aria-busy", "true");
    clearResult();
    updateActions();
    elements.status.textContent = "Creating the public review issue…";
    try {
      const value = await loaded.transport.submitSubmission({
        endpoint: config.endpoint,
        submission,
        turnstileToken: currentToken,
        website: elements.website.value
      });
      const changed = revision !== submittedRevision;
      showResult(value, changed);
      elements.status.textContent = changed
        ? "The reviewed version was submitted. Review and submit again to include your newer changes."
        : value.duplicate
          ? "This idea already has a review issue."
          : "Idea submitted. Maintainers can now review it publicly.";
    } catch (error) {
      const nextStep = error.retryable
        ? " Your answers are still here. Wait for the anti-spam check, then try again."
        : " Copy the prepared text or use the manual GitHub option if you need another route.";
      elements.status.textContent = (error.message || "The idea could not be submitted.") + nextStep;
    } finally {
      submitting = false;
      elements.submit.textContent = "Submit idea";
      elements.submit.removeAttribute("aria-busy");
      resetTurnstile("Preparing another anti-spam check…");
      updateActions();
    }
  });

  elements.github.addEventListener("click", (event) => {
    if (elements.github.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      elements.status.textContent = "Review the submission before opening the manual GitHub form.";
    }
  });

  elements.antiSpamRetry.addEventListener("click", initialiseSubmission);
  initialiseSubmission();
})();
