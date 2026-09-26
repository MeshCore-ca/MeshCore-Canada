---
title: Find an observer location code
description: Match your observer location code to its IATA region.
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

# Find an observer location code

Use the code shown by the [IATA region map](../config/map.md) for your observer's location. The map identifies published MeshMapper zones and MeshCore Canada starter regions; distance to an airport does not determine the code.

Observer settings use uppercase codes such as `YOW`; on-air scopes use lowercase names such as `yow`. Use the same observer code in every broker entry. Coordinate changes to an existing observer with its operator.

If the map has no assigned region at your location, ask your community which code to use. The quick list below is a reference, not a boundary lookup.

<div class="mc-location-tool" id="location-code-tool" data-source="../location-codes.json">
  <div class="mc-location-controls">
    <label for="location-code-search">
      <strong>Search by code or place</strong>
      <input id="location-code-search" type="search" autocomplete="off" placeholder="YKF or Waterloo">
    </label>
    <label for="location-code-province">
      <strong>Province or territory</strong>
      <select id="location-code-province">
        <option value="">All of Canada</option>
      </select>
    </label>
  </div>
  <p class="mc-location-status" id="location-code-status" role="status">Loading location codes…</p>
  <div class="mc-location-table-wrap">
    <table class="mc-location-table">
      <thead>
        <tr>
          <th scope="col">Code</th>
          <th scope="col">Place</th>
          <th scope="col">Province or territory</th>
        </tr>
      </thead>
      <tbody id="location-code-results"></tbody>
    </table>
  </div>
</div>

## About this list

The [canonical location-code data](location-codes.json) generates the search tool and the command-builder suggestions. It is a curated Canadian quick list, not a complete official airport-code registry.

If your community's code is missing:

1. confirm it with the community and MeshMapper;
2. type the three-letter code into a method that accepts free text; and
3. ask MeshCore Canada to add the friendly place name.

Do not use `CAN` for an observer in Canada; it is an airport code for Guangzhou. The reserved on-air scope `can` is a separate setting. Do not use placeholders such as `XXX` or `HOME`.

Return to [Choose an observer method](intro.md).
