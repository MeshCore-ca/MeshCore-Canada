# Check Your Observer

After setting up your observer using any of the four paths ([MQTT Firmware](builds/mqtt-firmware.md), [MCtoMQTT](builds/mctomqtt.md), [PyMC](builds/pymc.md), or [Home Assistant](builds/meshcore-ha.md)), use the links below to confirm it's online and reporting.

<div class="grid cards" markdown>

-   :material-eye:{ .lg .middle } **CoreScope Observers**

    ---

    See all connected observers and their current status.

    [:octicons-arrow-right-24: View Observers](https://live.meshcore.ca/#/observers)

-   :material-swap-horizontal:{ .lg .middle } **CoreScope Packets**

    ---

    Watch live packet traffic flowing through observers in real time.

    [:octicons-arrow-right-24: View Packets](https://live.meshcore.ca/#/packets)

-   :material-map-marker:{ .lg .middle } **MeshCore Map**

    ---

    See observers and nodes plotted on the map.

    [:octicons-arrow-right-24: View Map](https://live.meshcore.ca/#/map)

-   :material-wrench:{ .lg .middle } **Troubleshooting**

    ---

    Not showing up? Path-specific diagnostics for all observer types.

    [:octicons-arrow-right-24: Troubleshooting](troubleshooting.md)

</div>

Your observer should appear within a few minutes of coming online.

## First Checks

If it does not appear, start with the checks that match the symptom:

| Symptom | First check |
|---------|-------------|
| No observer entry | MQTT is connected and the IATA code is a real airport code |
| Observer appears, but no packets | Packet publishing is enabled: firmware `mqtt.packets`, HA **Payload Mode** = `packet`, or pyMC `format: letsmesh` |
| Backup broker does not connect | The token audience matches the broker host (`mqtt2.meshcore.ca` for broker 2) |
| Observer appears under the wrong city | Every broker/integration entry uses the nearest real IATA code; do not use `CAN` for Canada |

For path-specific commands and Home Assistant settings, use [Troubleshooting](troubleshooting.md).
