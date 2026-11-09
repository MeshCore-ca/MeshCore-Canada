---
title: Observer data and privacy
description: See what an observer sends, where it appears, and how to keep private information out of it.
audience:
  - observer-operators
  - community-members
task: understand-observer-data
scope: canada-baseline
status: draft
status_notice: false
owner: meshcore-canada
last_reviewed: 2026-09-03
review_by: 2026-12-01
difficulty: beginner
estimated_time: 6 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Observer data and privacy

!!! warning "Treat MeshCore radio traffic as public"
    MeshCore traffic is meant for shared mesh use, and networks may use different
    presets or frequencies. Treat every channel that uses a shared key, and private
    ones too, as insecure: any node on matching settings can be heard by
    observers on that mesh. Traffic forwarded over MQTT should be treated as
    public. Don't send names, locations, notes or other personal information you
    wouldn't want stored and shown publicly. Assume that even private channels
    could be collected and decrypted by someone with the means and know-how.

## What we collect

MeshCore Canada's MQTT brokers receive packet data from observers that capture
MeshCore packets and forward telemetry.

Observers listen to all the MeshCore traffic they can hear on the settings they
use. If an observer hears a packet and has packet publishing on, that packet can
be sent to the MeshCore Canada brokers.

## Where data goes

| Step | What happens |
|---|---|
| Radio traffic | Nodes send MeshCore packets on the frequencies and settings of their local mesh. |
| Observer capture | Observers listen to all the traffic they can hear on their settings. |
| MQTT publish | Observers publish packet data to MeshCore Canada's brokers. |
| Storage and display | Data is stored on MeshCore Canada infrastructure and may be shown by Beacon and other public sites run by MeshCore Canada or approved operators. |

No retention period has been published yet: don't assume data is deleted after a
set time.

## Who can subscribe

Direct MQTT subscriptions aren't open to everyone. They're limited to local mesh
administrators, approved tools and people approved by the MeshCore Canada
administrators. Even so, the data is public through Beacon and the
other sites below.

## Read-only MQTT accounts { #read-only-mqtt-accounts }

| Service | Operator | Purpose |
|---|---|---|
| Beacon (`live.meshcore.ca`) | MeshCore Canada operators | Public observer, packet, node and map tools |
| Beacon API (`dev.meshcore.ca`) | MeshCore Canada operators | Network totals and repeater ID checks on this site |
| [Canadaverse](https://canadaverse.org/) | [n30nex@gmail.com](mailto:n30nex@gmail.com) | GTA Regional Tools & CartoLive map |
| [Quinte Mesh](https://quintemesh.ca/) | hansimgamr | Quinte-region community network services |

Infrastructure administrators update this table whenever they create or remove a read-only account. [Report a missing or outdated entry](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

## Infrastructure administrators

The MeshCore Canada infrastructure administrators run the MQTT brokers and related
infrastructure. Ask them about privacy, MQTT access or the project.

| Administrator | Contact |
|---|---|
| Mr. Alderson | [github.com/MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [github.com/446564](https://github.com/446564) |
| n30nex | [github.com/n30nex](https://github.com/n30nex) |
| Kranic | [forum.meshcore.ca/u/djkranic](https://forum.meshcore.ca/u/djkranic) |

General discussion and support: [forum.meshcore.ca](https://forum.meshcore.ca/).

## If you run an observer

- Use a broad observer name, not your home address or your own name.
- Never paste Wi-Fi passwords, MQTT tokens, private keys or unredacted logs into
  support messages.
