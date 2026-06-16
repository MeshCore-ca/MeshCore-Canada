# MQTT Data Collection & Access

This page explains where MeshCore Canada MQTT data goes, who can access the broker feeds, and who administers the infrastructure.

!!! warning "Treat Public channel traffic as public"
    MeshCore Canada observers operate on the default MeshCore Canada network settings and Public channel. The default MeshCore encryption system and Public channel are for shared public mesh traffic, not private distribution to a closed group. Traffic sent on the Public channel should be treated as public. Do not transmit names, locations, notes, or other personal information over radio or MQTT unless you are comfortable with that information being stored and shown publicly.

## What We Collect

MeshCore Canada collects packet data from nodes that are on the MeshCore Canada network and are seen by an observer.

Observers listen for all traffic they can hear on the default MeshCore Canada frequencies and settings. If a packet is heard by an observer and the observer path is configured to publish packet data, it can be sent to the MeshCore Canada MQTT brokers.

## User Control

Users can opt in or opt out of telemetry and location data uploading in their MeshCore clients where those settings are available.

It is each user's responsibility to choose how much personal information to share from their radios over MQTT. If telemetry, location, or identifying profile information is enabled on a client, that data may be published, stored, and displayed by public viewer sites.

## Where Data Goes

| Step | What happens |
|------|--------------|
| Radio traffic | Nodes transmit on the MeshCore Canada default frequencies and Public channel. |
| Observer capture | MeshCore Canada observers listen to all traffic they can hear on those defaults. |
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
