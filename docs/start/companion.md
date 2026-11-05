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
last_reviewed: 2026-11-02
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
    Repeaters set up with the [meshcore.ca setup tool](../config/index.md) pass messages
    on by scope. Edge repeaters don't pass on messages that have no scope, so
    without a default scope your messages may not reach beyond your own area.

    - **Ontario or Québec:** use `onqc`.
    - **Elsewhere:** use your province's code, such as `ns` or `bc`, unless
      your community has agreed on something else.

### Set it in the MeshCore app {#set-your-default-scope}

You need the MeshCore app, version 1.43 or newer. The screenshots use `onqc`;
type your own scope if you are elsewhere.

1. Connect your companion to the MeshCore app and tap the **settings cog** in the top right.

    [![MeshCore app contacts list with the settings cog at the top right](../assets/images/onqc-scopes/companion-01-connected.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-01-connected.webp)

2. Scroll down to **Network Settings** and tap **Default Region Scope**.

    [![Settings screen with Network Settings and Default Region Scope](../assets/images/onqc-scopes/companion-02-settings.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-02-settings.webp)

3. If your scope is not listed, tap **Add Region**, or the **+** at the top right.

    [![Select Region screen with no regions and an Add Region button](../assets/images/onqc-scopes/companion-03-select-region.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-03-select-region.webp)

4. Type your scope, all lowercase, and tap the **checkmark** in the top right.

    [![Add Region screen with onqc typed in](../assets/images/onqc-scopes/companion-04-add-region.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-04-add-region.webp)

5. Tap your scope to select it.

    [![Select Region screen with onqc listed](../assets/images/onqc-scopes/companion-05-pick-onqc.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-05-pick-onqc.webp)

6. Default Region Scope now shows your scope. Tap the **checkmark** in the top right. It spins while saving, then **Settings Saved!** pops up.

    [![Settings showing onqc as the default region scope and a Settings Saved message](../assets/images/onqc-scopes/companion-06-saved.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-06-saved.webp)

Find your city code on the [Find your zone](../config/map.md) page. In Ontario and Québec, also use `onqc` for the Public channel and your city scope, such as `yow`, for test channels: open the channel, tap **⋮** and choose **Set Region Scope**. Leave `can` and `na` for future use.

Bot and MeshMapper operators follow the [bot and MeshMapper instructions](../config/guide.md#bots-and-meshmapper).

[How repeaters work](../config/guide.md#companions) explains scopes, with examples. Scopes do not change your radio settings.

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
