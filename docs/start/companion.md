---
title: Start with a companion
description: Prepare, configure, and verify a personal MeshCore companion for a Canadian community.
audience:
  - first-time-user
  - companion-owner
task: start-companion
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 20-30 minutes
destructive: false
requires:
  - supported-companion
  - data-capable-usb-cable
---

# Start with a companion

A companion is a personal messaging device. It does not route traffic for
other users. Most pair with an app; some have their own screen and controls.

## Before you start

- Check the [recommended companion options](../hardware/recommended-companions.md).
- Confirm the detailed flashing guide lists your device.
- Use a data-capable USB cable and a supported browser.
- Record any identity or settings you need before following an erase step.

## Know what flashing changes

The linked flashing guide replaces the device firmware and configures it as a
companion. Stop before erasing if you cannot recover information you need.

<section class="mc-start-progress" data-mc-progress-page="companion" aria-labelledby="companion-progress-title">
  <h2 id="companion-progress-title">Setup checklist</h2>
  <p>Checks are saved only in this browser.</p>
  <ol>
    <li><label><input id="companion-progress-hardware" type="checkbox" data-mc-progress> Confirm compatible hardware</label></li>
    <li><label><input id="companion-progress-prepare" type="checkbox" data-mc-progress> Back up and prepare</label></li>
    <li><label><input id="companion-progress-flash" type="checkbox" data-mc-progress> Follow the flashing guide</label></li>
    <li><label><input id="companion-progress-configure" type="checkbox" data-mc-progress> Apply Canada or local settings</label></li>
    <li><label><input id="companion-progress-verify-local" type="checkbox" data-mc-progress> Check the device nearby</label></li>
    <li><label><input id="companion-progress-verify-community" type="checkbox" data-mc-progress> Test with another mesh user</label></li>
  </ol>
</section>

## Flash the companion

Follow [Flash and configure a companion](../meshcore/flash-companion.md). Use
that guide for device selection, browser connection, flashing, and recovery
steps.

## Use the right radio settings

Use **USA/Canada (Recommended)** with the **3-byte** path setting unless your
community lists different settings.

!!! warning "Match your local mesh"
    Check the [community directory](../provinces/index.md). If your community
    publishes different settings, use those settings instead.

Reboot after changing the radio settings, then send an advert.

## Make sure it works

The companion is ready when:

1. the device shows the Canada settings or your community's settings; and
2. a nearby known-good device or community member can see its advert.

Use the [companion verification checklist](verify.md#companion).

## What's next

Keep the local settings recorded and check them again after firmware changes.
Use [MeshCore how-to guides](../meshcore/general-howto.md) for common messaging
tasks. [Find your community](../provinces/index.md), then exchange a test message
with a nearby user. If nobody can see the advert, [get help](get-help.md).
