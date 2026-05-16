# Analyzer & MQTT Packet Broker

MeshCore observers capture mesh traffic and publish it to MQTT brokers, feeding telemetry dashboards, maps, and packet inspectors. This section covers the four ways to connect an observer to the MeshCore.ca broker pair.

## MeshCore.ca Brokers

All observer paths connect to the same two brokers for redundancy. Both use JWT token authentication and TLS verification. No username or password is needed.

| | Primary | Backup |
|---|---------|--------|
| **Host** | `mqtt1.meshcore.ca` | `mqtt2.meshcore.ca` |
| **Port** | 443 | 443 |
| **Transport** | WebSockets (TLS) | WebSockets (TLS) |

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

</div>

## Verify Your Observer

After setting up any observer path, head to [Verify Observer Status](verify.md) to confirm it's online and reporting correctly.

---

## IATA Region Codes

Each observer identifies its region with a 3-character IATA code. Use the airport code nearest to your location. The following codes are supported on [live.meshcore.ca](https://live.meshcore.ca) today.

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
