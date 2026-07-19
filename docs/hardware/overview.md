---
title: Choose MeshCore hardware
description: Choose a companion, repeater, antenna, or build path without treating local field notes as universal proof.
audience:
  - newcomer
  - node-builder
task: choose-hardware
scope: canada-baseline
status: draft
owner: docs-hardware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css
---

# Choose MeshCore Hardware

Choose the device role first. Then confirm the exact board and firmware target in the current official flasher before buying parts.

<div class="mc-device-hero" markdown>

**Outcome:** leave this page with one device path and a short list of details to verify. Product links are community leads, not guarantees of stock, compatibility, or performance.

</div>

<div class="mc-guide-status" data-status="draft" markdown>

**Draft recommendation set.** The device lists were migrated from Ottawa community notes on July 19, 2026. A hardware maintainer has not yet rechecked every product revision, price, connector, or firmware target.

</div>

## Pick the role you need

<div class="mc-device-chooser">
  <section class="mc-decision-card">
    <h3>Personal companion</h3>
    <p>Use this to send and receive messages. Most companions pair with a phone; some have their own screen and controls.</p>
    <a class="md-button md-button--primary" href="../recommended-companions/">Compare companions</a>
  </section>
  <section class="mc-decision-card">
    <h3>Repeater</h3>
    <p>Use this to improve coverage. Plan the complete system: radio, power, antenna, feed line, enclosure, mount, access, and recovery.</p>
    <a class="md-button" href="../recommended-repeaters/">Compare repeater paths</a>
  </section>
  <section class="mc-decision-card">
    <h3>Antenna and cable</h3>
    <p>Match the radio band and connector before ordering. SMA and RP-SMA can look similar and are not interchangeable.</p>
    <a class="md-button" href="../recommended-antenna/">Check antenna notes</a>
  </section>
  <section class="mc-decision-card">
    <h3>DIY solar build</h3>
    <p>Choose this only if you can verify polarity, electrical limits, weather sealing, safe mounting, and physical recovery.</p>
    <a class="md-button" href="../recommended-repeaters/#choose-a-repeater-path">Choose a build</a>
  </section>
</div>

## Before you buy

<ul class="mc-checklist">
  <li>The exact board appears as the intended role in the current <a href="https://meshcore.io/flasher">official MeshCore web flasher</a>.</li>
  <li>The device is for the Canadian 902–928 MHz band and not a different regional radio band.</li>
  <li>The antenna connector, pigtail, and feed-line connectors match without forcing or improvised adapters.</li>
  <li>The battery, charger, enclosure, and temperature range are supported by their manufacturers for the planned installation.</li>
  <li>You have a known-good data USB cable and a practical way to recover the device physically.</li>
  <li>A dated product page or manufacturer document supports every detail that matters to your purchase.</li>
</ul>

!!! warning "Local field notes are not Canada-wide proof"
    Ottawa purchasing leads and community observations can help form a shortlist. They do not establish nationwide availability, electrical safety, RF performance, firmware support, or suitability for a particular site.

## Continue by task

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Start with a companion</h3>
    <p>Compare phone requirements, controls, connector details, and accessories.</p>
    <a class="md-button" href="../recommended-companions/">Companion guide</a>
  </section>
  <section class="mc-decision-card">
    <h3>Plan a repeater</h3>
    <p>Compare pre-built and DIY paths, then bench-test before mounting.</p>
    <a class="md-button" href="../recommended-repeaters/">Repeater guide</a>
  </section>
  <section class="mc-decision-card">
    <h3>Install safely</h3>
    <p>Review property permission, structural limits, weather, cable routing, and inspection access.</p>
    <a class="md-button" href="../repeater-mounting-options/">Mounting guide</a>
  </section>
</div>

## Local purchasing leads

These Ottawa-area links were in the previous guide. They are retained as purchasing leads only; check stock, specifications, return policy, shipping, and current pricing yourself.

- [Space Hedgehog](https://space-hedgehog.com/)
- [Motion Power & Witt Supply Co.](https://mpandw.ca/)

## Next step

After choosing a supported device, follow the matching safe flashing path:

- [Flash a companion](../meshcore/flash-companion.md)
- [Flash and bench-test a repeater](../meshcore/flash-repeater.md)
- [Flash a room server](../meshcore/flash-room-server.md)

Found an outdated product or compatibility detail? [Share the correction](../submit-idea.md) and include the manufacturer source and date you checked it.
