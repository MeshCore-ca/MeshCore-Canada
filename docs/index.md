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
  - assets/styles/home.css?v=20261105-1
hide:
  - toc
---

# MeshCore Canada

<div class="mc-home-hero" markdown>

<div class="mc-home-hero__art" aria-hidden="true"><img src="assets/canada-network-motif.svg" alt="" width="960" height="420" fetchpriority="high"></div>

**A community project for MeshCore deployments in Canada.** We're volunteers,
and we're not affiliated with the official MeshCore project. This site covers
how MeshCore is set up across Canada: local communities, recommended hardware,
radio settings and repeater configuration.

[Join the MeshCore Canada Discord](https://discord.gg/GBCP4xdgNv){ .md-button .md-button--primary } [Forum](https://forum.meshcore.ca/){ .md-button }

<p class="mc-home-hero__credit">Illustrative network · <a href="assets/regions/NOTICE.txt">Map sources</a></p>

</div>

## Where do you want to go? { #where-to-go }

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Get started**

    New here? Pick a device and get on the mesh.

    [:octicons-arrow-right-24: Start setup](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Find a community**

    Local groups, contacts and settings near you.

    [:octicons-arrow-right-24: Browse communities](provinces/index.md)

-   :material-map-search:{ .lg .middle } **Find your zone**

    See which zone covers your location.

    [:octicons-arrow-right-24: Find my zone](config/map.md)

-   :material-radio-tower:{ .lg .middle } **Set up a repeater**

    Build the setup commands for your repeater.

    [:octicons-arrow-right-24: Open the repeater tool](config/index.md)

-   :material-chip:{ .lg .middle } **Hardware**

    Which radios and antennas to buy or build.

    [:octicons-arrow-right-24: Choose hardware](hardware/index.md)

-   :material-access-point-network:{ .lg .middle } **Live network**

    See who's on the mesh right now.

    [:octicons-arrow-right-24: Open live.meshcore.ca](https://live.meshcore.ca/)

</div>

## Canada default radio settings { #canada-baseline }

Use these unless your local community lists different settings.

<div class="mc-baseline-table" markdown>

| Setting | Canada default |
|---|---|
| Radio preset | **Canada** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path setting | **3-byte** |
| Command-line path setting | `set path.hash.mode 2` |

</div>

<p class="mc-preset-note">No Canada preset in your app? <a href="provinces/#canada-baseline">Preset details and older apps</a>.</p>
