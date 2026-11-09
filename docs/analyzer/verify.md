---
title: Check your observer
description: Check that the radio hears traffic, the observer sends it, and Beacon receives it.
audience:
  - observer-operators
task: verify-observer
scope: canada-baseline
status: draft
status_notice: false
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 10 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Check your observer

After setting up your observer (a [repeater observer](../config/index.md?type=observer),
[MCtoMQTT](builds/mctomqtt.md), [PyMC](builds/pymc.md),
[Home Assistant](builds/meshcore-ha.md) or [RemoteTerm](remoteterm.md)), use
these links to confirm it's online and reporting.

<div class="grid cards" markdown>

-   :material-eye:{ .lg .middle } **Observers**

    ---

    See every connected observer and its status.

    [:octicons-arrow-right-24: View observers](https://live.meshcore.ca/?tab=Observers)

-   :material-swap-horizontal:{ .lg .middle } **Packets**

    ---

    Watch live packet traffic coming in from observers.

    [:octicons-arrow-right-24: View packets](https://live.meshcore.ca/)

-   :material-map-marker:{ .lg .middle } **Map**

    ---

    See observers and nodes on the map.

    [:octicons-arrow-right-24: View the map](https://live.meshcore.ca/?tab=Map)

-   :material-wrench:{ .lg .middle } **Troubleshooting**

    ---

    Not showing up? Fixes for every observer type.

    [:octicons-arrow-right-24: Troubleshooting](troubleshooting.md)

</div>

Your observer should appear within a few minutes of coming online. Connected
doesn't mean packets have reached Beacon: it's working once a recent packet
from your observer shows up.

## Healthy observer checklist

| Check | What you should see |
|---|---|
| Observer name | A clear name such as `YOW-Repeater-01` |
| Region | The uppercase code from [Find your zone](../config/map.md), not `CAN`, `XXX` or `HOME` |
| Brokers | Primary and backup configured, where the method supports both |
| Packets | Recent packet times in Beacon after nearby mesh activity |
| Radio | The **Canada** preset with 3-byte paths, unless your community's page differs |

## First checks

If it doesn't appear, start with the first thing that failed:

| What you see | First check |
|---|---|
| No observer entry | MQTT is connected and the region code is a real code from [Find your zone](../config/map.md) |
| Observer appears, but no packets | Packet publishing is on: repeater observer `mqtt.packets`, Home Assistant **Payload Mode** = `packet`, or PyMC `format: letsmesh` |
| Backup broker doesn't connect | The token audience matches the broker host (`mqtt2.meshcore.ca` for broker 2) |
| Observer appears under the wrong city | Every broker entry uses the same region code; don't use `CAN` for Canada |

For method-specific commands and Home Assistant settings, see [Troubleshooting](troubleshooting.md).
