---
title: Start with MeshCore in Canada
description: Choose a MeshCore role and follow a guided setup path using Canada or local network settings.
audience:
  - newcomer
  - first-time-user
task: start-meshcore
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-19
review_by: 2027-07-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 2-5 minutes
destructive: false
---

# Start with MeshCore

Choose a role and follow a short setup path to a clear success check.

## What do you want to do?

<div class="grid cards" markdown>

-   :material-message-text:{ .lg .middle } **Send and receive messages**

    Use a personal companion.

    [:octicons-arrow-right-24: Start the companion path](companion.md)

-   :material-radio-tower:{ .lg .middle } **Improve local coverage**

    Set up a repeater.

    [:octicons-arrow-right-24: Start the repeater path](repeater.md)

-   :material-forum:{ .lg .middle } **Host a persistent room**

    Set up a room server.

    [:octicons-arrow-right-24: Start the room-server path](room-server.md)

-   :material-chart-timeline-variant:{ .lg .middle } **Feed public network tools**

    Set up an observer.

    [:octicons-arrow-right-24: Start the observer path](observer.md)

-   :material-help-circle:{ .lg .middle } **I am not sure**

    Compare what each role does before choosing.

    [:octicons-arrow-right-24: Compare roles](choose-a-goal.md)

</div>

## Canada baseline

Start here when your local community does not publish an override.

| Setting | Canada baseline |
|---|---|
| Radio preset | **USA/Canada (Recommended)** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Path setting | **3-byte** |
| Command-line path setting | `set path.hash.mode 2` |

!!! warning "Local settings take priority"
    Check the [community directory](../provinces/index.md) before configuring
    a device. Nearby devices must use matching settings, so follow a published
    local override instead of the Canada baseline.

## What every path includes

1. Understand the role.
2. Choose compatible hardware.
3. Back up and prepare.
4. Follow the role-specific setup guide.
5. Apply Canada and local settings.
6. Verify the device nearby.
7. Verify it with your community or the public network tool.
8. Learn how to maintain it and where to get help.

The role pages can remember which checklist items you complete on this
browser. They store only true/false completion markers. They do not store
credentials, coordinates, private keys, or command output.

## Next step

[Compare the roles](choose-a-goal.md) if you are unsure. Otherwise, open the
role path that matches your goal.
