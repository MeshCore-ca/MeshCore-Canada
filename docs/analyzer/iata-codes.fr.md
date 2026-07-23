---
title: Trouver le code d’emplacement d’un observateur
description: Trouvez, dans notre liste canadienne, le code à trois lettres de l’aéroport le plus proche de votre observateur.
audience:
  - observer-operators
task: choose-location-code
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: beginner
estimated_time: 3 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-location-codes.js?v=20260722-2
---

# Trouver le code d’emplacement d’un observateur

Un observateur indique sa zone générale avec le code à trois lettres d’un
aéroport réel. Ce code ne définit pas les limites d’une région MeshCore.

Choisissez le code de l’aéroport le plus proche de l’observateur. Utilisez le
même code dans chaque entrée du courtier.

<div class="mc-location-tool" id="location-code-tool" data-source="../location-codes.json">
  <div class="mc-location-controls">
    <label for="location-code-search">
      <strong>Rechercher par code ou par lieu</strong>
      <input id="location-code-search" type="search" autocomplete="off" placeholder="YKF ou Waterloo">
    </label>
    <label for="location-code-province">
      <strong>Province ou territoire</strong>
      <select id="location-code-province">
        <option value="">Partout au Canada</option>
      </select>
    </label>
  </div>
  <p class="mc-location-status" id="location-code-status" role="status">Chargement des codes d’emplacement…</p>
  <div class="mc-location-table-wrap">
    <table class="mc-location-table">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Lieu</th>
          <th scope="col">Province ou territoire</th>
        </tr>
      </thead>
      <tbody id="location-code-results"></tbody>
    </table>
  </div>
</div>

## À propos de cette liste

Les [données de référence des codes d’emplacement](location-codes.json)
alimentent l’outil de recherche et les suggestions du générateur de commandes.
Il s’agit d’une courte liste canadienne organisée pour ce site, et non d’un
registre officiel complet des codes d’aéroport.

Si le code de l’aéroport le plus proche n’y figure pas :

1. confirmez-le auprès d’une source aéroportuaire fiable;
2. entrez le code à trois lettres dans une méthode qui accepte du texte libre;
3. demandez à MeshCore Canada d’ajouter ce lieu à la liste.

N’utilisez pas `CAN` pour représenter le Canada : il s’agit du code d’un
aéroport de Guangzhou. N’utilisez pas non plus de valeurs temporaires comme
`XXX` ou `HOME`.

Retournez à [Choisir une méthode d’observation](intro.md).
