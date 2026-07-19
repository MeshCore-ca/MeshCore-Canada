---
title: Observer data, access, and privacy
description: Understand what an observer can send, where that data goes, who can see it, and which retention details remain unpublished.
audience:
  - observer-operators
  - community-members
task: understand-observer-data
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: beginner
estimated_time: 6 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css
---

# Observer data, access, and privacy

Treat radio traffic heard by a public observer as public. Do not put private names, locations, credentials, or other sensitive information in MeshCore messages.

<div class="mc-method-fit">
  <div><strong>Collection</strong>An observer can send packets and status it hears on its configured radio settings.</div>
  <div><strong>Display</strong>Approved public tools can show observer, packet, and map data.</div>
  <div><strong>Direct access</strong>Broker subscriptions are limited; public viewers may still expose the data.</div>
</div>

## Policy summary

| Field | Current statement |
|---|---|
| Status | Draft operational summary |
| Version | `0.1` |
| Reviewed | July 19, 2026 |
| Owner | MeshCore Canada infrastructure administrators |
| Contact | [MeshCore Canada forum](https://forum.meshcore.ca/) |
| Retention | A public retention period has not yet been published |

Because a retention period is not published, do not assume data will be deleted after a particular time. Ask the infrastructure team before relying on a deletion timeline.

## Data flow

<ol class="mc-analyzer-flow">
  <li><strong>Radio packet</strong><span>transmitted on the configured mesh</span></li>
  <li><strong>Observer</strong><span>hears and forwards telemetry</span></li>
  <li><strong>Infrastructure</strong><span>receives and may store it</span></li>
  <li><strong>Approved viewer</strong><span>may display it publicly</span></li>
</ol>

Changing the radio preset changes what the observer can hear. Public and private channel choices do not make the surrounding packet telemetry private.

## Collection, access, and retention

| Data | Why it is used | Where it may appear | Who can access it | Retention |
|---|---|---|---|---|
| Observer status | Show whether an observer is online | CoreScope and approved tools | Public viewers; infrastructure operators | Not publicly specified |
| Heard packet telemetry | Show mesh activity and diagnose coverage | Packet views, maps, approved tools | Public viewers; approved subscribers; infrastructure operators | Not publicly specified |
| Location code | Group an observer near a known place | Observer lists, topics, maps | Public viewers and broker users | Follows observer/packet retention |
| Optional owner details | Help an operator identify a service | Integration-dependent status data | May reach infrastructure and approved tools | Not publicly specified |
| Broker credentials | Authenticate the observer | Should remain only in the local integration | Local operator and authentication service | Never include in public diagnostics |

MeshCore Canada does not offer general direct broker subscriptions. Access is limited to approved tools, local mesh administrators, and people approved by the infrastructure administrators.

## Public tools

- [CoreScope](https://live.meshcore.ca/) shows observer, packet, and map information.
- Other approved MeshCore Canada tools may consume the same feed.

The existence of access controls on the broker does not make data private once an approved public viewer displays it.

## Before you operate an observer

- [ ] Tell people using the local mesh that public observation is active.
- [ ] Use a broad observer name, not a home address or person's name.
- [ ] Leave optional owner email fields blank unless they are operationally needed.
- [ ] Never paste Wi-Fi passwords, MQTT tokens, private keys, or unredacted logs into support messages.
- [ ] Read the method's verification and recovery steps before making changes.

Return to [Choose an observer method](intro.md), or review [safe troubleshooting and redaction](troubleshooting.md#build-a-safe-escalation-bundle).
