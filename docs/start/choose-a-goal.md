---
title: Choose a MeshCore role
description: Compare companions, repeaters, room servers, and observers by the job you want to do.
audience:
  - newcomer
  - first-time-user
task: choose-device-role
scope: upstream-meshcore
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2027-07-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 2-3 minutes
destructive: false
---

# Choose a MeshCore role

Choose by outcome, not by product name.

| What you want to do | Role | Start |
|---|---|---|
| Send and receive messages | Companion | [Companion path](companion.md) |
| Improve coverage for nearby users | Repeater | [Repeater path](repeater.md) |
| Host a persistent shared room | Room server | [Room-server path](room-server.md) |
| Send network data to public tools | Observer | [Observer path](observer.md) |

## Compare the roles

| Role | Main job | Mobile or fixed | Routes mesh traffic? | Phone or computer |
|---|---|---|---|---|
| Companion | Personal messaging | Usually mobile | No | Usually pairs with a phone; some devices are standalone |
| Repeater | Extend coverage | Fixed | Yes | Needed for setup and maintenance |
| Room server | Keep a shared room available | Usually fixed | Not its primary job | A companion connects to the room |
| Observer | Feed public network tools | Usually fixed | No | Depends on the observer method |

## Still not sure?

Start by reading the [companion path](companion.md) if your goal is personal
messaging. A companion is the role used to take part in conversations; the
other roles operate services for a mesh.

If you already use MeshCore and want to improve the network, choose by the
result:

- choose a [repeater](repeater.md) for coverage;
- choose a [room server](room-server.md) for a persistent room;
- choose an [observer](observer.md) for public network data.

## Before buying or flashing

Check the detailed hardware and firmware guide linked from the role path.
Support varies by device and firmware target.

<!-- HUMAN REVIEW REQUIRED: Firmware and hardware maintainers must verify the
role comparison and linked compatibility guidance before production launch. -->

## Next step

Open one role path. If none fits, [ask the community](get-help.md) before
buying hardware.
