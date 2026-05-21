# Broker Reference

All MeshCore.ca observer paths publish to the same redundant broker pair.

| Broker | Host | Port | Transport | TLS | Token audience |
|--------|------|------|-----------|-----|----------------|
| Primary | `mqtt1.meshcore.ca` | `443` | WebSockets | Enabled + verified | `mqtt1.meshcore.ca` |
| Backup | `mqtt2.meshcore.ca` | `443` | WebSockets | Enabled + verified | `mqtt2.meshcore.ca` |

Use JWT token authentication where the setup tool exposes it. Do not set a static MQTT password unless a path-specific guide tells you to.

## Topic Pattern

Most observer paths publish packet telemetry under this pattern:

```text
meshcore/{IATA}/{PUBLIC_KEY}/packets
```

Status topics generally use:

```text
meshcore/{IATA}/{PUBLIC_KEY}/status
```

`{IATA}` must be a real 3-letter airport code nearest to the observer. `{PUBLIC_KEY}` is supplied by the MeshCore node or integration.

## Payload Mode

MeshCore.ca packet visibility needs packet payload publishing, not only status publishing.

| Path | Required packet setting |
|------|-------------------------|
| MQTT firmware | `set mqtt.packets on`, `set bridge.enabled on`, `set mqtt.rx on`, `set mqtt.tx advert` |
| MCtoMQTT | Broker config created by the MeshCore.ca helper |
| Companion capture | `PACKETCAPTURE_MQTT*_TOPIC_PACKETS` configured |
| PyMC | `format: letsmesh` |
| Home Assistant | **Payload Mode** = `packet`, or older **Packets (Lets Mesh)** enabled |
| RemoteTerm | Community MQTT packet topic template enabled |

## Common Broker Mistakes

| Symptom | Likely cause |
|---------|--------------|
| Primary connects, backup fails | Backup token audience still set to `mqtt1.meshcore.ca` |
| Observer appears under the wrong city | IATA field is wrong or inconsistent between broker entries |
| Broker connects but no packets appear | Status is publishing, but packet payload mode is not enabled |
| Nothing appears | Radio is off the local mesh, IATA code is invalid, or outbound WSS is blocked |

For path-specific commands, use [Troubleshooting](troubleshooting.md).
