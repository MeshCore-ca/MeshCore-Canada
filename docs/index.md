---
title: MeshCore Canada
description: Join, build, operate, and coordinate a local MeshCore network in Canada.
audience:
  - newcomer
  - meshcore-operator
task: choose-a-goal
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2027-07-19
tested_with:
  content_baseline: origin-main-cbbe9c0-pr66
difficulty: beginner
estimated_time: 1-2 minutes
destructive: false
hide:
  - toc
---

# MeshCore Canada

Welcome! We're improving this site. Found something unclear or outdated?
[Open a GitHub issue](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

## What are you looking for? { #start-with-your-goal }

<div class="grid cards" markdown>

-   :material-message-text:{ .lg .middle } **New to MeshCore**

    ---

    Set up your LoRa radio and join a Canadian mesh.

    [:octicons-arrow-right-24: Start the guided setup](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Find people near you**

    ---

    Find nearby communities, contacts, and local radio settings.

    [:octicons-arrow-right-24: Find a community](provinces/index.md)

</div>

## What kind of device are you setting up? { #choose-a-role }

<div class="grid cards" markdown>

-   :material-cellphone-link:{ .lg .middle } **Personal companion**

    Send and receive messages.

    [:octicons-arrow-right-24: Set up a companion](start/companion.md)

-   :material-radio-tower:{ .lg .middle } **Repeater**

    Improve local coverage.

    [:octicons-arrow-right-24: Set up a repeater](start/repeater.md)

-   :material-forum:{ .lg .middle } **Room server**

    Host a persistent room.

    [:octicons-arrow-right-24: Set up a room server](start/room-server.md)

-   :material-chart-timeline-variant:{ .lg .middle } **Observer**

    Send network data to CoreScope.

    [:octicons-arrow-right-24: Set up an observer](start/observer.md){ .mc-observer-link }

</div>

Not sure which one fits? [Compare the roles](start/choose-a-goal.md).

Need help from a person? Join the [national Discord](https://discord.gg/BESFVMt7yk),
ask on the [community forum](https://forum.meshcore.ca/), or check the
[live Canadian network](https://live.meshcore.ca/).

## Canada Default Radio Settings { #canada-baseline }

Use these defaults unless your local community lists different settings.

| Setting | Canada default |
|---|---|
| Radio preset | **USA/Canada (Recommended)** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path setting | **3-byte** |
| Command-line path setting | `set path.hash.mode 2` |

## Find your region

Search by city, airport code, or region.

<form class="mc-place-search" action="config/" method="get" role="search">
  <label for="mc-home-place">City, airport code, or region</label>
  <div>
    <input id="mc-home-place" name="place" type="search" autocomplete="address-level2" required>
    <button type="submit">Find my region</button>
  </div>
</form>

Or browse the [region map](config/map.md).

Need local help? [Browse communities](provinces/index.md), ask on the
[MeshCore Canada forum](https://forum.meshcore.ca/), or join
[Discord](https://discord.gg/BESFVMt7yk).

## Use network tools

Configure a repeater, explore Canadian regions, view CoreScope, or set up an
observer.

[:octicons-arrow-right-24: **Choose a network tool**](tools/index.md){ .md-button }

## Improve MeshCore Canada

Found something missing or confusing? [Share an idea](submit-idea.md) or
[update a community listing](contributing.md).

## About this project

MeshCore Canada is an independent, community-run project.
[Learn more](about.md) or [contribute](contributing.md).
