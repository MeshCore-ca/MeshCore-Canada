---
title: Choose a repeater
description: The repeater setups Canadian communities run, from a packaged solar unit to two community builds.
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
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choose a repeater

A repeater is a radio, power, an antenna and a mount. These are the setups
Canadian communities run. Talk to your [local community](../provinces/index.md)
about the site before you buy.

## Ready-made

The **SenseCAP Solar Node P1** is a packaged solar unit and needs the least
building. Check the listing for what's included: the battery and antenna may be
separate. [RobotShop Canada](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery)

## Build your own

<div class="mc-decision-grid">
  <section class="mc-decision-card" data-status="draft">
    <h3>300 mW solar repeater</h3>
    <p>A draft RAK-based build with a parts list, assembly stages, bench checks, and maintenance notes.</p>
    <a class="md-button" href="../repeater-solar-300mw-diy-build/">Review the 300 mW build</a>
  </section>
  <section class="mc-decision-card" data-status="draft">
    <h3>1 W solar repeater — Ikoka Stick</h3>
    <p>MrAlders0n’s build guide, with parts, assembly photos, wiring, and optional INA3221 telemetry.</p>
    <a class="md-button" href="../repeater-solar-1w-diy-build/">Read the 1 W build guide</a>
  </section>
</div>

## Before you buy

<ul class="mc-checklist">
  <li>The exact board is listed for repeaters in the <a href="https://meshcore.io/flasher">MeshCore flasher</a>.</li>
  <li>The radio and antenna are the 915 MHz (902–928 MHz) versions, and the connectors match.</li>
  <li>Attach the antenna before you power it on.</li>
  <li>You can still reach the USB port once it's mounted.</li>
</ul>

Check current manufacturer information before you order: product revisions change.

**Next:** [Set up a repeater](../config/index.md) · [Antennas](recommended-antenna.md) · [Mounting a repeater](repeater-mounting-options.md)
