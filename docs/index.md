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

MeshCore Canada helps Canadians choose a node, find nearby operators, apply
the right regional settings, and verify that a local mesh is working.

## Start with your goal

<div class="grid cards" markdown>

-   :material-message-text:{ .lg .middle } **New to MeshCore**

    ---

    Choose a role and follow a clear path from preparation to a working check.

    [:octicons-arrow-right-24: Start the guided setup](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Find people near you**

    ---

    Search community-provided contacts and check whether your area publishes
    different settings.

    [:octicons-arrow-right-24: Find a community](provinces/index.md)

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

Need help from a person? Join the [national Discord](https://discord.gg/BESFVMt7yk),
ask on the [community forum](https://forum.meshcore.ca/), or check the
[live Canadian network](https://live.meshcore.ca/).

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

Search by city, airport code, or region.

<form class="mc-place-search" action="config/" method="get" role="search">
  <label for="mc-home-place">City, airport code, or region</label>
  <div>
    <input id="mc-home-place" name="place" type="search" autocomplete="address-level2" required>
    <button type="submit">Continue to region finder</button>
  </div>
  <label class="mc-place-search__consent" for="mc-home-online-lookup">
    <input id="mc-home-online-lookup" name="lookup" type="checkbox" value="online">
    Look this place up online after I continue.
  </label>
  <small>If selected, the search text is sent to Nominatim or geocoder.ca.
  Leave it clear to review the query and consent inside the configurator. See the
  <a href="privacy/">privacy guide</a>.</small>
</form>

Or browse the [region map](config/map.md).

Looking for people nearby? [Browse communities](provinces/index.md), ask on the
[MeshCore Canada forum](https://forum.meshcore.ca/) or
[Discord](https://discord.gg/BESFVMt7yk). You can start the setup guide even
before joining either service.

## Use network tools

The [Network Tools hub](tools/index.md) puts the repeater configurator, Canadian
region map, live network view, observer setup, and verification guidance in one
place.

[:octicons-arrow-right-24: **Choose a network tool**](tools/index.md){ .md-button }

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
Read [about the project and service stewardship](about.md), or see
[how to contribute](contributing.md) for maintainers and contribution options.
