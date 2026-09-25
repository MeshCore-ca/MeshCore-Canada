---
title: Update a MeshMapper region
description: Request an IATA zone change in MeshMapper, or download drafts saved in the former census-cell editor.
audience:
  - region-maintainer
task: update-meshmapper-region
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2027-03-24
evidence: tests/editor/legacy-draft-export.test.mjs
page_modules:
  - assets/regions/modules/legacy-draft-export.js?v=20260924-1
---

# Region changes now use MeshMapper

MeshCore Canada's map and configurator use the same IATA zones as MeshMapper.
Request new zones or boundary changes there so both tools stay consistent.
The former census-cell editor is retired.

[Open MeshMapper](https://meshmapper.net/){ .md-button .md-button--primary }
[Find your IATA zone](../map.md){ .md-button }

## Saved drafts

If you used the old editor, you can download its drafts from this browser.
Nothing is uploaded or deleted. Treat them as reference material, not approved
MeshMapper boundaries.

<button type="button" class="md-button" data-legacy-draft-export>Download saved drafts</button>
<p data-legacy-draft-status role="status" aria-live="polite"></p>

## Community listings

To change a community's contacts or description, [send a community update](../../submit-idea.md).
That form still works independently of region boundaries.

[Read the IATA scope guide](../standard.md).
