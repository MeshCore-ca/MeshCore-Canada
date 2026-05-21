# Analyzer & MQTT Packet Broker

MeshCore observers capture mesh traffic and publish packet telemetry to MQTT brokers, feeding CoreScope dashboards, maps, and packet inspectors. Pick the observer path that matches your hardware and host setup.

!!! tip "Observer setup checklist"
    Every observer path needs the same basics: a MeshCore radio already on the MeshCore Canada network settings, a real 3-letter IATA airport code, the MeshCore.ca broker pair, JWT token authentication, TLS on port `443`, and packet publishing enabled. If the setup screen has two broker entries, use the same IATA code on both entries.

    MeshCore Canada network settings are **USA/Canada (Recommended)**, or raw radio values `910.525 MHz / 62.5 kHz / SF7 / CR5`, with 3-byte path hashes. Fresh 2026-05-21 and newer MeshCore.ca direct MQTT firmware already includes that radio preset and the broker pair; still set `set path.hash.mode 2`, IATA, WiFi, and packet publishing during onboarding. On older images, retained preferences, or generic CLI devices, also run `set radio 910.525,62.5,7,5`.

## Choose Your Observer Path

<div class="grid cards" markdown>

-   :material-chip:{ .lg .middle } **MQTT Firmware**

    ---

    Flash observer firmware directly onto a WiFi-capable LoRa board. No host computer required after setup.

    Best for: Heltec V3, Heltec V4 OLED, and other published direct MQTT targets.

    [:octicons-arrow-right-24: MQTT Firmware Guide](builds/mqtt-firmware.md)

-   :material-usb:{ .lg .middle } **MCtoMQTT**

    ---

    Bridge a USB-connected MeshCore node to MQTT via a Linux or macOS host.

    Best for: fixed repeaters and room servers with a nearby host machine.

    [:octicons-arrow-right-24: MCtoMQTT Guide](builds/mctomqtt.md)

-   :material-language-python:{ .lg .middle } **PyMC**

    ---

    Add the MeshCore.ca broker pair to an existing pyMC repeater installation.

    Best for: Python-based repeater setups.

    [:octicons-arrow-right-24: PyMC Guide](builds/pymc.md)

-   :material-home-assistant:{ .lg .middle } **Home Assistant**

    ---

    Add MeshCore.ca brokers to the Home Assistant MeshCore integration.

    Best for: Home Assistant users with a connected MeshCore node.

    [:octicons-arrow-right-24: MeshCore-HA Guide](builds/meshcore-ha.md)

-   :octicons-terminal-24:{ .lg .middle } **RemoteTerm**

    ---

    Use RemoteTerm's Community MQTT fanout to report packets from a managed radio.

    Best for: RemoteTerm users already connected over serial, TCP, or BLE.

    [:octicons-arrow-right-24: RemoteTerm Setup](remoteterm.md)

</div>

## Shared References

<div class="grid cards" markdown>

-   :material-check-circle:{ .lg .middle } **Check Your Observer**

    ---

    Confirm your observer is online and reporting to CoreScope.

    [:octicons-arrow-right-24: Check Your Observer](verify.md)

-   :material-wrench:{ .lg .middle } **Troubleshooting**

    ---

    Path-specific diagnostics for firmware, host bridges, PyMC, Home Assistant, and RemoteTerm.

    [:octicons-arrow-right-24: Troubleshooting](troubleshooting.md)

-   :material-server-network:{ .lg .middle } **Broker Reference**

    ---

    Broker hosts, ports, TLS, JWT audience, and topic conventions.

    [:octicons-arrow-right-24: Broker Details](broker-reference.md)

-   :material-airplane:{ .lg .middle } **IATA Codes**

    ---

    Canadian quick-list codes and guidance for choosing a real region code.

    [:octicons-arrow-right-24: IATA Region Codes](iata-codes.md)

</div>

## Fast Path

If you are unsure which path to choose:

| Situation | Start here |
|-----------|------------|
| You have a WiFi-capable LoRa board and want a standalone observer | [MQTT Firmware](builds/mqtt-firmware.md) |
| You have a repeater connected to a Linux/macOS host over USB | [MCtoMQTT](builds/mctomqtt.md) |
| You already run pyMC | [PyMC](builds/pymc.md) |
| You already use Home Assistant for MeshCore | [MeshCore-HA](builds/meshcore-ha.md) |
| You already manage the radio with RemoteTerm | [RemoteTerm](remoteterm.md) |

After setup, use [Check Your Observer](verify.md). If it does not appear within a few minutes, use [Troubleshooting](troubleshooting.md).
