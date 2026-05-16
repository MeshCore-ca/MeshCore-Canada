# Verify Observer Status

After setting up your observer using any of the four paths ([MQTT Firmware](builds/mqtt-firmware.md), [MCtoMQTT](builds/mctomqtt.md), [PyMC](builds/pymc.md), or [Home Assistant](builds/meshcore-ha.md)), use the links below to confirm it's online and reporting.

## Check Your Observer

- **[CoreScope Observers](https://live.meshcore.ca/#/observers)** - See all connected observers and their status
- **[CoreScope Packets](https://live.meshcore.ca/#/packets)** - Watch live packet traffic from observers
- **[MeshCore Map](https://live.meshcore.ca/#/map)** - See observers on the map

## What to Look For

Your observer should appear within a few minutes of coming online. If it doesn't show up:

1. **Check WiFi** (firmware path): Make sure the device connected to your 2.4 GHz network. Run `get wifi.status` in the CLI.
2. **Check MQTT connection** (firmware path): Run `get mqtt.status` to confirm the broker connection is active.
3. **Check the service** (USB host / PyMC): Make sure the systemd service is running:
    ```bash
    sudo systemctl status mctomqtt        # for serial hosts
    sudo systemctl status meshcore-capture # for companions
    sudo systemctl status pymc-repeater   # for PyMC
    ```
4. **Check your IATA code**: Confirm it's set correctly. Observers without a valid IATA code may not appear in filtered views.
5. **Check broker config**: Verify the broker endpoints are `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca` on port `443` with TLS and JWT auth enabled.

## Firmware Verify Commands

If you're running the MQTT firmware, run these commands in the admin CLI to check your full config:

```
get name
get mqtt.origin
get mqtt.iata
get wifi.status
get mqtt.packets
get bridge.enabled
get mqtt.rx
get mqtt.tx
get mqtt.status
get mqtt1.preset
get mqtt2.preset
get mqtt3.preset
```
