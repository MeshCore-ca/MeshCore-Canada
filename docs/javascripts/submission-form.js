(() => {
  "use strict";

  const form = document.getElementById("community-submission-form");
  if (!form) return;
  form.noValidate = true;

  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : window.location.href;
  const communityModuleUrl = new URL("./community-submission.js", scriptUrl).href;
  const transportModuleUrl = new URL("../config/editor/issue.js", scriptUrl).href;
  const elements = {
    preview: document.getElementById("submission-preview"),
    previewNote: document.getElementById("submission-preview-note"),
    status: document.getElementById("submission-status"),
    review: document.getElementById("review-submission"),
    reviewAgain: document.getElementById("review-submission-again"),
    copy: document.getElementById("copy-submission"),
    submit: document.getElementById("submit-community-idea"),
    github: document.getElementById("open-github-submission"),
    githubNote: document.getElementById("submission-github-note"),
    result: document.getElementById("submission-result"),
    errorSummary: document.getElementById("submission-error-summary"),
    verification: document.getElementById("submission-verification"),
    finalActions: document.getElementById("submission-final-actions"),
    turnstile: document.getElementById("submission-turnstile"),
    antiSpamStatus: document.getElementById("submission-anti-spam-status"),
    antiSpamRetry: document.getElementById("submission-anti-spam-retry"),
    website: document.getElementById("submission-website"),
    publicConsent: document.getElementById("submission-public"),
    saveDraft: document.getElementById("save-submission-draft"),
    clearDraft: document.getElementById("clear-submission-draft"),
    draftStatus: document.getElementById("submission-draft-status"),
    stages: Array.from(document.querySelectorAll("[data-submission-stage]"))
  };

  const DRAFT_KEY = "meshcore-canada:community-idea-draft:v1";
  const DRAFT_FIELD_IDS = [
    "submission-category",
    "submission-experience",
    "submission-summary",
    "submission-region",
    "submission-need",
    "submission-idea",
    "submission-context",
    "submission-follow-up"
  ];

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
  let draftOptedIn = false;
  let draftTimer = null;
  let receiptVisible = false;

  function setStage(stage, complete = false) {
    const order = ["review", "verify", "submit"];
    const currentIndex = order.indexOf(stage);
    elements.stages.forEach((item) => {
      const itemIndex = order.indexOf(item.dataset.submissionStage);
      item.toggleAttribute("aria-current", !complete && itemIndex === currentIndex);
      item.dataset.complete = String(complete ? itemIndex <= currentIndex : itemIndex < currentIndex);
    });
  }

  function addDescription(field, id) {
    const ids = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
    ids.add(id);
    field.setAttribute("aria-describedby", Array.from(ids).join(" "));
  }

  function removeDescription(field, id) {
    const ids = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter((value) => value && value !== id);
    if (ids.length) field.setAttribute("aria-describedby", ids.join(" "));
    else field.removeAttribute("aria-describedby");
  }

  function clearFieldError(field) {
    if (!field || !field.id) return;
    const errorId = `${field.id}-error`;
    document.getElementById(errorId)?.remove();
    field.removeAttribute("aria-invalid");
    removeDescription(field, errorId);
  }

  function clearValidationErrors() {
    form.querySelectorAll(".submission-field-error").forEach((error) => error.remove());
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
      field.removeAttribute("aria-invalid");
      removeDescription(field, `${field.id}-error`);
    });
    elements.errorSummary.hidden = true;
    elements.errorSummary.querySelector("ul").replaceChildren();
  }

  function fieldLabel(field) {
    const label = form.querySelector(`label[for='${CSS.escape(field.id)}']`);
    return (label?.textContent || field.name || "This field").replace(/\s+/g, " ").trim();
  }

  function showValidationErrors() {
    clearValidationErrors();
    const invalidFields = Array.from(form.querySelectorAll("[required]")).filter(
      (field) => !field.validity.valid
    );
    if (!invalidFields.length) return true;

    const list = elements.errorSummary.querySelector("ul");
    invalidFields.forEach((field) => {
      const label = fieldLabel(field);
      const message = field.validity.valueMissing ? `${label} is required.` : field.validationMessage;
      const error = document.createElement("p");
      error.id = `${field.id}-error`;
      error.className = "submission-field-error";
      error.textContent = message;
      const container = field.closest(".submission-field");
      if (container) container.append(error);
      else field.closest(".submission-consent")?.insertAdjacentElement("afterend", error);
      field.setAttribute("aria-invalid", "true");
      addDescription(field, error.id);

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${field.id}`;
      link.textContent = message;
      link.addEventListener("click", () => window.setTimeout(() => field.focus(), 0));
      item.append(link);
      list.append(item);
    });
    elements.errorSummary.hidden = false;
    elements.errorSummary.focus();
    return false;
  }

  function initialiseCharacterCounters() {
    form.querySelectorAll("input[maxlength], textarea[maxlength]").forEach((field) => {
      if (!field.id || field === elements.website || field.maxLength < 0) return;
      const counter = document.createElement("span");
      counter.id = `${field.id}-count`;
      counter.className = "submission-character-count";
      const update = () => {
        counter.textContent = `${field.value.length} / ${field.maxLength}`;
        counter.dataset.nearLimit = String(field.value.length >= field.maxLength * 0.9);
      };
      field.insertAdjacentElement("afterend", counter);
      addDescription(field, counter.id);
      field.addEventListener("input", update);
      update();
    });
  }

  function draftValues() {
    return Object.fromEntries(DRAFT_FIELD_IDS.map((id) => [id, document.getElementById(id).value]));
  }

  function saveDraft(quiet = false) {
    if (!elements.publicConsent.checked) {
      elements.draftStatus.textContent = "Confirm the public-content statement before saving a draft.";
      return false;
    }
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        fields: draftValues()
      }));
      draftOptedIn = true;
      elements.clearDraft.hidden = false;
      if (!quiet) elements.draftStatus.textContent = "Draft saved on this device. Turnstile and anti-spam values are never stored.";
      return true;
    } catch (_error) {
      elements.draftStatus.textContent = "This browser blocked draft storage. Your answers remain in the form.";
      return false;
    }
  }

  function scheduleDraftSave() {
    if (!draftOptedIn || !elements.publicConsent.checked) return;
    if (draftTimer) window.clearTimeout(draftTimer);
    draftTimer = window.setTimeout(() => {
      saveDraft(true);
      elements.draftStatus.textContent = "Saved draft updated on this device.";
    }, 300);
  }

  function clearSavedDraft(message = "Saved draft cleared.") {
    if (draftTimer) window.clearTimeout(draftTimer);
    draftTimer = null;
    try { window.localStorage.removeItem(DRAFT_KEY); } catch (_error) {}
    draftOptedIn = false;
    elements.clearDraft.hidden = true;
    elements.draftStatus.textContent = message;
  }

  function restoreDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.version !== 1 || !draft.fields || typeof draft.fields !== "object") {
        clearSavedDraft("An incompatible saved draft was removed.");
        return;
      }
      DRAFT_FIELD_IDS.forEach((id) => {
        const field = document.getElementById(id);
        const saved = draft.fields[id];
        if (typeof saved !== "string") return;
        const bounded = field.maxLength > -1 ? saved.slice(0, field.maxLength) : saved;
        if (field instanceof HTMLSelectElement) {
          if (Array.from(field.options).some((option) => option.value === bounded)) field.value = bounded;
        } else field.value = bounded;
      });
      draftOptedIn = true;
      elements.clearDraft.hidden = false;
      elements.publicConsent.checked = false;
      elements.draftStatus.textContent = "Draft restored. Confirm the public-content statement before updating or submitting it.";
    } catch (_error) {
      clearSavedDraft("The saved draft could not be read and was removed.");
    }
  }

  function updateDraftControls() {
    elements.saveDraft.disabled = !elements.publicConsent.checked;
    if (!elements.publicConsent.checked && !draftOptedIn) {
      elements.draftStatus.textContent = "Confirm the public-content statement before saving a draft.";
    } else if (elements.publicConsent.checked && draftOptedIn) scheduleDraftSave();
    else if (elements.publicConsent.checked) elements.draftStatus.textContent = "You can now save a draft on this device.";
  }

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
    const current = Boolean(preparedProposal && preparedRevision === revision);
    const hasPreview = Boolean(preparedText);
    const stale = hasPreview && !current;
    form.dataset.prepared = current ? "true" : "false";
    form.dataset.previewStale = stale ? "true" : "false";
    elements.review.textContent = current ? "Update preview" : stale ? "Review changes again" : "Review idea";
    elements.review.classList.toggle("md-button--primary", !current);
    elements.preview.hidden = !hasPreview;
    elements.previewNote.hidden = !hasPreview;
    elements.verification.hidden = !current;
    elements.finalActions.hidden = !hasPreview;
    elements.reviewAgain.hidden = !stale;
    elements.submit.disabled = !current || !config || !token || submitting;
    elements.copy.disabled = !current || submitting;
    if (receiptVisible) setStage("submit", true);
    else setStage(current ? (token ? "submit" : "verify") : "review");
  }

  function setAntiSpamStatus(message, state = "") {
    elements.antiSpamStatus.textContent = message;
    elements.antiSpamStatus.dataset.state = state;
  }

  function clearResult() {
    receiptVisible = false;
    elements.result.replaceChildren();
    elements.result.dataset.state = "";
  }

  function showResult(value, changedWhileSubmitting) {
    const prefix = changedWhileSubmitting
      ? "Earlier version submitted. New changes are not included. "
      : value.duplicate
        ? "Already submitted. "
        : "Submitted for review. ";
    const link = document.createElement("a");
    link.href = value.issueUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `Open issue #${value.issueNumber}`;
    elements.result.replaceChildren(
      document.createTextNode(prefix),
      link,
      document.createTextNode(". Maintainers will review the public issue and respond there.")
    );
    elements.result.dataset.state = "success";
    receiptVisible = true;
    elements.result.focus();
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
    preparedRevision = -1;
    elements.github.href = "#";
    elements.github.classList.add("is-disabled");
    elements.github.setAttribute("aria-disabled", "true");
    clearGithubNote();
    clearResult();
    if (!submitting) elements.status.textContent = "Answers changed. Review them again before submitting.";
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
        setAntiSpamStatus(message || "Retrying check…");
        turnstile.reset(widgetId);
      } catch (_error) {
        if (typeof turnstile.remove === "function") {
          try { turnstile.remove(widgetId); } catch (_removeError) {}
        }
        widgetId = null;
        elements.turnstile.replaceChildren();
        setAntiSpamStatus("Check failed. Retry.", "error");
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
        setAntiSpamStatus("Check complete.", "success");
        elements.antiSpamRetry.hidden = true;
        updateActions();
      },
      onError() {
        setAntiSpamStatus("Check failed. Retrying…", "error");
        scheduleReset("Retrying the anti-spam check…", 1000);
      },
      onExpired() {
        setAntiSpamStatus("Check expired. Retrying…");
        scheduleReset("Retrying check…", 250);
      },
      onTimeout() {
        setAntiSpamStatus("Check timed out. Retrying…", "error");
        scheduleReset("Retrying the anti-spam check…", 1000);
      }
    };
  }

  async function initialiseSubmission() {
    if (initialising) return;
    initialising = true;
    elements.antiSpamRetry.hidden = true;
    setAntiSpamStatus("Loading check…");
    try {
      const loaded = await loadModules();
      config = await loaded.transport.fetchSubmissionConfig({
        endpoint: loaded.community.COMMUNITY_SUBMISSION_ENDPOINT
      });
      turnstile = await loaded.transport.loadTurnstile();
      if (widgetId === null) {
        setAntiSpamStatus("Complete the check.");
        widgetId = loaded.transport.renderTurnstile(
          turnstile,
          elements.turnstile,
          config,
          callbacks()
        );
      } else {
        resetTurnstile("Retrying check…");
      }
    } catch (_error) {
      config = null;
      token = "";
      setAntiSpamStatus(
        "Anonymous submission is unavailable. Copy the idea or use GitHub.",
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
    if (!showValidationErrors()) {
      elements.status.textContent = "Fix the fields listed above, then review again.";
      return;
    }
    try {
      const loaded = await loadModules();
      preparedProposal = loaded.community.buildCommunityIdea(values());
      preparedText = loaded.community.buildSubmissionText(preparedProposal);
      preparedRevision = revision;
      elements.preview.textContent = preparedText;
      clearResult();

      const manual = loaded.community.buildManualGithubLink(preparedProposal);
      elements.github.href = manual.url;
      elements.github.classList.remove("is-disabled");
      elements.github.setAttribute("aria-disabled", "false");
      if (manual.fullyPrefilled) {
        clearGithubNote();
      } else {
        elements.githubNote.textContent = "Too long to prefill. Copy the text, then use GitHub.";
        elements.githubNote.hidden = false;
      }
      updateActions();
      if (!config || !token) void initialiseSubmission();
      elements.status.textContent = config && token
        ? "Preview ready. Nothing has been submitted. You can now submit."
        : "Preview ready. Nothing has been submitted. Complete the verification next.";
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      elements.preview.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
    } catch (error) {
      markUnprepared();
      elements.status.textContent = error.message || "Check the form and try again.";
    }
  });

  form.addEventListener("input", (event) => {
    if (event.target === elements.website) return;
    clearFieldError(event.target);
    if (!form.querySelector(".submission-field-error")) elements.errorSummary.hidden = true;
    revision += 1;
    if (preparedProposal) markUnprepared();
    scheduleDraftSave();
  });

  elements.publicConsent.addEventListener("change", updateDraftControls);
  elements.saveDraft.addEventListener("click", () => saveDraft(false));
  elements.clearDraft.addEventListener("click", () => clearSavedDraft());
  elements.reviewAgain.addEventListener("click", () => form.requestSubmit(elements.review));

  elements.copy.addEventListener("click", async () => {
    if (!preparedText || preparedRevision !== revision) return;
    try {
      await copyText(preparedText);
      elements.status.textContent = "Copied.";
    } catch (_error) {
      selectPreviewText();
      elements.status.textContent = "Copy blocked. Copy the selected preview.";
    }
  });

  elements.submit.addEventListener("click", async () => {
    if (!preparedProposal || preparedRevision !== revision) {
      elements.status.textContent = "Review the latest answers.";
      return;
    }
    if (!config || !token || submitting) {
      elements.status.textContent = "Complete the check first.";
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
    elements.status.textContent = "Submitting…";
    try {
      const value = await loaded.transport.submitSubmission({
        endpoint: config.endpoint,
        submission,
        turnstileToken: currentToken,
        website: elements.website.value
      });
      const changed = revision !== submittedRevision;
      showResult(value, changed);
      if (!changed) clearSavedDraft("Submitted. Saved draft cleared from this device.");
      elements.status.textContent = changed
        ? "The reviewed version was submitted. Review and submit again to include your newer changes."
        : value.duplicate
          ? "Already submitted."
          : "Submitted for review.";
    } catch (error) {
      const nextStep = error.retryable
        ? " Your answers remain in the form. Complete the check and try again."
        : " Your answers remain in the form. Copy the text or use GitHub.";
      elements.status.textContent = (error.message || "The idea could not be submitted.") + nextStep;
    } finally {
      submitting = false;
      elements.submit.textContent = "Submit idea";
      elements.submit.removeAttribute("aria-busy");
      resetTurnstile("Preparing another check…");
      updateActions();
    }
  });

  elements.github.addEventListener("click", (event) => {
    if (elements.github.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      elements.status.textContent = "Review the idea first.";
    }
  });

  elements.antiSpamRetry.addEventListener("click", initialiseSubmission);
  initialiseCharacterCounters();
  restoreDraft();
  updateDraftControls();
  updateActions();
})();
