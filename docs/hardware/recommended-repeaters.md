---
title: Plan a repeater
description: Choose a repeater approach and verify the complete radio, power, antenna, enclosure, and recovery system.
audience:
  - repeater-builder
  - network-operator
task: choose-repeater
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-20 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Plan a repeater

A repeater is more than a radio board. Plan its power, antenna, enclosure,
mount, and a way to reach it if something goes wrong.

<div class="mc-guide-status" data-status="draft" markdown>

**Check the complete system.** Product revisions and firmware support change. Confirm the exact radio, power system, antenna path, enclosure, mount, and recovery method before buying or building.

</div>

## Choose an approach

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Packaged outdoor system</h3>
    <p>Reduces fabrication, but batteries, antenna cables, mounting hardware, or the radio may still be separate.</p>
    <p><strong>Check:</strong> exact contents, radio band, firmware target, connector path, weather rating, and USB access.</p>
    <a class="md-button" href="#outdoor-system-to-compare">Review an example</a>
  </section>
  <section class="mc-decision-card">
    <h3>Custom build</h3>
    <p>Lets you choose each part, but you become responsible for electrical compatibility, weather sealing, mounting, and service access.</p>
    <p><strong>Check:</strong> manufacturer limits, polarity, protection, wiring, thermal conditions, and safe recovery.</p>
    <a class="md-button" href="#community-build-reference">Review the requirements</a>
  </section>
</div>

!!! tip "Start with the network need, not transmit power"
    Site, height, antenna system, feed-line loss, local noise, neighbouring regions, power budget, and maintenance access all affect a repeater. Coordinate with the local community before selecting a high-power or long-reach path.

## Outdoor system to compare

The SenseCAP Solar Node P1 is one packaged enclosure to evaluate. It is not a complete recommendation: confirm every selected option and accessory against current manufacturer documentation.

<div class="mc-table-wrap" markdown>

| System item | What to verify | Source |
|---|---|---|
| SenseCAP Solar Node P1 | Exact Canadian-band model, supported board and repeater target, enclosure rating, included power parts, mount, and USB access | [RobotShop Canada](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery) |
| Battery system | Chemistry, protection, capacity, temperature range, charger compatibility, and installation instructions | Product manufacturer documentation |
| Antenna and cable | 902–928 MHz band, factory connector, cable loss, connector gender and polarity, mount, and weather sealing | [Seeed LoRa antenna guide](https://wiki.seeedstudio.com/lora_antenna_selection_guide/) |

</div>

!!! warning "SMA and RP-SMA are not interchangeable"
    Confirm the factory connector, gender, polarity, cable length and loss, antenna connector, and weather seal as one complete path. Do not order by connector appearance alone.

## Community build reference

The [300 mW solar repeater notes](repeater-solar-300mw-diy-build.md) document one custom approach for experienced builders. They are not a verified bill of materials or a substitute for current product documentation and electrical review.

## Before building or buying

<ul class="mc-checklist">
  <li>The exact radio board appears in the current official MeshCore flasher for the repeater role.</li>
  <li>The radio and antenna are for the Canadian 902–928 MHz band.</li>
  <li>The full power chain follows manufacturer limits and uses documented protection.</li>
  <li>The antenna is attached before the radio can transmit.</li>
  <li>Property permission, structural review, weather loads, cable routing, and electrical hazards are addressed.</li>
  <li>The repeater can be recovered by USB after installation.</li>
  <li>The local region and settings are confirmed in the repeater configurator.</li>
  <li>A bench test and maintenance plan are ready before installation.</li>
</ul>

## Test it on the bench first

A completed repeater should remain on the bench until it survives a reboot, retains its settings, sends an advert received by a nearby companion, passes a local routing test, and can still be recovered over USB. Then use the [mounting safety checklist](repeater-mounting-options.md).

## Continue setup

- [Flash and bench-test a repeater](../meshcore/flash-repeater.md)
- [Choose an antenna and feed line](recommended-antenna.md)
- [Plan a safe mount](repeater-mounting-options.md)
