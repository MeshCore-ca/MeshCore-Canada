---
title: Observer data and privacy
description: See what an observer sends, where it appears, and how to keep private information out of it.
audience:
  - observer-operators
  - community-members
task: understand-observer-data
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 6 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Observer data and privacy

Treat anything heard by an observer as public. An observer does not decrypt private messages, but it can forward packet details and status information. Do not put private names, locations, credentials, or other sensitive information in MeshCore messages.

<div class="mc-method-fit">
  <div><strong>Observer</strong>Sends packet data and status from the radio settings it uses.</div>
  <div><strong>CoreScope</strong>Can show observer, packet, and map data publicly.</div>
  <div><strong>Broker</strong>Direct subscriptions are restricted, but data shown in CoreScope is still public.</div>
</div>

## Policy summary

| Question | Answer |
|---|---|
| Who manages this? | MeshCore Canada infrastructure administrators |
| Where can I ask questions? | [MeshCore Canada forum](https://forum.meshcore.ca/) |
| How long is data kept? | A public retention period has not yet been published |

Do not assume data will be deleted after a certain time. Ask the infrastructure team if you need a retention or deletion timeline.

## Data flow

<ol class="mc-analyzer-flow">
  <li><strong>Radio packet</strong><span>transmitted on the configured mesh</span></li>
  <li><strong>Observer</strong><span>hears and forwards telemetry</span></li>
  <li><strong>Infrastructure</strong><span>receives and may store it</span></li>
  <li><strong>CoreScope</strong><span>may display it publicly</span></li>
</ol>

Changing the radio preset changes what the observer can hear. Public and private channel choices do not make the surrounding packet telemetry private.

## Collection, access, and retention

| Data | Why it is used | Where it may appear | Who can access it | Retention |
|---|---|---|---|---|
| Observer status | Show whether an observer is online | CoreScope | Public viewers; infrastructure operators | Not publicly specified |
| Heard packet telemetry | Show mesh activity and help diagnose coverage | CoreScope packet views and maps | Public viewers; approved subscribers; infrastructure operators | Not publicly specified |
| Location code | Group an observer near a known place | Observer lists, topics, maps | Public viewers and broker users | Follows observer/packet retention |
| Optional owner details | Help identify a service | Integration-dependent status data | May reach infrastructure and CoreScope | Not publicly specified |
| Broker credentials | Authenticate the observer | Should remain only in the local integration | Local operator and authentication service | Never include in public diagnostics |

MeshCore Canada does not offer general direct broker subscriptions. Direct access is limited to CoreScope, local mesh administrators, and people approved by the infrastructure administrators.

## Where it appears

[CoreScope](https://live.meshcore.ca/) shows observer, packet, and map information. Other approved MeshCore Canada services may use the same feed.

Broker access controls do not make information private once CoreScope displays it.

## Before you operate an observer

- [ ] Tell people using the local mesh that an observer is active.
- [ ] Use a broad observer name, not a home address or person's name.
- [ ] Leave optional owner email fields blank unless they are operationally needed.
- [ ] Never paste Wi-Fi passwords, MQTT tokens, private keys, or unredacted logs into support messages.
- [ ] Read the method's verification and recovery steps before making changes.

Return to [Choose an observer setup](intro.md), or see [what to remove before asking for help](troubleshooting.md#what-to-share-when-asking-for-help).
