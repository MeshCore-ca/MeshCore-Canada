---
title: Start with a room server
description: Prepare, configure, and verify a persistent MeshCore room server for a Canadian community.
audience:
  - room-server-operator
task: start-room-server
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: 20-30 minutes
destructive: false
requires:
  - supported-room-server
  - data-capable-usb-cable
---

# Start with a room server

Outcome: a persistent room that a companion can discover and enter with the
guest credentials.

## Understand the role

A room server keeps a shared room available. It is not a replacement for a
repeater; use a repeater when the goal is routing and coverage.

## Before you start

- Confirm the flasher offers room-server firmware for the device.
- Decide who will maintain the room and retain recovery access.
- Record any identity or settings you need before following an erase step.
- Prepare separate guest and administrator credentials.

## What this path changes

The linked guide replaces the device firmware and sets the room-server
identity, access credentials, and radio settings.

<section class="mc-start-progress" data-mc-progress-page="room-server" aria-labelledby="room-server-progress-title">
  <h2 id="room-server-progress-title">Your setup path</h2>
  <p>Checks are saved only in this browser.</p>
  <ol>
    <li><label><input id="room-server-progress-understand" type="checkbox" data-mc-progress> Understand the room-server role</label></li>
    <li><label><input id="room-server-progress-hardware" type="checkbox" data-mc-progress> Confirm compatible hardware</label></li>
    <li><label><input id="room-server-progress-prepare" type="checkbox" data-mc-progress> Back up and prepare</label></li>
    <li><label><input id="room-server-progress-flash" type="checkbox" data-mc-progress> Follow the flashing guide</label></li>
    <li><label><input id="room-server-progress-configure" type="checkbox" data-mc-progress> Apply access and local settings</label></li>
    <li><label><input id="room-server-progress-verify-local" type="checkbox" data-mc-progress> Verify the room server nearby</label></li>
    <li><label><input id="room-server-progress-verify-community" type="checkbox" data-mc-progress> Verify discovery and guest access</label></li>
  </ol>
</section>

## Flash the room server

Follow [Flash and configure a room server](../meshcore/flash-room-server.md).
Use that guide for device selection, flashing, access setup, and recovery.

<!-- HUMAN REVIEW REQUIRED: Firmware maintainers must approve the linked room
server compatibility, credential, flashing, and recovery guidance before
launch. -->

## Apply Canada or local settings

Use **USA/Canada (Recommended)** with the **3-byte** path setting unless your
local community publishes an override.

!!! warning "Match your local mesh"
    Check the [community directory](../provinces/index.md). If your community
    publishes different settings, use those settings instead.

Keep administrator credentials private. Share only the guest access
information intended for room users.

## Verify success

Your room-server path is complete when:

1. a nearby companion discovers its advert;
2. the companion can enter with the guest credentials; and
3. the administrator can still recover and maintain it.

Use the [room-server verification checklist](verify.md#room-server).

## Operate and maintain

Record who maintains the room and how users get support. Recheck discovery and
guest access after firmware, credential, or radio-setting changes.

## Next step

Ask a nearby community member to test the room from a second companion. If
discovery or access fails, [get help](get-help.md).
