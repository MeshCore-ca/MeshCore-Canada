---
title: Network tools
description: Choose the MeshCore Canada tool for repeater regions, live network visibility, or observer setup and verification.
audience:
  - meshcore-user
  - repeater-operator
  - observer-operator
task: choose-network-tool
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-22
evidence: Internal task routes and the external CoreScope destination reviewed on 2026-07-22
difficulty: beginner
estimated_time: 2 minutes
destructive: false
---

# Network tools

Start with the outcome you need. Configuration tools help you plan a change;
live tools help you observe what the network is currently reporting.

<div class="grid cards" markdown>

-   :material-tune-variant:{ .lg .middle } **Configure a repeater**

    ---

    Find the Canadian region for a location, review the hierarchy, and generate
    region commands. Review every command before applying it.

    [:octicons-arrow-right-24: Open the repeater configurator](../config/index.md)

-   :material-map-search:{ .lg .middle } **Explore Canadian regions**

    ---

    Search the same region data on a national map, inspect neighbouring paths,
    or continue without the map.

    [:octicons-arrow-right-24: Open the region map](../config/map.md)

-   :material-chart-timeline-variant:{ .lg .middle } **View the live network**

    ---

    Use CoreScope to inspect public observers, packets, nodes, and map data.
    This is an external MeshCore Canada service.

    [:octicons-arrow-right-24: Open CoreScope (external)](https://live.meshcore.ca/){ target="_blank" rel="noopener" }

-   :material-access-point-network:{ .lg .middle } **Set up an observer**

    ---

    Choose an observer method for hardware or software you already use, then
    verify that packets reach the public tools.

    [:octicons-arrow-right-24: Choose an observer method](../analyzer/intro.md)

</div>

## Choose by task

| Goal | Start here | Finish with |
|---|---|---|
| Configure a Canadian repeater region | [Repeater configurator](../config/index.md) | [Repeater verification](../start/verify.md#repeater) |
| Understand or review a boundary | [Region map](../config/map.md) | [Region standard](../config/standard.md) |
| Add network visibility from a radio | [Observer method chooser](../analyzer/intro.md) | [Observer verification](../analyzer/verify.md) |
| Diagnose missing or stale observer data | [Network-data troubleshooting](../analyzer/troubleshooting.md) | [Broker reference](../analyzer/broker-reference.md) |
| Find a public network service or upstream tool | [Links and services](../resources/links.md) | The guide for that service |

## Before sending data

Observer telemetry and heard radio packets can appear in public tools. Read
[data collection and access](../analyzer/data-collection-access.md) and the
[site privacy guide](../privacy.md) before operating an observer or searching
for a place.

If you are unsure which tool fits, [ask for help](../start/get-help.md) before
changing a shared repeater or installing another service.
