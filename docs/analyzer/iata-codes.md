---
title: Find an observer location code
description: Search the Canadian quick list for the real three-letter airport code nearest to an observer.
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
  - assets/styles/analyzer.css
page_scripts:
  - assets/javascripts/analyzer-location-codes.js
---

# Find an observer location code

An observer uses a real three-letter airport code as a broad location label. It does not define a MeshCore region boundary.

Use the nearest sensible code for the observer's actual area. Use the same code in every broker entry.

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

If the nearest real airport code is missing:

1. verify it against a reliable airport source;
2. type the three-letter code into a method that accepts free text; and
3. ask MeshCore Canada to add the friendly place name.

Do not use `CAN` for Canada; it is an airport code for Guangzhou. Do not use placeholders such as `XXX` or `HOME`.

Return to [Choose an observer method](intro.md).
