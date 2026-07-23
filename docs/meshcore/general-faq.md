---
title: MeshCore questions and answers
description: Find short answers about Canadian settings, hardware, range, joining a mesh, and observer problems.
audience:
  - newcomer
  - meshcore-user
  - mesh-operator
task: answer-meshcore-question
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
evidence:
  - Existing MeshCore Canada FAQ
  - Current configurator and setup guides
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# MeshCore questions and answers

Search this page with your browser's **Find** command, or choose a topic below.
Settings can differ by place, so this page links to the current source instead
of repeating values that may change.

- [Settings and range](#settings-and-range)
- [Hardware](#hardware)
- [Joining or starting a mesh](#joining-or-starting-a-mesh)
- [Observers and troubleshooting](#observers-and-troubleshooting)

## Settings and range

### Which radio settings should I use in Canada?

Use the [repeater configurator](../config/index.md) for a repeater. It returns
the current settings for the location you select.

For any role, first check the [community directory](../provinces/index.md).
Follow a published local override when one exists.

### What is path hash mode?

It controls the size of the identifiers used in advert paths. The Canadian
region standard and configurator provide the current setting for a repeater.
Use their output instead of copying an old command from a discussion or
screenshot.

[Read the region standard](../config/standard.md).

### Do I need an amateur radio licence?

MeshCore Canada cannot decide which authorization applies to your station.
You are responsible for legal frequency, power, antenna, and operating choices
in your location.

Start with the [Canadian regulatory links](../resources/links.md#radio-and-regulatory-references).
If you are unsure, ask a qualified local operator before transmitting.

### What range should I expect?

Range depends on antenna quality and placement, height, terrain, buildings,
interference, and line of sight. Test against a nearby known-good node before
assuming the device or firmware is faulty.

## Hardware

### Which devices work with MeshCore?

Use a device listed by the official MeshCore Flasher or by a MeshCore Canada
guide for the role you need. Support depends on the board and firmware target.

[Compare device roles](../start/choose-a-goal.md), then open the hardware guide
from the matching setup guide.

### Can I reuse a device that currently runs Meshtastic?

Some supported boards can be reflashed with MeshCore firmware. A device still
running Meshtastic firmware will not join a MeshCore network.

Confirm the exact board in the official flasher before changing it, and back up
anything you need to keep.

### Which board should I buy first?

Choose the role first. For a companion, prefer a supported device with nearby
community experience. For a fixed service, reliable power, antenna placement,
and maintainability matter more than screen features.

## Joining or starting a mesh

### How do I join a nearby mesh?

1. [Find the local community](../provinces/index.md).
2. Follow its published settings or use the Canadian baseline when no override
   is listed.
3. Follow the setup guide for your [device role](../start/choose-a-goal.md).
4. Send an advert and ask a nearby user to confirm it.

### How do I start a mesh where none is listed?

Begin with companions so people can test locally. Add fixed infrastructure only
after checking placement, power, local coordination, and the region standard.

When the group is ready, [add the community](../contributing.md) so others can
find its status, contact information, and any reviewed local settings.

## Observers and troubleshooting

### Why does my observer show no packets?

A connection to the data service does not prove the radio is hearing nearby
traffic. Check the selected radio settings, packet publishing, device activity,
and the final verification result.

Use [Check your observer](../analyzer/verify.md), then follow
[observer troubleshooting](../analyzer/troubleshooting.md) for the symptom you
see.

### Where can I ask another question?

Use [Get help](../start/get-help.md) for the shortest support route. Remove
passwords, private keys, precise private locations, and other sensitive values
before sharing screenshots or logs.
