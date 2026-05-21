# Glossary

A quick reference for common terms used across the MeshCore community.

**Advert**
:   A MeshCore announcement packet that helps nearby nodes learn about a device and route.

**Bandwidth**
:   A LoRa radio setting. MeshCore Canada baseline raw settings use `62.5 kHz`.

**Broker**
:   An MQTT server. MeshCore.ca uses `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca` for redundant observer publishing.

**Coding Rate (CR)**
:   A LoRa error-correction setting. MeshCore Canada baseline raw settings use `CR5`.

**Companion**
:   A portable MeshCore device used with a phone, tablet, desktop app, web app, or serial client to send and receive messages.

**CoreScope**
:   The MeshCore.ca live tools for checking observers, packet flow, and map data.

**IATA Code**
:   A real 3-letter airport code used by MeshCore.ca observers to tag their region, such as `YOW`, `YYZ`, or `YVR`.

**ISM Band**
:   Industrial, Scientific, and Medical radio spectrum used by many low-power devices. You are responsible for legal operation in your location.

**JWT**
:   JSON Web Token. MeshCore.ca MQTT paths use token authentication instead of a static username/password.

**LoRa**
:   Long Range radio modulation used by MeshCore devices.

**Mesh Network**
:   A network where devices can relay traffic for each other instead of depending on one central access point.

**MQTT**
:   A lightweight publish/subscribe messaging protocol used by MeshCore.ca observers to publish packet telemetry.

**Node**
:   Any MeshCore device on the network.

**Observer**
:   A MeshCore radio or host service that publishes mesh packet telemetry to MQTT for live tools.

**Path Hash Mode**
:   The MeshCore setting that controls advert path identifier size. MeshCore Canada recommends **3-byte**, which is `set path.hash.mode 2` in the CLI.

**Preset**
:   A named group of radio settings. MeshCore Canada generally uses `USA/Canada (Recommended)`.

**Repeater**
:   A fixed device that relays packets to extend mesh coverage.

**Room Server**
:   A MeshCore node that hosts group chat rooms. It may also repeat or observe traffic depending on its configuration.

**SNR**
:   Signal-to-noise ratio, a measure of received signal quality.

**Spreading Factor (SF)**
:   A LoRa setting that affects range, airtime, and data rate. MeshCore Canada baseline raw settings use `SF7`.

**WebSockets**
:   A transport used by the MeshCore.ca MQTT brokers on port `443`, which is often easier to pass through normal internet connections.
