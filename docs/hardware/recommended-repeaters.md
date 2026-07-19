---
title: Choose a repeater path
description: Compare a pre-built repeater with the 300 mW and 1 W community build paths as complete systems.
audience:
  - repeater-builder
  - network-operator
task: choose-repeater
scope: canada-baseline
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-20 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css
---

# Choose a Repeater Path

Plan a complete, recoverable repeater system. The radio board alone is not a deployable repeater.

<div class="mc-guide-status" data-status="draft" markdown>

**Draft product and build guidance.** These paths were migrated from Ottawa community notes. Exact hardware revisions, electrical limits, firmware targets, prices, climate suitability, and performance have not all been independently reverified.

</div>

## Choose a repeater path

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Pre-built solar enclosure</h3>
    <p>Less mechanical assembly, but the listing may omit batteries, pigtail, or antenna.</p>
    <p><strong>Best fit:</strong> an operator who will verify every included part and keep USB recovery access.</p>
    <a class="md-button" href="#pre-built-system-lead">Review the system lead</a>
  </section>
  <section class="mc-decision-card">
    <h3>300 mW community build</h3>
    <p>The simpler of the two documented DIY paths, using a RAK Unify enclosure and RAK WisBlock notes.</p>
    <p><strong>Best fit:</strong> an experienced builder willing to review the draft BOM and electrical path.</p>
    <a class="md-button" href="../repeater-solar-300mw-diy-build/">Open the draft build</a>
  </section>
  <section class="mc-decision-card">
    <h3>1 W experimental build</h3>
    <p>A specialized Ottawa backbone experiment with more parts, power, filtering, fabrication, and unverified optional telemetry.</p>
    <p><strong>Best fit:</strong> a reviewed network need and a builder able to validate every electrical and firmware detail.</p>
    <a class="md-button" href="../repeater-solar-1w-diy-build/">Review the experimental build</a>
  </section>
</div>

!!! tip "Start with the network need, not transmit power"
    Site, height, antenna system, feed-line loss, local noise, neighbouring regions, power budget, and maintenance access all affect a repeater. Coordinate with the local community before selecting a high-power or long-reach path.

## Compare the complete systems

<div class="mc-table-wrap" markdown>

| Path | Power system | Enclosure / mount | Antenna path | Remote management | Skill | Evidence here |
|---|---|---|---|---|---|---|
| SenseCAP Solar Node P1 lead | Listing-specific solar and battery bundle; verify exact contents | Vendor enclosure; verify revision, weather claim, and mount | Prior notes call for an external antenna and RP-SMA-to-N pigtail | Depends on exact supported board/firmware | Intermediate | Product and community leads only |
| 300 mW community build | Solar enclosure and protected battery notes | RAK Unify enclosure plus site-specific mount | External 915 MHz antenna and pigtail | Confirm current repeater firmware and access path | Intermediate | Legacy Ottawa build dated 2026-01-01; no attached test record |
| 1 W experimental build | Separate panel, manager, battery protection, and high-power radio notes | Fabricated junction-box system | External antenna, feed line, and filter notes | Confirm current repeater firmware and recovery | Advanced | Ottawa experiment dated 2026-01-01; optional telemetry unverified |

</div>

## Pre-built system lead

The previous guide described one SenseCAP Solar Node P1 configuration as **four separate purchases**. Treat them as a system checklist, not four independent repeater recommendations.

<div class="mc-table-wrap" markdown>

| Required system item | Legacy product lead | Detail to verify | Source |
|---|---|---|---|
| Solar node | SenseCAP Solar Node P1 without GPS and battery | Exact Canadian-band revision, board, firmware target, enclosure rating, and included accessories | [RobotShop Canada](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery) |
| Batteries | Four button-top 18650 cells | Chemistry, protection, capacity, temperature, charger compatibility, and vendor instructions | [Motion Power & Witt Supply Co.](https://mpandw.ca/products/button-top-eve-35v-house-made) |
| Antenna | External 915 MHz lead | Band, connector, mount, and complete feed line | [Amazon Canada](https://www.amazon.ca/dp/B08H8J6ZV6) |
| Pigtail | RP-SMA to N-type, legacy note says Type 2 / 30 cm | Connector polarity, gender, loss, length, weather seal, and current listing option | [AliExpress](https://www.aliexpress.com/item/1005004652556159.html) |

</div>

<p class="mc-table-note">No price snapshot is shown because the legacy page did not record a complete-system price date. Recalculate the full system from current sources.</p>

## Before building or buying

<ul class="mc-checklist">
  <li>The exact radio board appears in the current official MeshCore flasher for the repeater role.</li>
  <li>The radio and antenna are for the Canadian 902–928 MHz band.</li>
  <li>The full power chain follows manufacturer limits and uses documented protection.</li>
  <li>The antenna is attached before the radio can transmit.</li>
  <li>Property permission, structural review, weather loads, cable routing, and electrical hazards are addressed.</li>
  <li>The repeater can be recovered by USB after installation.</li>
  <li>The local region and settings are confirmed in the repeater configurator.</li>
  <li>A bench commissioning record and maintenance interval will be stored with the site record.</li>
</ul>

## Firmware and bootloader gate

If the chosen board is nRF52-based, read the board-specific [bootloader decision and USB flashing guide](../meshcore/flash-repeater.md#nrf52-bootloader-decision) before relying on over-the-air recovery. Do not copy a bootloader file from another board example.

## Commission before mounting

A completed repeater should remain on the bench until it survives a reboot, retains its settings, sends an advert received by a nearby companion, passes a local routing test, and can still be recovered over USB. Then use the [mounting safety checklist](repeater-mounting-options.md).

## Human review required

A hardware maintainer must attach dated product specifications, electrical review, firmware compatibility, and repeatable commissioning evidence before these paths can be labelled verified.

## Next step

- [Review the 300 mW draft build](repeater-solar-300mw-diy-build.md)
- [Review the experimental 1 W build](repeater-solar-1w-diy-build.md)
- [Flash and bench-test a repeater](../meshcore/flash-repeater.md)
