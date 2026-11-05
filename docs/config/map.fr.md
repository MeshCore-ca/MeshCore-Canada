---
title: Trouver votre zone
description: Découvrez dans quelle zone (code IATA) se trouve un endroit, et s’il s’agit d’une zone MeshMapper ou d’une zone provisoire.
audience:
  - meshcore-user
  - repeater-operator
  - region-maintainer
task: find-region
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-11-05
review_by: 2027-05-05
evidence: tests/browser/zone-map.spec.mjs
difficulty: beginner
page_preconnects:
  - https://tile.openstreetmap.org
page_preloads:
  - assets/regions/vendor/leaflet/leaflet.js
  - assets/regions/vendor/leaflet/leaflet.css
page_styles:
  - assets/setup/zone-map.css?v=20261105-2
page_scripts:
  - assets/regions/modules/iata-scopes.js?v=20261105-1
  - assets/javascripts/place-search.js?v=20261105-1
  - assets/setup/setup-flow.js?v=20261105-1
  - assets/setup/setup-place.js?v=20261105-1
  - assets/setup/zone-map.js?v=20261105-3
hide:
  - toc
---

# Trouver votre zone

Découvrez dans quelle zone (code IATA) se trouve un endroit, et s’il s’agit d’une zone MeshMapper ou d’une zone provisoire.

<div data-zone-map></div>

<noscript markdown="span">Cette page a besoin de JavaScript. [Comprendre les répéteurs](guide.md#scopes-and-regions) explique les zones.</noscript>

<small>[Comprendre les zones](guide.md#scopes-and-regions) · [Télécharger les tracés des zones](../assets/regions/iata-boundaries.geojson){ download="iata-boundaries.geojson" } · [Sources de données](../assets/regions/NOTICE.txt)</small>
