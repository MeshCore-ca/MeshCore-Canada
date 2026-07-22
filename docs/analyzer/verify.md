---
title: Check your observer
description: Check that the radio hears traffic, the observer sends it, and CoreScope receives it.
audience:
  - observer-operators
task: verify-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 10 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Check your observer

A broker connection proves only internet access. Your observer is working when a real radio packet reaches CoreScope.

## Verify all four stages

<ol class="mc-steps">
  <li>
    <strong>Radio:</strong> confirm the device is on the local mesh settings and can hear nearby activity.
    <br>A packet counter, log, or connected application should change when a nearby node transmits.
  </li>
  <li>
    <strong>Observer:</strong> check the method's service, integration, or device status.
    <br>It should report an encrypted connection to at least the primary endpoint without repeating authentication errors.
  </li>
  <li>
    <strong>Observer view:</strong> open <a href="https://live.meshcore.ca/#/observers">CoreScope Observers</a>.
    <br>The observer name and three-letter location code should appear with a recent timestamp.
  </li>
  <li>
    <strong>Packet view:</strong> create nearby MeshCore activity, then open <a href="https://live.meshcore.ca/#/packets">CoreScope Packets</a>.
    <br>A recent packet attributed to the observer should appear within a few minutes.
  </li>
</ol>

Do not generate unnecessary traffic on a busy mesh. A normal advert or existing nearby activity is enough.

## What to look for

| Check | What you should see |
|---|---|
| Name | A clear service name such as `YOW-Repeater-01`, without a home address |
| Location | The nearest real three-letter airport code, not `CAN`, `XXX`, or `HOME` |
| Primary path | Connected to `mqtt1.meshcore.ca` with TLS certificate verification |
| Backup path | Connected to `mqtt2.meshcore.ca` where the method supports two entries |
| Packet mode | Packet publishing is enabled, not status-only |
| Packet time | A recent packet appears after the radio hears nearby traffic |
| Radio | Local settings are used; the Canada defaults apply only when no local override exists |

## Record the check

Keep a short private maintenance note:

```text
Observer:
Method and version:
Location code:
Checked at (include time zone):
Radio heard a packet: yes / no
Primary connected: yes / no
Backup connected: yes / no / not supported
Observer visible: yes / no
Packet visible: yes / no
```

Do not include credentials, private keys, Wi-Fi names, or Wi-Fi passwords.

## If a stage fails

Start with the first failed stage:

| First failure | Next page |
|---|---|
| Radio does not hear activity | [Observer appears but no packets](troubleshooting.md#observer-appears-but-no-packets-arrive) |
| Observer cannot connect | [Observer never appears](troubleshooting.md#observer-never-appears) |
| Observer is visible but packet view stays empty | [Observer appears but no packets](troubleshooting.md#observer-appears-but-no-packets-arrive) |
| Backup alone fails | [Only the backup connection fails](troubleshooting.md#only-the-backup-connection-fails) |
| Place or name is wrong | [Observer appears in the wrong place](troubleshooting.md#observer-appears-in-the-wrong-place) |

For safe commands and a redacted support note, use [Troubleshooting](troubleshooting.md).
