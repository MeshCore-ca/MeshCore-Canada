---
title: MeshCore Canada
description: Learn about MeshCore and join a local Canadian network.
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
page_styles:
  - assets/styles/home.css?v=20260905-1
hide:
  - toc
---

# MeshCore Canada

<div class="mc-home-hero" markdown>

<div class="mc-home-hero__art" aria-hidden="true"><img src="assets/canada-network-motif.svg" alt="" width="960" height="420" fetchpriority="high"></div>

Welcome! We're improving this site. Found something unclear or outdated?
[Open a GitHub issue](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

<p class="mc-home-hero__credit">Illustrative network · <a href="assets/regions/NOTICE.txt">Map sources</a></p>

</div>

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

-   :material-map-search:{ .lg .middle } **Find your MeshCore region**

    ---

    See which Canadian MeshCore region covers your location.

    [:octicons-arrow-right-24: Find my region](config/map.md)

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

<div class="mc-baseline-table" markdown>

| Setting | Canada default |
|---|---|
| Radio preset | **Canada** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path setting | **3-byte** |
| Command-line path setting | `set path.hash.mode 2` |

</div>

<p class="mc-preset-note">The app’s <strong>Canada</strong> preset keeps the former USA/Canada radio settings and selects <strong>3-byte</strong> paths. The separate <strong>USA</strong> preset leaves the path-hash setting unchanged. <a href="provinces/#canada-baseline">Preset details and older apps</a> · <a href="https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579">Upstream update</a>.</p>

## Improve MeshCore Canada

Found something missing or confusing? [Share an idea](submit-idea.md) or
[update a community listing](contributing.md).

## About this project

MeshCore Canada is an independent, community-run project.
[Learn more about MeshCore Canada](about.md) or [contribute](contributing.md).
