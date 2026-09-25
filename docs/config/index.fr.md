---
title: Configurer les portées d’un répéteur
description: Choisissez les régions IATA, le mode ville ou bordure et les commandes adaptées au micrologiciel.
audience:
  - repeater-operator
task: configure-repeater-regions
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-09-25
review_by: 2027-03-24
tested_with:
  region_catalog: meshcore-canada-iata-scopes-v1
difficulty: intermediate
estimated_time: 5-10 minutes
page_styles:
  - assets/regions/regions.css?v=20260925-3
page_scripts:
  - assets/javascripts/place-search.js?v=20260925-2
  - assets/javascripts/radio-profiles.js?v=20260904-1
  - assets/regions/modules/configurator-support.js?v=20260925-1
  - assets/regions/modules/iata-scopes.js?v=20260925-4
  - assets/regions/modules/scope-migration.js?v=20260925-2
  - assets/regions/regions.js?v=20260925-4
hide:
  - navigation
  - toc
---
# Configurer les portées d’un répéteur

Choisissez les régions IATA desservies par ce répéteur. Un répéteur de ville
laisse passer les messages sans portée; un répéteur de bordure les bloque.
Vérifiez les anciennes régions avant d’appliquer un nouveau profil.

<div data-mcc-regions="config" data-mcc-root="./"></div>

<noscript>JavaScript est requis. [Consultez la norme sur les régions](standard.md).</noscript>

<small>[Norme sur les régions](standard.md) · [Sources de données](../assets/regions/NOTICE.txt) · [Partager vos commentaires](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/46)</small>
