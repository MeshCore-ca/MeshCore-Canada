---
title: Share an idea
description: Send a public idea or problem to MeshCore Canada without needing a GitHub account.
audience:
  - community-member
task: share-an-idea
scope: canada-baseline
status: verified
owner: maintainers-gateway
last_reviewed: 2026-07-19
review_by: 2026-10-19
tested_with:
  submission_gateway: v1
difficulty: beginner
estimated_time: 3-5 minutes
page_styles:
  - stylesheets/extra.css
page_scripts:
  - javascripts/submission-form.js
hide:
  - toc
---
# Share an idea

<div class="submission-intro">
  <p>Share an idea or report a problem. <strong>No GitHub account needed.</strong></p>
  <p class="submission-privacy"><strong>Public form.</strong> Do not include passwords, keys, addresses, or private coordinates.</p>
</div>

<ol class="submission-stepper" aria-label="Submission progress">
  <li data-submission-stage="review" aria-current="step">
    <span>1</span><strong>Review</strong><small>Check what will be public</small>
  </li>
  <li data-submission-stage="verify">
    <span>2</span><strong>Verify</strong><small>Complete the anti-spam check</small>
  </li>
  <li data-submission-stage="submit">
    <span>3</span><strong>Submit</strong><small>Create the public issue</small>
  </li>
</ol>

