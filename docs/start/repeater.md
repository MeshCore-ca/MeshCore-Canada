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
last_reviewed: 2026-10-29
review_by: 2026-12-31
tested_with:
  content_baseline: 7daceca
  review_method: bilingual content and navigation checks, not physical-device testing
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Content and linked setup paths reviewed on 2026-10-29; radio and installation checks remain operator tasks.
difficulty: intermediate
estimated_time: varies by build
destructive: false
requires:
  - supported-repeater
  - data-capable-usb-cable
page_styles:
  - assets/styles/repeater-hash-check.css?v=20260820-1
page_scripts:
  - assets/javascripts/repeater-hash-check.js?v=20261029-1
---

# Start with a repeater

A repeater extends coverage by routing traffic for other users. Because it is
fixed infrastructure, plan its power, antenna, access, and maintenance before
installation.

[Set up a repeater](../config/index.md){ .md-button .md-button--primary }

## Before you start

- Check [recommended repeater options](../hardware/recommended-repeaters.md).
- Agree on the site and settings with the local community.
- Keep physical recovery access while testing.
- Record the current identity and settings before any erase or update.

## Know what setup changes

The setup tool walks you through flashing the repeater firmware, then gives you
the commands that set its radio, name, adverts, and regions. Test on the bench
before a difficult installation.

## Set up the repeater

Open the [repeater setup tool](../config/index.md). It asks a few questions,
then gives you every command to paste, one at a time, with what each one does.

## Use the right radio and region settings

Use **Canada** with the **3-byte** path setting unless your
community lists different settings.

If Canada is not listed, follow the [older-preset instructions](../provinces/index.md#canada-baseline).

!!! warning "Coordinate before installation"
    Check the [community directory](../provinces/index.md). Nearby repeaters
    need matching local settings, and operators should agree on changes that
    affect shared traffic.

The [setup tool](../config/index.md) picks your MeshMapper IATA region from your
town and sets its scopes. Already running with old regions? The tool clears them
first: [How repeaters work](../config/guide.md#old-regions) explains how.

A repeater that regularly hears repeaters in another region is an edge repeater.
Check with nearby operators before you set one up:
[How repeaters work](../config/guide.md#city-or-edge) explains the difference.

<div data-mc-repeater-hash-check></div>

<noscript>JavaScript is required for the live duplicate-ID check. You can also [open the live node directory](https://live.meshcore.ca/?tab=Nodes).</noscript>

## Test it

The repeater is ready to install when:

1. it keeps the intended settings after a reboot;
2. it sends an advert; and
3. a nearby known-good companion receives that advert.

After every reboot, resync the repeater clock before you send the advert. Routing
can continue without a correct clock, but stale advert timing can prevent
companions from accepting a new advert.

Use the [repeater verification checklist](verify.md#repeater).

<section class="mc-start-progress" data-mc-progress-page="repeater" aria-labelledby="repeater-progress-title">
  <h2 id="repeater-progress-title">Setup checklist</h2>
  <p>Checks are saved only in this browser.</p>
  <ol>
    <li><label><input id="repeater-progress-hardware" type="checkbox" data-mc-progress> Confirm compatible hardware and site</label></li>
    <li><label><input id="repeater-progress-prepare" type="checkbox" data-mc-progress> Back up and prepare</label></li>
    <li><label><input id="repeater-progress-flash" type="checkbox" data-mc-progress> Flash it with the setup tool</label></li>
    <li><label><input id="repeater-progress-configure" type="checkbox" data-mc-progress> Apply local and regional settings</label></li>
    <li><label><input id="repeater-progress-verify-local" type="checkbox" data-mc-progress> Bench-check the repeater</label></li>
    <li><label><input id="repeater-progress-verify-community" type="checkbox" data-mc-progress> Test with a nearby companion</label></li>
  </ol>
</section>

## What's next

Keep a record of the site, owner, recovery access, settings, and last
successful check. Recheck it after firmware, antenna, power, or region changes.
For firmware 1.14 or newer, review the coordinated
[loop-detection setting](../config/guide.md#loop-detection) before
changing a community repeater.

Review [antenna](../hardware/recommended-antenna.md) and
[mounting](../hardware/repeater-mounting-options.md) guidance before final
installation. If a check fails, [get help](get-help.md).
