---
title: Partager une idée
description: Envoyez une idée ou signalez un problème publiquement à MeshCore Canada, sans compte GitHub.
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
  - stylesheets/extra.css?v=20260722-2
page_scripts:
  - javascripts/submission-form.js?v=20260722-2
hide:
  - toc
---
# Partager une idée

<div class="submission-intro">
  <p>Partagez une idée ou signalez un problème. <strong>Aucun compte GitHub n’est nécessaire.</strong></p>
  <p class="submission-privacy"><strong>Ce formulaire est public.</strong> N’incluez aucun mot de passe, aucune clé, aucune adresse ni aucune coordonnée privée.</p>
</div>

<ol class="submission-stepper" aria-label="Progression de la soumission">
  <li data-submission-stage="review" aria-current="step">
    <span>1</span><strong>Relire</strong><small>Vérifier ce qui sera public</small>
  </li>
  <li data-submission-stage="verify">
    <span>2</span><strong>Vérifier</strong><small>Effectuer la vérification antipourriel</small>
  </li>
  <li data-submission-stage="submit">
    <span>3</span><strong>Soumettre</strong><small>Créer le billet public</small>
  </li>
</ol>

<form id="community-submission-form" class="submission-form" action="https://github.com/MeshCore-ca/MeshCore-Canada/issues/new" method="get" target="_blank" rel="noopener">
  <input type="hidden" name="template" value="community_idea.yml">
  <input type="hidden" name="source_page" value="https://meshcore.ca/fr/submit-idea/">
  <noscript>
    <div class="submission-no-script" role="note">
      <strong>JavaScript est désactivé.</strong> Continuez sur GitHub; un compte sera nécessaire.
    </div>
  </noscript>
  <div id="submission-error-summary" class="submission-error-summary" role="alert" tabindex="-1" hidden>
    <h2>Corrigez ces champs</h2>
    <ul></ul>
  </div>

  <div class="submission-form__header">
    <h2>Décrivez votre idée</h2>
    <p>Remplissez les cinq champs obligatoires.</p>
  </div>

  <div class="submission-form__grid">
    <div class="submission-field">
      <label for="submission-category">Type d’idée</label>
      <select id="submission-category" name="category" required>
        <option value="">Choisissez la meilleure option</option>
        <option value="Newcomer or accessibility improvement">Amélioration pour les personnes qui débutent ou en matière d’accessibilité</option>
        <option value="Documentation correction">Correction de la documentation</option>
        <option value="Hardware or build-guide idea">Idée de matériel ou de guide de montage</option>
        <option value="Regional community information">Renseignements sur une communauté régionale</option>
        <option value="Network tool or service idea">Idée d’outil ou de service réseau</option>
        <option value="Feature or project idea">Idée de fonctionnalité ou de projet</option>
        <option value="Other community feedback">Autre commentaire de la communauté</option>
      </select>
    </div>

    <div class="submission-field">
      <label for="submission-experience">Votre expérience avec MeshCore</label>
      <select id="submission-experience" name="experience" required>
        <option value="">Choisissez une option</option>
        <option value="Brand new / researching">Je découvre MeshCore ou je me renseigne</option>
        <option value="Setting up my first node">Je configure mon premier nœud</option>
        <option value="Active mesh user">J’utilise activement un réseau MeshCore</option>
        <option value="Repeater, room server, or observer operator">Je m’occupe d’un répéteur, d’un serveur de salon ou d’un observateur</option>
        <option value="Developer or documentation contributor">Je contribue au développement ou à la documentation</option>
      </select>
    </div>
  </div>

  <div class="submission-field">
    <label for="submission-summary">Titre court</label>
    <input id="submission-summary" name="summary" type="text" maxlength="100" autocomplete="off" placeholder="Exemple : Ajouter une liste de vérification pour les répéteurs" required>
  </div>

  <div class="submission-form__grid submission-form__grid--ideas">
    <div class="submission-field">
      <label for="submission-need">Qu’est-ce qui est difficile en ce moment?</label>
      <textarea id="submission-need" name="need" maxlength="2000" rows="5" placeholder="Expliquez-nous ce qui vous a bloqué." required></textarea>
    </div>

    <div class="submission-field">
      <label for="submission-idea">Qu’est-ce qui devrait être amélioré?</label>
      <textarea id="submission-idea" name="idea" maxlength="2000" rows="5" placeholder="Indiquez le changement qui vous aiderait le plus." required></textarea>
    </div>
  </div>

  <details class="submission-optional">
    <summary>Ajouter des précisions <span>Facultatif</span></summary>
    <div class="submission-optional__body">
      <div class="submission-form__grid">
        <div class="submission-field">
          <label for="submission-region">Ville ou grande région</label>
          <input id="submission-region" name="region" type="text" maxlength="100" autocomplete="address-level2" placeholder="Exemple : Région de Waterloo, Ontario">
        </div>

        <div class="submission-field">
          <label for="submission-follow-up">Nom d’utilisateur public</label>
          <input id="submission-follow-up" name="follow_up" type="text" maxlength="120" autocomplete="off" placeholder="Exemple : @meshfriend sur Discord">
        </div>
      </div>

      <div class="submission-field">
        <label for="submission-context">Autre chose à ajouter?</label>
        <textarea id="submission-context" name="context" maxlength="2000" rows="4" placeholder="Appareil, application, page ou autre précision."></textarea>
      </div>
    </div>
  </details>

  <label class="submission-consent" for="submission-public">
    <input id="submission-public" name="public" type="checkbox" required>
    <span>Cette soumission sera publique. Je n’y ai inclus aucun renseignement privé.</span>
  </label>

  <div class="submission-draft-actions">
    <button id="save-submission-draft" class="md-button" type="button" disabled>Enregistrer le brouillon sur cet appareil</button>
    <button id="clear-submission-draft" class="md-button" type="button" hidden>Effacer le brouillon enregistré</button>
    <p id="submission-draft-status" role="status" aria-live="polite">Confirmez que le contenu peut être public avant d’enregistrer un brouillon.</p>
  </div>

  <div class="submission-trap" aria-hidden="true">
    <label for="submission-website">Site Web</label>
    <input id="submission-website" type="text" maxlength="200" tabindex="-1" autocomplete="off">
  </div>

  <div class="submission-review-action">
    <button id="review-submission" class="md-button md-button--primary" type="submit">Relire l’idée</button>
    <p id="submission-status" class="submission-status" role="status" aria-live="polite"></p>
  </div>

  <pre id="submission-preview" class="submission-preview" tabindex="-1" hidden aria-label="Aperçu de la soumission préparée"></pre>
  <p id="submission-preview-note" class="submission-preview-note" hidden><strong>Ceci est seulement un aperçu.</strong> Rien n’a encore été soumis.</p>

  <div id="submission-verification" class="submission-verification" hidden>
    <div id="submission-turnstile" class="submission-turnstile" aria-label="Vérification antipourriel"></div>
    <p id="submission-anti-spam-status" class="submission-anti-spam-status" role="status" aria-live="polite"></p>
    <button id="submission-anti-spam-retry" class="md-button submission-inline-retry" type="button" hidden>Réessayer la vérification</button>
  </div>

  <div id="submission-final-actions" class="submission-actions" hidden>
    <div class="submission-public-summary" role="note"><strong>Ceci crée un billet GitHub public.</strong> L’équipe de maintenance et les membres de la communauté pourront le lire.</div>
    <button id="review-submission-again" class="md-button md-button--primary" type="button" hidden>Relire les changements</button>
    <button id="submit-community-idea" class="md-button md-button--primary" type="button" disabled>Soumettre l’idée</button>
    <button id="copy-submission" class="md-button" type="button" disabled>Copier le texte</button>
    <a id="open-github-submission" class="md-button is-disabled" href="#" aria-disabled="true" target="_blank" rel="noopener">Utiliser plutôt GitHub</a>
  </div>

  <p id="submission-github-note" class="submission-github-note" role="note" hidden></p>
  <div id="submission-result" class="submission-result" role="status" aria-live="polite" tabindex="-1"></div>
</form>

<details class="submission-alternatives">
  <summary>Autres façons de nous joindre</summary>
  <p><a href="https://github.com/MeshCore-ca/MeshCore-Canada/issues/new?template=community_idea.yml&amp;source_page=https%3A%2F%2Fmeshcore.ca%2Ffr%2Fsubmit-idea%2F" target="_blank" rel="noopener">Formulaire GitHub</a> (compte requis) · <a href="https://forum.meshcore.ca/" target="_blank" rel="noopener">Forum communautaire</a> · <a href="https://discord.gg/BESFVMt7yk" target="_blank" rel="noopener">Discord</a></p>
</details>

## Et ensuite?

L’équipe de maintenance examinera le billet et répondra directement sur GitHub.
