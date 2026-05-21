# Troubleshooting

If your observer doesn't show up on [CoreScope](https://live.meshcore.ca/#/observers), work through these checks based on your setup path.

## MQTT Firmware

Run these in the device's admin CLI:

| Command | What to check |
|---------|---------------|
| `get wifi.status` | Should show connected to your 2.4 GHz network |
| `get mqtt.status` | Should show an active broker connection |
| `get mqtt.iata` | Should return your real 3-letter IATA airport code |
| `get mqtt.packets` | Should be `on` for packet publishing |
| `get bridge.enabled` | Should be `on` for bridge publishing |
| `get mqtt.rx` / `get mqtt.tx` | Should match the firmware guide setup |
| `get mqtt1.preset` | Should show `custom` (not `none`) |
| `get mqtt2.preset` | Should show `custom` (not `none`) |
| `get name` | Should return the node name you set |

??? note "Full verify command block"

    ```text
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

## MCtoMQTT / Companion (USB Host)

Check that the systemd service is running:

```bash
# Serial host
sudo systemctl status mctomqtt

# Companion
sudo systemctl status meshcore-capture
```

If the service is running but nothing appears, check the config drop-in:

```bash
# Serial host
cat /etc/mctomqtt/config.d/20-meshcore-ca.toml

# Companion
cat ~/.meshcore-packet-capture/.env.local
```

Confirm the broker hosts are `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca`.

Also confirm the observer path is publishing packet payloads, not only status. For companion capture, `PACKETCAPTURE_MQTT1_TOPIC_PACKETS` and `PACKETCAPTURE_MQTT2_TOPIC_PACKETS` should use `meshcore/{IATA}/{PUBLIC_KEY}/packets`.

## IATA Code Problems

Use a real 3-letter IATA airport code such as `YOW`, `YKF`, or `YYZ`. The firmware may accept any text, but the public broker rejects placeholders and made-up region names such as `XXX` or `HOME`. Do not use `CAN` as shorthand for Canada; it is a real airport code for Guangzhou and will tag your observer to the wrong region.

If your code is not on the quick list, that does not automatically mean it is unsupported. It can still work if it is a real IATA airport code. Make sure every component uses the same code:

| Component | Where to check |
|-----------|----------------|
| MQTT firmware | `get mqtt.iata` |
| MCtoMQTT | `/etc/mctomqtt/config.d/20-meshcore-ca.toml` |
| Companion capture | `PACKETCAPTURE_IATA` in `~/.meshcore-packet-capture/.env.local` |
| Home Assistant | MeshCore integration region/IATA field |
| RemoteTerm | Community MQTT region/IATA field |

## PyMC

```bash
sudo systemctl status pymc-repeater
```

Check that your `mqtt.iata_code` is set and the broker block is present in `/etc/pymc_repeater/config.yaml`.

## Home Assistant

Go to **Settings** > **Devices & Services** > **MeshCore** > **Configure** > **Manage MQTT Brokers** and confirm both brokers show as connected. Make sure your IATA code is set in the integration.

If the brokers connect but packets never appear, check the packet payload setting. Some Home Assistant MeshCore versions label this as **Packets (Lets Mesh)**; newer versions expose it as **Payload Mode**. It must be enabled/set to `packet` for MeshCore.ca packet visibility.

If a code such as `YTR` is missing from a picker, update the MeshCore Home Assistant integration and type the code into **Broker IATA Code**. Using a nearby code such as `YGK` can make data visible, but it tags the observer to the wrong region.

| HA symptom | Check |
|------------|-------|
| Broker connected, no packets | **Packets (Lets Mesh)** enabled or **Payload Mode** = `packet` |
| Cannot enter a real IATA code | Update MeshCore-HA; current versions use free text |
| Backup broker fails | `Token Audience` must match the broker host (`mqtt2.meshcore.ca`) |
| Observer appears under the wrong city | Both broker entries use the same nearest real IATA code |

## RemoteTerm

Open **Settings** -> **MQTT & Automation** and confirm each Community MQTT entry:

| Field | Expected value |
|-------|----------------|
| Broker Host | `mqtt1.meshcore.ca` or `mqtt2.meshcore.ca` |
| Broker Port | `443` |
| Transport | `WebSockets` |
| Authentication | `Token` |
| TLS | Enabled and verified |
| Region Code | Your nearest real IATA code |
| Packet Topic Template | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

If the primary entry works and the backup does not, check the second entry's token audience. It must be `mqtt2.meshcore.ca`.

## Still Not Working?

If everything looks correct but your observer still doesn't appear, double check that your device has internet access and can reach `mqtt1.meshcore.ca` on port 443. Firewalls or network restrictions on outbound WebSocket connections are the most common blocker.
