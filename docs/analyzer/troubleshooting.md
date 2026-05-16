# Troubleshooting

If your observer doesn't show up on [CoreScope](https://live.meshcore.ca/#/observers), work through these checks based on your setup path.

## MQTT Firmware

Run these in the device's admin CLI:

| Command | What to check |
|---------|---------------|
| `get wifi.status` | Should show connected to your 2.4 GHz network |
| `get mqtt.status` | Should show an active broker connection |
| `get mqtt.iata` | Should return your 3-character IATA code |
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

## PyMC

```bash
sudo systemctl status pymc-repeater
```

Check that your `mqtt.iata_code` is set and the broker block is present in `/etc/pymc_repeater/config.yaml`.

## Home Assistant

Go to **Settings** > **Devices & Services** > **MeshCore** > **Configure** > **Manage MQTT Brokers** and confirm both brokers show as connected. Make sure your IATA code is set in the integration.

## Still Not Working?

If everything looks correct but your observer still doesn't appear, double check that your device has internet access and can reach `mqtt1.meshcore.ca` on port 443. Firewalls or network restrictions on outbound WebSocket connections are the most common blocker.
