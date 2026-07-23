---
title: Start with a repeater
description: Prepare, configure, and check a MeshCore repeater for a Canadian community.
audience:
  - repeater-builder
  - repeater-operator
task: start-repeater
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: varies by build
destructive: false
requires:
  - supported-repeater
  - data-capable-usb-cable
---

# Start with a repeater

A repeater extends coverage by routing traffic for other users. Because it is
fixed infrastructure, plan its power, antenna, access, and maintenance before
installation.

## Before you start

- Check [recommended repeater options](../hardware/recommended-repeaters.md).
- Agree on the site and settings with the local community.
- Keep physical recovery access while testing.
- Record the current identity and settings before any erase or update.

## Know what flashing changes

The guide installs repeater firmware and sets radio, identity, adverts, and
regional settings. Test on the bench before a difficult installation.

<section class="mc-start-progress" data-mc-progress-page="repeater" aria-labelledby="repeater-progress-title">
  <h2 id="repeater-progress-title">Setup checklist</h2>
  <p>Checks are saved only in this browser.</p>
  <ol>
    <li><label><input id="repeater-progress-hardware" type="checkbox" data-mc-progress> Confirm compatible hardware and site</label></li>
    <li><label><input id="repeater-progress-prepare" type="checkbox" data-mc-progress> Back up and prepare</label></li>
    <li><label><input id="repeater-progress-flash" type="checkbox" data-mc-progress> Follow the flashing guide</label></li>
    <li><label><input id="repeater-progress-configure" type="checkbox" data-mc-progress> Apply local and regional settings</label></li>
    <li><label><input id="repeater-progress-verify-local" type="checkbox" data-mc-progress> Bench-check the repeater</label></li>
    <li><label><input id="repeater-progress-verify-community" type="checkbox" data-mc-progress> Test with a nearby companion</label></li>
  </ol>
</section>

## Flash the repeater

Follow [Flash and configure a repeater](../meshcore/flash-repeater.md). Use the
board-specific decisions, backup guidance, stop conditions, and recovery path
in that guide.

## Use the right radio and region settings

Use **USA/Canada (Recommended)** with the **3-byte** path setting unless your
community lists different settings.

!!! warning "Coordinate before installation"
    Check the [community directory](../provinces/index.md). Nearby repeaters
    need matching local settings, and operators should agree on changes that
    affect shared traffic.

Use the [repeater configurator](../config/index.md) to find the regional
settings and review its commands before applying them.

## Make sure it works

The repeater is ready to install when:

1. it keeps the intended settings after a reboot;
2. it sends an advert; and
3. a nearby known-good companion receives that advert.

Use the [repeater verification checklist](verify.md#repeater).

## What's next

Keep a record of the site, owner, recovery access, settings, and last
successful check. Recheck it after firmware, antenna, power, or region changes.
For firmware 1.14 or newer, review the coordinated
[loop-detection setting](../meshcore/flash-repeater.md#loop-detection) before
changing a community repeater.

Review [antenna](../hardware/recommended-antenna.md) and
[mounting](../hardware/repeater-mounting-options.md) guidance before final
installation. If a check fails, [get help](get-help.md).
