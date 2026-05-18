# Analyzer & MQTT Packet Broker

MeshCore observers capture mesh traffic and publish it to MQTT brokers, feeding telemetry dashboards, maps, and packet inspectors. Pick one of the four observer paths below to start reporting to the MeshCore.ca network.

!!! tip "Observer setup checklist"
    Every observer path needs the same basics: a MeshCore radio already on the MeshCore Canada network settings, a real 3-letter IATA airport code, the MeshCore.ca broker pair, JWT token authentication, TLS on port `443`, and packet publishing enabled. If the setup screen has two broker entries, use the same IATA code on both entries.

    MeshCore Canada network settings are **USA/Canada (Recommended)**, or raw radio values `910.525 MHz / 62.5 kHz / SF7 / CR5`, with 3-byte path hashes. On MeshCore CLI devices, set that with `set radio 910.525,62.5,7,5` and `set path.hash.mode 2`.

    For Home Assistant, packet publishing means **Payload Mode** = `packet` or the older **Packets (Lets Mesh)** option enabled. For firmware, run the full CLI command block in the firmware guide so radio, path hash, `mqtt.packets`, `bridge.enabled`, `mqtt.rx`, and `mqtt.tx` are set.

## Choose Your Observer Path

<div class="grid cards" markdown>

-   :material-chip:{ .lg .middle } **MQTT Firmware**

    ---

    Flash observer firmware directly onto a board. Connects to WiFi and reports to MQTT with no host computer needed.

    Best for: Heltec V3, V4, and other standalone ESP32 devices.

    [:octicons-arrow-right-24: MQTT Firmware Guide](builds/mqtt-firmware.md)

-   :material-usb:{ .lg .middle } **MCtoMQTT (USB Host)**

    ---

    Bridge a USB-connected MeshCore node to MQTT via a Linux or macOS host. Also supports companion radios over BLE, serial, or TCP.

    Best for: Repeaters and room servers with a host machine.

    [:octicons-arrow-right-24: MCtoMQTT Guide](builds/mctomqtt.md)

-   :material-language-python:{ .lg .middle } **PyMC**

    ---

    Add the MeshCore.ca broker pair to an existing pyMC repeater installation via YAML config.

    Best for: Python-based repeater setups.

    [:octicons-arrow-right-24: PyMC Guide](builds/pymc.md)

-   :material-home-assistant:{ .lg .middle } **Home Assistant**

    ---

    Add MeshCore.ca brokers to the HA MeshCore integration for mesh telemetry on your dashboards.

    Best for: Home Assistant users with a connected MeshCore node.

    [:octicons-arrow-right-24: MeshCore-HA Guide](builds/meshcore-ha.md)

