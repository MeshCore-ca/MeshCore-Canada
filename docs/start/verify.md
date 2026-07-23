---
title: Check a MeshCore setup
description: Check whether a companion, repeater, room server, or observer completed its first working task.
audience:
  - first-time-user
  - meshcore-operator
task: verify-first-success
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
---

# Check your setup

A powered-on device or a connected status does not mean setup is finished. Use
the check for your device below.

Before testing, confirm the device still shows the Canada settings or your
community's settings.

## Companion

1. Reboot after the last radio-setting change.
2. Send an advert.
3. Ask a nearby user with a known-good device to confirm that the advert
   appears.
4. Exchange a test message when another user is available.

!!! success "The companion is ready"
    A nearby known-good device sees the advert, and the two devices can
    exchange a test message.

If the advert is missing, compare radio and path settings before reflashing.

## Repeater

1. Keep the repeater accessible on the bench.
2. Reboot it and confirm the intended settings remain.
3. Send an advert from the repeater.
4. Confirm a nearby known-good companion receives it.
5. Repeat the check after any antenna, power, or installation change.

!!! success "The repeater is ready"
    The repeater retains its settings and a nearby known-good companion
    receives its advert.

Keep it off hard-to-reach spots until the bench check passes.

## Room server

1. Reboot the room server.
2. Send its advert.
3. Confirm a nearby companion discovers it.
4. Enter using the guest credentials.
5. Confirm the administrator still has maintenance access.

!!! success "The room server is ready"
    A companion discovers the room and guest access works without exposing the
    administrator credentials.

## Observer

1. Create nearby mesh activity with a known-good device.
2. Confirm the observer radio is using matching settings.
3. Open [CoreScope Observers](https://live.meshcore.ca/#/observers).
4. Find your observer and check for recent activity.
5. Use [Check your observer](../analyzer/verify.md) for the full health
   checklist.

!!! success "The observer is working"
    Your observer appears in CoreScope and shows recent activity after
    a nearby transmission.

An online broker connection alone is not the final check.

## If a check fails

If the check passes, you're done. If it does not, [get help](get-help.md) and
describe what was missing.
