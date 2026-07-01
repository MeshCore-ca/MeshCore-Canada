# MQTT Data Collection & Access


MeshCore traffic is intended for shared mesh use, and different networks may use different presets or frequencies (including non-default settings). All channels that use a shared public key (and private keys) should be considered inherently insecure. Any node transmitting MeshCore packets over matching settings can be heard by observers on that mesh, not just one published default profile. Traffic forwarded over MQTT through this path should be treated as potentially public. Do not transmit names, locations, notes, or other personal information unless you are comfortable with that information being stored and viewable publicly. Assume that even with encryption on a private channel / setting can potentially be collected and decrypted by anyone with the means and know-how to do so.

## What We Collect

MeshCore Canada MQTT receives packet data from observer nodes that capture MeshCore packets and forward telemetry from matched channels.

Observers listen for all MeshCore traffic they can hear on the channels and presets they are configured for. If a packet is heard by an observer and that observer has packet publishing enabled, that traffic can be sent to the MeshCore Canada MQTT brokers.

## Where Data Goes

| Step | What happens |
|------|--------------|
| Radio traffic | Nodes transmit MeshCore packets on the frequencies and settings configured for their local mesh and presets. |
| Observer capture | MeshCore Canada observers and other authorized observers listen to all traffic they can hear on their configured channels. |
| MQTT publish | Observer paths publish packet data to MeshCore Canada MQTT infrastructure. |
| Storage and display | Data is stored on MeshCore Canada infrastructure and may be displayed by Beacon, CoreScope, and other public websites operated by MeshCore Canada or approved third-party operators. |

## MQTT Subscription Access

Direct MQTT subscription access is not handed out to everyone. It is limited to local mesh administrators, approved tools, and people approved by MeshCore Canada administration.

Even when direct broker subscription access is limited, the data can still be viewable by everyone through Beacon, CoreScope, and other public websites that consume the MQTT feed using approved MQTT read accounts.

## MQTT Read Access

| Tool or service | Operator | Purpose |
|-----------------|----------|---------|
| Beacon | MeshCore Canada operators | Public viewer for MeshCore packet data. |
| CoreScope (`live.meshcore.ca`) | MeshCore Canada operators | Public observer, packet, and map tools. |

## Infrastructure Administrators

The MeshCore Canada infrastructure administrators control the MQTT brokers and related infrastructure.

| Administrator | Profile |
|---------------|---------|
| Mr. Alderson | [github.com/MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [github.com/446564](https://github.com/446564) |
| n30nex | [github.com/n30nex](https://github.com/n30nex) |
| Kranic | [forum.meshcore.ca/u/djkranic](https://forum.meshcore.ca/u/djkranic) |

Questions about privacy, MQTT access, or the MeshCore Canada project should be directed to these administrators.

General discussion and support is also available on the forum at [https://forum.meshcore.ca/](https://forum.meshcore.ca/).
