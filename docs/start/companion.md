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
last_reviewed: 2026-10-29
review_by: 2026-12-31
tested_with:
  content_baseline: 7daceca
  review_method: bilingual content and navigation checks, not physical-device testing
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Content and linked setup paths reviewed on 2026-10-29; radio and installation checks remain operator tasks.
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

[Install and configure a companion](../meshcore/flash-companion.md){ .md-button .md-button--primary }

## Before you start

- Check the [recommended companion options](../hardware/recommended-companions.md).
- Confirm the detailed flashing guide lists your device.
- Use a data-capable USB cable and a supported browser.
- Record any identity or settings you need before following an erase step.

## Know what flashing changes

The linked flashing guide replaces the device firmware and configures it as a
companion. Stop before erasing if you cannot recover information you need.



## Flash the companion

Follow [Flash and configure a companion](../meshcore/flash-companion.md).

## Use the right radio settings

Use **Canada** with the **3-byte** path setting unless your
community lists different settings.

If Canada is not listed, follow the [older-preset instructions](../provinces/index.md#canada-baseline).

!!! warning "Match your local mesh"
    Check the [community directory](../provinces/index.md). If your community
    publishes different settings, use those settings instead.

Reboot after changing the radio settings, then send an advert.

## Choose a scope

!!! note "Set your default scope now"
    Repeaters now use scopes to decide which messages to pass on. A default
    scope on your companion keeps your messages travelling the right distance.

    - **Ontario or Québec:** use `onqc`.
    - **Elsewhere:** use your province's code, such as `ns` or `bc`, unless
      your community has agreed on something else.

To set it, connect your companion to the MeshCore app (version 1.43 or newer), then:

1. Tap the **settings cog** in the top right.
2. Scroll to **Network Settings** and tap **Default Region Scope**.
3. If your scope is not listed, tap **Add Region** (or the **+**), type it in lowercase and tap the checkmark.
4. Tap your scope to select it, then tap the checkmark in the top right. **Settings Saved!** pops up.

Find your city code on the [IATA region map](../config/map.md). In Ontario and Québec, also use `onqc` for the Public channel and your city scope, such as `yow`, for test channels: open the channel, tap **⋮** and choose **Set Region Scope**. Leave `can` and `na` for future use.

Bot and MeshMapper operators follow the [bot and MeshMapper instructions](../proposals/onqc-scopes.md#bots-and-meshmapper).

See the [scope setup guide](../config/standard.md) for app requirements and examples. Scopes do not change your radio settings.

## Test it

The companion is ready when:

1. the device shows the Canada settings or your community's settings; and
2. a nearby known-good device or community member can see its advert.

Use the [companion verification checklist](verify.md#companion).

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

## What's next

Keep the local settings recorded and check them again after firmware changes.
Use [MeshCore how-to guides](../meshcore/general-howto.md) for common messaging
tasks. [Find your community](../provinces/index.md), then exchange a test message
with a nearby user. If nobody can see the advert, [get help](get-help.md).
