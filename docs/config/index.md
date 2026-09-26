---
title: Set up repeater scopes
description: Choose IATA regions, city or edge repeater mode, and firmware-specific commands.
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
  - assets/regions/regions.css?v=20260926-1
page_scripts:
  - assets/javascripts/place-search.js?v=20260925-2
  - assets/javascripts/radio-profiles.js?v=20260904-1
  - assets/regions/modules/configurator-support.js?v=20260925-1
  - assets/regions/modules/iata-scopes.js?v=20260926-1
  - assets/regions/modules/scope-migration.js?v=20260925-2
  - assets/regions/regions.js?v=20260926-4
hide:
  - navigation
  - toc
---
# Set up repeater scopes

Choose the IATA regions this repeater serves. City repeaters allow
unscoped messages; edge repeaters block them. Review existing regions before
applying a new profile.

<div data-mcc-regions="config" data-mcc-root="./"></div>

<noscript>JavaScript is required. [Read the region standard](standard.md).</noscript>

<small>[Region standard](standard.md) · [Data sources](../assets/regions/NOTICE.txt) · [Share feedback](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/46)</small>
