---
title: Plan a repeater mount
description: Compare community mounting examples while prioritizing permission, structural safety, weather, cable routing, and inspection.
audience:
  - repeater-builder
  - site-owner
task: plan-repeater-mount
scope: canada-baseline
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: advanced
estimated_time: site dependent
destructive: false
requires:
  - property-permission
  - site-specific-safety-review
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Plan a Repeater Mount

Use these community examples to discuss a site. They are not engineered plans for a particular building, mast, climate, or property.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft installation reference.** The examples have not been reviewed for your structure, wind, ice, snow, lightning exposure, grounding, electrical clearance, roof access, or local requirements.

</div>

!!! danger "Antenna height never overrides safety"
    Do not work near overhead electrical lines or on an unsafe roof, ladder, mast, chimney, gutter, or vent. If the attachment, load, grounding, weather exposure, or access plan is uncertain, stop and use a qualified local installer.

## Before you choose a mount

<ul class="mc-checklist">
  <li>The property owner and any required authority approve the location and cable route.</li>
  <li>A qualified person has addressed structure, wind, ice, snow, corrosion, electrical clearance, lightning/grounding context, and safe access.</li>
  <li>The repeater passed its bench commissioning test and remains recoverable.</li>
  <li>The antenna, enclosure, feed line, connectors, strain relief, and drip paths are planned as one system.</li>
  <li>An inspection and removal plan is recorded before installation.</li>
</ul>

## What this installation changes

A fixed mount adds load and penetrations or clamps to a property, exposes equipment and cables to weather, and can make physical recovery harder. Record who owns the site, who may access it, and how the installation will be inspected and removed.

## Community examples

### Pole and clamp

A pole or purpose-built mast can provide a defined cable route and mounting point. Every pole section, clamp, anchor, structure, and load still needs site-specific review.

Community purchasing and design leads:

- [Adjustable pole mount](https://a.co/d/5U5cT4m)
- [Pole clamp option 1](https://www.aliexpress.com/item/1005004943447000.html)
- [RAKwireless enclosure mounting guide](https://docs.rakwireless.com/product-categories/wisblock/rakbox-uo180x130x60/installation-guide/#mounting-guide)
- [Pole clamp option 2](https://www.aliexpress.com/item/1005004943650198.html)
- [Princess Auto 4 ft army tent pole](https://www.princessauto.com/en/4-ft-army-tent-pole/product/PA0009280777)
- [3/4 × 36-inch steel tube](https://www.homedepot.ca/product/paulin-3-4-x-36-inch-round-steel-tube/1000126774)

Stéphane P shared a printable Alfa antenna mount: [download the STL](https://drive.google.com/file/d/1wIU9kLxolzM9vPUB35ETY1sCPLGvtfFu/view?usp=share_link).

![A 3D-printed Alfa antenna mount attached to a pole](images/PoleMount.jpg){ .mc-build-photo loading=lazy }

![A community example of a repeater pole attached near a chimney](images/ChimneyMount.jpg){ .mc-build-photo loading=lazy }

A chimney installation requires specific review of the chimney, structure, heat, clearances, fasteners, weather, and safe access. The photograph is not an instruction to copy the attachment.

### Gutter-mounted community example

Aussiemandias shared a printable gutter mount: [download the STL](https://drive.proton.me/urls/A0P57SRHT0#voPRasptRVbW).

![A RAK Unify enclosure installed with a community-designed gutter mount](images/RAKUnify_GutterMounted.jpeg){ .mc-build-photo loading=lazy }

A gutter is not automatically structural. Inspect the gutter, fascia, fasteners, drainage, ice/snow loads, wind, cable route, and access before considering this approach.

### Vent-pipe extension community example

The legacy note described a 3 ft, 3-inch ABS extension, ABS cement on one side, and self-tapping screws on the house side. Do not reproduce that detail without confirming the existing vent, building, material compatibility, code implications, and added load with a qualified person.

![A community example of a repeater mounted on an ABS vent-pipe extension](images/VentPipeExtension.jpg){ .mc-build-photo loading=lazy }

## Installation Checklist

<ul class="mc-checklist">
  <li>Permission, safe access, electrical clearance, and site-specific review are documented.</li>
  <li>Mount, fasteners, structure, and cable route match the reviewed plan.</li>
  <li>Outdoor hardware and dissimilar metals are addressed for local conditions.</li>
  <li>Cables have strain relief, bend protection, a drip path, and sealed entries.</li>
  <li>The enclosure can vent as designed and does not collect water.</li>
  <li>The antenna is attached before the radio can transmit.</li>
  <li>Removal and physical USB recovery remain practical.</li>
</ul>

## Expected result and verification

From a safe position, inspect the complete installation for movement, cable strain, loose hardware, blocked drainage, and water paths. Then confirm the repeater reconnects, retains its settings, sends an advert received locally, and passes the planned message-routing check.

## Recovery and removal

If anything moves, leaks, loosens, corrodes, changes electrically, or fails its radio check, stop using the site. Disconnect power when safe, remove or secure the equipment through the approved access plan, and return it to the bench. Do not troubleshoot energized equipment at height.

## Maintenance record

<div class="mc-maintenance-record" markdown>

No Canada-wide inspection interval has been approved. Before deployment, record a site-specific interval and the conditions that trigger an extra inspection, such as severe weather, nearby work, water entry, or changed radio behaviour.

Record each inspection date, inspector, photographs, hardware/cable condition, enclosure condition, radio verification, corrective work, and next due date.

</div>

## Next step

Return to the [repeater choice](recommended-repeaters.md) or [flash and bench-test the repeater](../meshcore/flash-repeater.md) before installing it.
