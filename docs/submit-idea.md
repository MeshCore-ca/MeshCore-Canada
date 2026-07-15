---
hide:
  - toc
---
# Share an Idea

<div class="submission-hero">
  <p class="submission-hero__eyebrow">Community submission helper</p>
  <h2>Your experience is useful—even if you are brand new</h2>
  <p>Describe the problem in your own words. You do not need to know GitHub, write code, understand radio settings, or have a finished solution. The helper below turns what you know into a clear submission for the MeshCore Canada maintainers.</p>
</div>

!!! info "Nothing is sent automatically"
    This page prepares text in your browser. You decide whether to open it on GitHub, copy it to the forum, or paste it into Discord.

!!! warning "Submissions are public"
    Do not include passwords, private channel keys, API tokens, exact home addresses, private coordinates, or anything else you would not post publicly. A city or broad region is enough.

## Tell us what would help

<form id="community-submission-form" class="submission-form" action="https://github.com/MeshCore-ca/MeshCore-Canada/issues/new" method="get" target="_blank" rel="noopener">
  <input type="hidden" name="template" value="community_idea.yml">
  <noscript>
    <div class="submission-no-script" role="note">
      <strong>JavaScript is turned off.</strong> You can still complete this form: “Prepare submission” will open the guided GitHub form directly. The preview and copy tools require JavaScript, so use the forum or Discord links below if you prefer not to use GitHub.
    </div>
  </noscript>

  <div class="submission-form__grid">
    <div class="submission-field">
      <label for="submission-category">What kind of contribution is this?</label>
      <span id="submission-category-hint" class="submission-field__hint">Choose the closest match. Maintainers can adjust it later.</span>
      <select id="submission-category" name="category" aria-describedby="submission-category-hint" required>
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
      <label for="submission-experience">How familiar are you with MeshCore?</label>
      <span id="submission-experience-hint" class="submission-field__hint">This helps maintainers explain the next step at a useful level.</span>
      <select id="submission-experience" name="experience" aria-describedby="submission-experience-hint" required>
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
    <span id="submission-summary-hint" class="submission-field__hint">One sentence is enough. Example: “A printable checklist for first-time repeater installs.”</span>
    <input id="submission-summary" name="summary" type="text" maxlength="100" autocomplete="off" aria-describedby="submission-summary-hint" required>
  </div>

  <div class="submission-field">
    <label for="submission-region">City or broad region <span class="submission-field__hint">(optional)</span></label>
    <span id="submission-region-hint" class="submission-field__hint">This helps when the idea depends on local coverage or community information. Do not post a home address.</span>
    <input id="submission-region" name="region" type="text" maxlength="100" autocomplete="address-level2" aria-describedby="submission-region-hint" placeholder="Example: Waterloo Region, Ontario">
  </div>

  <div class="submission-field">
    <label for="submission-need">What are you trying to do, or what is difficult today?</label>
    <span id="submission-need-hint" class="submission-field__hint">Plain language is best. Tell us where you got stuck, what was missing, or what you observed.</span>
    <textarea id="submission-need" name="need" maxlength="2000" aria-describedby="submission-need-hint" required></textarea>
  </div>

  <div class="submission-field">
    <label for="submission-idea">What would make it better?</label>
    <span id="submission-idea-hint" class="submission-field__hint">A rough idea is welcome. You do not need to design the complete solution.</span>
    <textarea id="submission-idea" name="idea" maxlength="2000" aria-describedby="submission-idea-hint" required></textarea>
  </div>

  <div class="submission-field">
    <label for="submission-context">Anything else that might help? <span class="submission-field__hint">(optional)</span></label>
    <span id="submission-context-hint" class="submission-field__hint">Examples: device model, app, screenshot description, related page, what you already tried, or who else this may help.</span>
    <textarea id="submission-context" name="context" maxlength="2000" aria-describedby="submission-context-hint"></textarea>
  </div>

  <div class="submission-field">
    <label for="submission-follow-up">Public username or profile for follow-up <span class="submission-field__hint">(optional)</span></label>
    <span id="submission-follow-up-hint" class="submission-field__hint">A Discord username, forum profile, or GitHub username is enough. Avoid email addresses or other private contact information.</span>
    <input id="submission-follow-up" name="follow_up" type="text" maxlength="120" autocomplete="off" aria-describedby="submission-follow-up-hint" placeholder="Example: @meshfriend on Discord">
  </div>

  <label class="submission-consent" for="submission-public">
    <input id="submission-public" name="public" type="checkbox" required>
    <span>I understand the prepared submission is intended for a public community space and does not contain secrets or precise private location information.</span>
  </label>

  <div class="submission-actions">
    <button class="md-button md-button--primary" type="submit">Prepare submission</button>
    <button id="copy-submission" class="md-button" type="button" disabled>Copy text</button>
    <a id="open-github-submission" class="md-button is-disabled" href="#" aria-disabled="true" target="_blank" rel="noopener">Continue on GitHub</a>
  </div>

  <p id="submission-github-note" class="submission-github-note" role="note" hidden></p>
  <p id="submission-status" class="submission-status" role="status" aria-live="polite"></p>
  <pre id="submission-preview" class="submission-preview" tabindex="-1" hidden aria-label="Prepared submission preview"></pre>
</form>

## Choose where to send it

<ul class="submission-routes">
  <li class="submission-route">
    <h3>GitHub</h3>
    <p>Best for tracking a proposal through review. The prepared link fills the community idea form for you. A free GitHub account is required.</p>
  </li>
  <li class="submission-route">
    <h3>Community forum</h3>
    <p>Prepare and copy the text above, then start a discussion on the <a href="https://forum.meshcore.ca/" target="_blank" rel="noopener">MeshCore Canada forum</a>.</p>
  </li>
  <li class="submission-route">
    <h3>Discord</h3>
    <p>For an informal conversation, copy the text and share it in the <a href="https://discord.gg/BESFVMt7yk" target="_blank" rel="noopener">MeshCore Canada Discord</a>.</p>
  </li>
</ul>

## What happens next?

Maintainers will read the submission, ask questions if something is unclear, and decide whether it belongs in the documentation, directory, tooling, or a future project. Submitting an idea does not guarantee implementation, but it makes the need visible and gives the community something concrete to discuss.

If you already know GitHub, you can also open the [Share a Community Idea form](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new?template=community_idea.yml) directly.
