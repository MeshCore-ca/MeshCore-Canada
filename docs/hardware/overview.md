---
title: Choose MeshCore hardware
description: Choose a companion, repeater, antenna, or build option and confirm compatibility before buying.
audience:
  - newcomer
  - node-builder
task: choose-hardware
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choose MeshCore hardware

Choose what the device will do, then confirm the exact board and firmware target in the [official MeshCore flasher](https://meshcore.io/flasher) before buying.

<div class="mc-guide-status" data-status="draft" markdown>

**Check before buying.** Product revisions and firmware support change. Treat the linked devices as options to compare, not compatibility guarantees.

</div>

## Choose a device type

<div class="mc-device-chooser">
  <section class="mc-decision-card">
    <h3>Personal companion</h3>
    <p>Use this to send and receive messages. Most companions pair with a phone; some have their own screen and controls.</p>
    <a class="md-button md-button--primary" href="../recommended-companions/">Choose a companion</a>
  </section>
  <section class="mc-decision-card">
    <h3>Repeater</h3>
    <p>Use this to improve coverage. Plan the radio, power, antenna, enclosure, mount, and recovery as one system.</p>
    <a class="md-button" href="../recommended-repeaters/">Plan a repeater</a>
  </section>
  <section class="mc-decision-card">
    <h3>Antenna and cable</h3>
    <p>Match the radio band and connector before ordering. SMA and RP-SMA can look similar and are not interchangeable.</p>
    <a class="md-button" href="../recommended-antenna/">Choose an antenna</a>
  </section>
  <section class="mc-decision-card">
    <h3>Room server</h3>
    <p>Use this to host a persistent room. Choose a supported board, continuous power, and a secure administration plan.</p>
    <a class="md-button" href="../../meshcore/flash-room-server/">Set up a room server</a>
  </section>
</div>

## Before you buy

<ul class="mc-checklist">
  <li>The exact model appears for the intended role in the current official MeshCore flasher.</li>
  <li>The radio is a Canadian 902–928 MHz model.</li>
  <li>The antenna, pigtail, and feed-line connectors match exactly. SMA and RP-SMA are not interchangeable.</li>
  <li>The manufacturer supports the battery, charger, enclosure, and temperature range for the planned use.</li>
  <li>You have a known-good data USB cable and a practical way to recover the device physically.</li>
  <li>Current manufacturer documentation supports every specification that matters to the purchase.</li>
</ul>

## Continue setup

After choosing a supported device, follow the matching setup guide:

- [Flash a companion](../meshcore/flash-companion.md)
- [Flash and bench-test a repeater](../meshcore/flash-repeater.md)
- [Flash a room server](../meshcore/flash-room-server.md)

Found an outdated product or compatibility detail? [Share the correction](../submit-idea.md) and include the manufacturer source and date you checked it.
