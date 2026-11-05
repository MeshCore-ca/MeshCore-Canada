---
title: Find your zone
description: See which zone (IATA code) a place is in, and whether it's a MeshMapper zone or a placeholder.
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

# Find your zone

See which zone (IATA code) a place is in, and whether it's a MeshMapper zone or a placeholder.

<div data-zone-map></div>

<noscript markdown="span">This page needs JavaScript. [How repeaters work](guide.md#scopes-and-regions) explains zones.</noscript>

<small>[How zones work](guide.md#scopes-and-regions) · [Download zone outlines](../assets/regions/iata-boundaries.geojson){ download="iata-boundaries.geojson" } · [Data sources](../assets/regions/NOTICE.txt)</small>
