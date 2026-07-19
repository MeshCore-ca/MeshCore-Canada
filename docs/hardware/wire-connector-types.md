---
title: Wire connector reference status
description: Review an incomplete connector-name inventory and the checks required before ordering, crimping, or applying power.
audience:
  - repeater-builder
  - hardware-reviewer
task: identify-wire-connector
scope: ottawa-field-practice
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: advanced
estimated_time: 3-5 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css
---

# Wire Connector Reference

This incomplete inventory records connector names seen in community build notes. It is not a compatibility or wiring guide.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft reference — verify before wiring.** A similar shape or pitch does not prove the series, mating pair, keying, polarity, pinout, current rating, wire gauge, or crimp compatibility.

</div>

<div class="mc-table-wrap" markdown>

| Connector name in prior notes | Pitch recorded | Device/use recorded | Evidence missing |
|---|---:|---|---|
| Molex PicoBlade 1×02P | 1.25 mm | Ikoka Stick | Manufacturer part numbers, mating pair, pinout, polarity, current, tooling, photograph |
| JST ZHR-2 | 1.5 mm | RAK19007 solar connector | Manufacturer part numbers, mating pair, pinout, polarity, current, tooling, photograph |
| JST PHR-2 | 2.0 mm | RAK19007 battery connector | Manufacturer part numbers, mating pair, pinout, polarity, current, tooling, photograph |

</div>

## Before using a connector name

<ul class="mc-checklist">
  <li>Find the exact connector and mating part in the device schematic or manufacturer documentation.</li>
  <li>Confirm the keying, contact gender, pitch, wire gauge, current, voltage, temperature, and environment ratings.</li>
  <li>Confirm polarity and pinout from documentation, then verify with equipment disconnected.</li>
  <li>Use the specified contacts and crimp tooling; do not force a similar-looking housing.</li>
  <li>Stop if any identity, rating, pinout, or polarity detail is uncertain.</li>
</ul>

!!! danger "A connector that fits can still be wrong"
    Reversed polarity, a mismatched contact system, or an unsuitable wire/connector rating can damage equipment or create a battery and fire hazard. Do not apply power from this page.

## Human review required

This page needs dated manufacturer sources, photographs, part numbers, mating parts, pinouts, polarity, ratings, tooling, and links from each build step before it becomes an operational reference.

## Next step

Return to the exact [build guide](recommended-repeaters.md) and verify every connector against the hardware revision being assembled.
