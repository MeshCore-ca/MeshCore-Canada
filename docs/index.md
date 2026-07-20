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
last_reviewed: 2026-07-19
review_by: 2027-07-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 1-2 minutes
destructive: false
hide:
  - toc
---

# MeshCore Canada

MeshCore Canada helps Canadians join, build, operate, and coordinate local
MeshCore networks.

[:octicons-arrow-right-24: **Brand new? Start here**](start/index.md){ .md-button .md-button--primary }

## What are you trying to do?

<div class="grid cards" markdown>

-   :material-message-text:{ .lg .middle } **Start using MeshCore**

    ---

    Choose a role and follow a clear path from preparation to a working check.

    [:octicons-arrow-right-24: Start](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Find a community**

    ---

    Find local contacts and check whether your area publishes different
    settings.

    [:octicons-arrow-right-24: Find a community](provinces/index.md)

-   :material-access-point-network:{ .lg .middle } **Set up or operate a node**

    ---

    Go directly to the companion, repeater, room-server, or observer path.

    [:octicons-arrow-right-24: Choose a node role](start/choose-a-goal.md)

</div>

## Choose a role

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

    Send network data to the public tools.

    [:octicons-arrow-right-24: Set up an observer](start/observer.md)

</div>

Not sure which one fits? [Compare the roles](start/choose-a-goal.md).

## Canada baseline

Use these settings when a local community has not published an override.

| Setting | Canada baseline |
|---|---|
| Radio preset | **USA/Canada (Recommended)** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path setting | **3-byte** |
| Command-line path setting | `set path.hash.mode 2` |

!!! warning "Check your local community first"
    Nearby devices must use matching settings. If your local community page
    publishes an override, use its settings instead of the Canada baseline.

## Find your region

Search by city, airport code, postal code, or region name.

<form class="mc-place-search" action="config/" method="get" role="search">
  <label for="mc-home-place">City, airport code, postal code, or region</label>
  <div>
    <input id="mc-home-place" name="q" type="search" autocomplete="address-level2" required>
    <button type="submit">Find my region</button>
  </div>
  <label>
    <input name="lookup" type="checkbox" value="online" required>
    Allow online place lookup
  </label>
  <small>Your search is sent to OpenStreetMap Nominatim or geocoder.ca.</small>
</form>

Or browse the [region map](config/map.md).

Looking for people nearby? [Browse communities](provinces/index.md), ask on the
[MeshCore Canada forum](https://forum.meshcore.ca/) or
[Discord](https://discord.gg/BESFVMt7yk). You can start the setup guide even
before joining either service.

## Use network tools

<div class="grid cards" markdown>

-   **Configure a repeater**

    Find the regional settings and commands for a repeater.

    [:octicons-arrow-right-24: Open the configurator](config/index.md)

-   **Explore regions**

    Search and inspect the Canadian region map.

    [:octicons-arrow-right-24: Open the region map](config/map.md)

-   **Check the live network**

    View public nodes, observers, and packet activity in CoreScope.

    [:octicons-link-external-24: Open CoreScope](https://live.meshcore.ca/)

-   **Set up an observer**

    Choose how to send network data to the public tools.

    [:octicons-arrow-right-24: Choose an observer method](analyzer/intro.md)

</div>

## Improve MeshCore Canada

Found missing, confusing, or outdated information?
[Share an idea](submit-idea.md) or [update a community
listing](contributing.md).

## About this project

MeshCore Canada is an independent community project. It is not affiliated
with, endorsed by, or officially connected to the MeshCore or MeshOS
projects.

The documentation is maintained in the
[MeshCore Canada repository](https://github.com/MeshCore-ca/MeshCore-Canada).
See [how to contribute](contributing.md) for maintainers and contribution
options.
