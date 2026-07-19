---
title: Compare MeshCore device roles
description: Compare companions, repeaters, room servers, and observers before choosing a setup path.
audience:
  - newcomer
  - first-time-user
  - mesh-operator
task: compare-meshcore-roles
scope: upstream-meshcore
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2027-01-19
evidence:
  - Existing MeshCore Canada role guidance
  - Current in-repository setup journeys
difficulty: beginner
estimated_time: 3-5 minutes
destructive: false
---

# Compare MeshCore device roles

Choose a role by the job the device will do. Firmware determines the role, so
the same supported board may have different jobs after it is flashed.

## At a glance

| Role | Main job | Usually mobile? | Relays mesh traffic? | Phone or computer | Typical power | Start |
|---|---|---:|---:|---|---|---|
| Companion | Send and receive messages | Yes | No | Usually uses an app; some devices are standalone | Battery or USB | [Set up a companion](../start/companion.md) |
| Repeater | Extend network coverage | No | Yes | Used for setup and maintenance | Continuous mains or solar | [Set up a repeater](../start/repeater.md) |
| Room server | Keep a shared room available | No | Not its main job | Used for setup; companions connect to the room | Continuous power | [Set up a room server](../start/room-server.md) |
| Observer | Send network data to public tools | No | No | Depends on the observer method | Continuous power | [Set up an observer](../start/observer.md) |

<div class="mc-callout" data-kind="info" markdown>

**New to MeshCore?** Start with a companion. The other roles operate a service
for a mesh and are easier to set up after you can send and receive messages.

</div>

## Companion

A companion is the personal device used for messaging.

- It usually connects to a phone, tablet, or computer.
- Some supported devices include their own screen and controls.
- It can communicate with nearby nodes but does not relay traffic for the mesh.

[Start the companion path](../start/companion.md){ .md-button .md-button--primary }

## Repeater

A repeater relays packets and extends coverage.

- It is normally fixed in place and runs continuously.
- Antenna placement, reliable power, and safe mounting matter more than a
  display.
- Coordinate with the local community before adding or changing a repeater.

[Start the repeater path](../start/repeater.md){ .md-button .md-button--primary }

## Room server

A room server keeps recent room messages available for companions that connect
to it.

- It is normally fixed and continuously powered.
- It hosts a shared room; it is not a replacement for a repeater.
- Plan who will administer the room and keep its access details private.

[Start the room-server path](../start/room-server.md){ .md-button .md-button--primary }

## Observer

An observer listens for MeshCore traffic and sends network data to public tools.

- It does not relay mesh traffic.
- It can be a radio with observer firmware or a supported host-and-radio setup.
- Choose the observer method before buying hardware because requirements differ.

[Start the observer path](../start/observer.md){ .md-button .md-button--primary }

## Still unsure?

Choose the result you want:

- personal messaging: **companion**;
- wider local coverage: **repeater**;
- a persistent shared room: **room server**;
- data in public network tools: **observer**.

Before buying or flashing, check the hardware and firmware guide linked from
the role path. Support varies by device and firmware target.

## Next step

Open the matching setup path. If none fits, [ask the community](../start/get-help.md)
before buying hardware.