-   :octicons-terminal-24:{ .lg .middle } **RemoteTerm**

    ---

    Use RemoteTerm's Community MQTT fanout to make a companion radio report raw packets to MeshCore.ca.

    Best for: RemoteTerm users already managing a radio over serial, TCP, or BLE.

    [:octicons-arrow-right-24: RemoteTerm Setup](#remoteterm-for-meshcore)

</div>

---

<div class="grid cards" markdown>

-   :material-check-circle:{ .lg .middle } **Check Your Observer**

    ---

    Confirm your observer is online and reporting to the MeshCore.ca network.

    [:octicons-arrow-right-24: Check Your Observer](verify.md)

-   :material-server-network:{ .lg .middle } **Broker Details**

    ---

    All paths use the same redundant pair. JWT auth, TLS, no password needed.

    `mqtt1.meshcore.ca` :octicons-arrow-switch-24: `mqtt2.meshcore.ca` (port 443, WSS)

</div>

---

## RemoteTerm For MeshCore

[RemoteTerm for MeshCore](https://github.com/jkingsman/Remote-Terminal-for-MeshCore) can act as an observer by forwarding raw RF packets through its **Community MQTT/meshcoretomqtt** integration. This does not publish decrypted messages.

Install and start RemoteTerm using the upstream instructions, connect your MeshCore radio over serial, TCP, or BLE, then open the RemoteTerm web UI.

In RemoteTerm, open **Settings** -> **MQTT & Automation**, add **Community MQTT/meshcoretomqtt**, and use these values:

| Field | Value |
|-------|-------|
| Name | `MeshCore.ca 1` or any descriptive name |
| Broker Host | `mqtt1.meshcore.ca` |
| Broker Port | `443` |
| Transport | `WebSockets` |
| Authentication | `Token` |
| WebSocket Path | `/` |
| Token Audience | `mqtt1.meshcore.ca` or leave blank to default to the broker host |
| Owner Email | Optional |
| Use TLS | Enabled |
| Verify TLS certificates | Enabled |
| Region Code (IATA) | Your nearest real 3-letter IATA airport code |
| Packet Topic Template | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

Click **Save as Enabled**. To publish to the redundant broker as well, add a second Community MQTT integration with the same settings, but set **Broker Host** and **Token Audience** to `mqtt2.meshcore.ca`.

![RemoteTerm Community MQTT settings for MeshCore.ca](../assets/mcterm.png)

!!! note "Windows MQTT fanout"
    If you run RemoteTerm on Windows and enable MQTT fanout, start Uvicorn with `--loop none` as described in the RemoteTerm README so the MQTT client can connect reliably.

---

## IATA Region Codes

Each observer identifies its region with a real 3-letter IATA airport code. Use the airport code nearest to your location.

The firmware and helper scripts are not limited to the list below. If your nearest real IATA code is missing here, you can still use it and the public broker will accept it as long as it is a valid airport code. The live site will add observed regions to the picker automatically, but codes missing from the friendly-name list may appear as the bare code until we add a label.

Do not use placeholders or made-up region names such as `XXX` or `HOME`. Do not use `CAN` as shorthand for Canada; it is a real airport code for Guangzhou and will tag your observer to the wrong region.

The following Canadian codes are listed for quick selection today. Host-side helper scripts show this same list interactively when you omit `--iata`.

??? note "Ontario"

    | Code | Region |
    |------|--------|
    | YYZ | Toronto (Pearson) |
    | YTZ | Toronto (Billy Bishop) |
    | YOW | Ottawa |
    | YHM | Hamilton |
    | YKF | Kitchener / Waterloo |
    | YXU | London |
    | YOO | Oshawa |
    | YKZ | Buttonville / Markham |
    | YAM | Sault Ste. Marie |
    | YQT | Thunder Bay |
    | YSB | Sudbury |
    | YTS | Timmins |
    | YQG | Windsor |
    | YYB | North Bay |
    | YGK | Kingston |
    | YPQ | Peterborough |
    | YTR | Trenton / Quinte West |
    | YHD | Dryden |
    | YPL | Pickle Lake |
    | YND | Gatineau (Ottawa area) |

??? note "Quebec"

    | Code | Region |
    |------|--------|
    | YUL | Montreal (Trudeau) |
    | YMX | Montreal (Mirabel) |
    | YQB | Quebec City |
    | YBG | Bagotville / Saguenay |
    | YVO | Val-d'Or |
    | YHU | Montreal (St-Hubert) |
    | YRJ | Roberval |
    | YGL | La Grande Riviere |
    | YSC | Sherbrooke |
    | YTQ | Tasiujaq |
    | YUY | Rouyn-Noranda |
    | YZV | Sept-Iles |
    | YGP | Gaspe |
    | YRQ | Trois-Rivieres |

??? note "British Columbia"

    | Code | Region |
    |------|--------|
    | YVR | Vancouver |
    | YYJ | Victoria |
    | YXX | Abbotsford / Fraser Valley |
    | YLW | Kelowna |
    | YXS | Prince George |
    | YPR | Prince Rupert |
    | YXT | Terrace |
    | YQQ | Comox / Courtenay |
    | YCD | Nanaimo |
    | YYD | Smithers |
    | YDQ | Dawson Creek |
    | YXJ | Fort St. John |
    | YYF | Penticton |
    | YCG | Castlegar |
    | YKA | Kamloops |
    | YXC | Cranbrook |
    | YBC | Baie-Comeau |

??? note "Alberta"

    | Code | Region |
    |------|--------|
    | YYC | Calgary |
    | YEG | Edmonton |
    | YMM | Fort McMurray |
    | YQU | Grande Prairie |
    | YQL | Lethbridge |
    | YXH | Medicine Hat |

??? note "Saskatchewan"

    | Code | Region |
    |------|--------|
    | YQR | Regina |
    | YXE | Saskatoon |
    | YPA | Prince Albert |

??? note "Manitoba"

    | Code | Region |
    |------|--------|
    | YWG | Winnipeg |
    | YBR | Brandon |
    | YTH | Thompson |
    | YDN | Dauphin |
    | YPG | Portage la Prairie |

??? note "New Brunswick"

    | Code | Region |
    |------|--------|
    | YFC | Fredericton |
    | YSJ | Saint John |
    | YQM | Moncton |
    | ZBF | Bathurst |

??? note "Nova Scotia"

    | Code | Region |
    |------|--------|
    | YHZ | Halifax |
    | YQY | Sydney |
    | YQI | Yarmouth |

??? note "Prince Edward Island"

    | Code | Region |
    |------|--------|
    | YYG | Charlottetown |

??? note "Newfoundland and Labrador"

    | Code | Region |
    |------|--------|
    | YYT | St. John's |
    | YQX | Gander |
    | YDF | Deer Lake |
    | YYR | Goose Bay |
    | YWK | Wabush |

??? note "Territories (YT / NT / NU)"

    | Code | Region |
    |------|--------|
    | YXY | Whitehorse (Yukon) |
    | YZF | Yellowknife (NWT) |
    | YFB | Iqaluit (Nunavut) |
    | YEV | Inuvik (NWT) |
    | YHY | Hay River (NWT) |
