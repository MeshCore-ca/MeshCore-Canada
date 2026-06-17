# MQTT Data Collection & Access

This page explains where MeshCore Canada MQTT data goes, who can access the broker feeds, and who administers the infrastructure.

!!! warning "Treat MeshCore RF traffic as potentially public"
    MeshCore traffic is intended for shared mesh use, and different networks may use different presets or frequencies (including non-default settings). Any node transmitting MeshCore packets over matching settings can be heard by observers on that mesh, not just one published default profile. Traffic forwarded over MQTT through this path should be treated as potentially public. Do not transmit names, locations, notes, or other personal information unless you are comfortable with that information being stored and viewable publicly.

## What We Collect

MeshCore Canada MQTT receives packet data from observer nodes that capture MeshCore packets and forward telemetry from matched channels.

Observers listen for all MeshCore traffic they can hear on the channels and presets they are configured for. If a packet is heard by an observer and that observer has packet publishing enabled, that traffic can be sent to the MeshCore Canada MQTT brokers.

## User Control

For companion/client paths that expose controls, users can opt in or opt out of telemetry and location data uploading as part of their observer setup.

It is each user's responsibility to choose how much personal information to share from their radios over MQTT. If telemetry, location, or identifying profile information is enabled on a client, that data may be published, stored, and displayed by public viewer sites.

## Where Data Goes

| Step | What happens |
|------|--------------|
| Radio traffic | Nodes transmit MeshCore packets on the frequencies and settings configured for their local mesh and presets. |
| Observer capture | MeshCore Canada observers and other authorized observers listen to all traffic they can hear on their configured channels. |
| MQTT publish | Observer paths publish packet data to MeshCore Canada MQTT infrastructure. |
| Storage and display | Data is stored on MeshCore Canada infrastructure and may be displayed by Beacon and other public websites operated by MeshCore Canada operators. |

## MQTT Subscription Access

Direct MQTT subscription access is not handed out to everyone. It is limited to local mesh administrators and people approved by MeshCore Canada administration.

Even when direct broker subscription access is limited, the data can still be viewable by everyone through Beacon and other public websites that consume the MQTT feed using the MQTT subscription role.

## Infrastructure Administrators

The MeshCore Canada infrastructure administrators control the MQTT brokers and related infrastructure.

| Administrator | Profile |
|---------------|---------|
| Mr. Alderson | [github.com/MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [github.com/446564](https://github.com/446564) |
| n30nex | [github.com/n30nex](https://github.com/n30nex) |
| Kranic | [forum.meshcore.ca/u/djkranic](https://forum.meshcore.ca/u/djkranic) |

Questions about privacy, MQTT access, or the MeshCore Canada project should be directed to these administrators.