<form id="community-submission-form" class="submission-form" action="https://github.com/MeshCore-ca/MeshCore-Canada/issues/new" method="get" target="_blank" rel="noopener">
  <input type="hidden" name="template" value="community_idea.yml">
  <input type="hidden" name="source_page" value="https://meshcore.ca/submit-idea/">
  <noscript>
    <div class="submission-no-script" role="note">
      <strong>JavaScript is off.</strong> Continue on GitHub (account required).
    </div>
  </noscript>
  <div id="submission-error-summary" class="submission-error-summary" role="alert" tabindex="-1" hidden>
    <h2>Fix these fields</h2>
    <ul></ul>
  </div>

  <div class="submission-form__header">
    <h2>Describe your idea</h2>
    <p>Five fields are required.</p>
  </div>

  <div class="submission-form__grid">
    <div class="submission-field">
      <label for="submission-category">Type of idea</label>
      <select id="submission-category" name="category" required>
        <option value="">Choose the closest match</option>
        <option>Newcomer or accessibility improvement</option>
        <option>Documentation correction</option>
        <option>Hardware or build-guide idea</option>
        <option>Regional community information</option>
        <option>Network tool or service idea</option>
        <option>Feature or project idea</option>
        <option>Other community feedback</option>
      </select>
    </div>

    <div class="submission-field">
      <label for="submission-experience">Your MeshCore experience</label>
      <select id="submission-experience" name="experience" required>
        <option value="">Choose one</option>
        <option>Brand new / researching</option>
        <option>Setting up my first node</option>
        <option>Active mesh user</option>
        <option>Repeater, room server, or observer operator</option>
        <option>Developer or documentation contributor</option>
      </select>
    </div>
  </div>

  <div class="submission-field">
    <label for="submission-summary">Short title</label>
    <input id="submission-summary" name="summary" type="text" maxlength="100" autocomplete="off" placeholder="Example: Add a repeater checklist" required>
  </div>

  <div class="submission-form__grid submission-form__grid--ideas">
    <div class="submission-field">
      <label for="submission-need">What is difficult now?</label>
      <textarea id="submission-need" name="need" maxlength="2000" rows="5" placeholder="What happened?" required></textarea>
    </div>

    <div class="submission-field">
      <label for="submission-idea">What would help?</label>
      <textarea id="submission-idea" name="idea" maxlength="2000" rows="5" placeholder="What should change?" required></textarea>
    </div>
  </div>

  <details class="submission-optional">
    <summary>Add context <span>Optional</span></summary>
    <div class="submission-optional__body">
      <div class="submission-form__grid">
        <div class="submission-field">
          <label for="submission-region">City or broad region</label>
          <input id="submission-region" name="region" type="text" maxlength="100" autocomplete="address-level2" placeholder="Example: Waterloo Region, Ontario">
        </div>

        <div class="submission-field">
          <label for="submission-follow-up">Public username</label>
          <input id="submission-follow-up" name="follow_up" type="text" maxlength="120" autocomplete="off" placeholder="Example: @meshfriend on Discord">
        </div>
      </div>

      <div class="submission-field">
        <label for="submission-context">Anything else?</label>
        <textarea id="submission-context" name="context" maxlength="2000" rows="4" placeholder="Device, app, page, or other details."></textarea>
      </div>
    </div>
  </details>

  <label class="submission-consent" for="submission-public">
    <input id="submission-public" name="public" type="checkbox" required>
    <span>This can be posted publicly and contains no private information.</span>
  </label>

  <div class="submission-draft-actions">
    <button id="save-submission-draft" class="md-button" type="button" disabled>Save draft on this device</button>
    <button id="clear-submission-draft" class="md-button" type="button" hidden>Clear saved draft</button>
    <p id="submission-draft-status" role="status" aria-live="polite">Confirm the public-content statement before saving a draft.</p>
  </div>

  <div class="submission-trap" aria-hidden="true">
    <label for="submission-website">Website</label>
    <input id="submission-website" type="text" maxlength="200" tabindex="-1" autocomplete="off">
  </div>

  <div class="submission-review-action">
    <button id="review-submission" class="md-button md-button--primary" type="submit">Review idea</button>
    <p id="submission-status" class="submission-status" role="status" aria-live="polite"></p>
  </div>

  <pre id="submission-preview" class="submission-preview" tabindex="-1" hidden aria-label="Prepared submission preview"></pre>
  <p id="submission-preview-note" class="submission-preview-note" hidden><strong>Preview only.</strong> Nothing has been submitted yet.</p>

  <div id="submission-verification" class="submission-verification" hidden>
    <div id="submission-turnstile" class="submission-turnstile" aria-label="Anti-spam check"></div>
    <p id="submission-anti-spam-status" class="submission-anti-spam-status" role="status" aria-live="polite"></p>
    <button id="submission-anti-spam-retry" class="md-button submission-inline-retry" type="button" hidden>Retry check</button>
  </div>

  <div id="submission-final-actions" class="submission-actions" hidden>
    <div class="submission-public-summary" role="note"><strong>This creates a public GitHub issue.</strong> Maintainers and community members can read it.</div>
    <button id="review-submission-again" class="md-button md-button--primary" type="button" hidden>Review changes again</button>
    <button id="submit-community-idea" class="md-button md-button--primary" type="button" disabled>Submit idea</button>
    <button id="copy-submission" class="md-button" type="button" disabled>Copy text</button>
    <a id="open-github-submission" class="md-button is-disabled" href="#" aria-disabled="true" target="_blank" rel="noopener">Use GitHub instead</a>
  </div>

  <p id="submission-github-note" class="submission-github-note" role="note" hidden></p>
  <div id="submission-result" class="submission-result" role="status" aria-live="polite" tabindex="-1"></div>
</form>

<details class="submission-alternatives">
  <summary>Other ways to share</summary>
  <p><a href="https://github.com/MeshCore-ca/MeshCore-Canada/issues/new?template=community_idea.yml&amp;source_page=https%3A%2F%2Fmeshcore.ca%2Fsubmit-idea%2F" target="_blank" rel="noopener">GitHub form</a> (account required) · <a href="https://forum.meshcore.ca/" target="_blank" rel="noopener">Community forum</a> · <a href="https://discord.gg/BESFVMt7yk" target="_blank" rel="noopener">Discord</a></p>
</details>

## What happens next?

Maintainers will review the issue and follow up there.
