---
title: Solar and battery planning status
description: Understand why a general Canadian solar and battery sizing guide is not yet approved for deployment decisions.
audience:
  - repeater-builder
  - hardware-reviewer
task: assess-repeater-power-guidance
scope: canada-baseline
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: advanced
estimated_time: 3-5 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Solar and Battery Planning

This page preserves the route while a reviewed Canadian power-sizing method is developed.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft — not reviewed for deployment.** Do not use it to choose a battery, solar panel, charger, protection circuit, wiring, or enclosure.

</div>

## Why there is no general calculator yet

Solar and battery sizing depends on measured repeater load, local seasonal conditions, shading, panel orientation, battery chemistry and temperature limits, charger behaviour, protection, wiring losses, enclosure temperature, desired autonomy, and maintenance access. MeshCore Canada has not approved one model that covers those inputs.

!!! danger "Stop before substituting power-system parts"
    Do not improvise or substitute a battery, charger, panel, protection device, connector, or wiring path from a capacity number alone. Follow manufacturer documentation and obtain qualified electrical review for the complete system.

## What a reviewed guide must include

<ul class="mc-checklist">
  <li>A measured load profile for each supported radio, firmware role, and operating mode.</li>
  <li>Dated climate and seasonal assumptions with a stated location and safety margin.</li>
  <li>Battery chemistry, temperature, charging, protection, enclosure, and transport limits.</li>
  <li>Panel, charger, wiring, connector, fuse/protection, and conversion-loss calculations.</li>
  <li>Expected electrical readings and stop limits tied to manufacturer documents.</li>
  <li>Bench test, commissioning, maintenance, failure, and safe recovery procedures.</li>
  <li>A named hardware/electrical reviewer and date-scoped supported component list.</li>
</ul>

## Build-specific records

The two retained community build pages contain their own dated parts and assembly notes. They are not substitutes for a reviewed Canada-wide sizing method:

- [300 mW solar repeater draft](repeater-solar-300mw-diy-build.md)
- [1 W experimental solar repeater](repeater-solar-1w-diy-build.md)

## Human review required

A hardware reviewer must supply the model, sources, test evidence, supported limits, climate scenarios, and maintenance checks before this page can become operational guidance.

## Next step

If you already have a reviewed power plan, return to [choosing a repeater path](recommended-repeaters.md). Otherwise ask the local community for a domain reviewer before buying parts.
