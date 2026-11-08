---
title: Choose an antenna and feed line
description: Choose a 902–928 MHz antenna and cable by checking connector fit, loss, mounting, and site needs.
audience:
  - companion-owner
  - repeater-builder
task: choose-antenna
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-09-03
review_by: 2027-03-02
difficulty: intermediate
estimated_time: 10-15 minutes
destructive: false
requires:
  - confirmed-radio-band
  - confirmed-device-connector
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choose an antenna and feed line

Antennas Canadian communities have had good results with. All are for the
902–928 MHz band.

- **Power off before you swap an antenna.** Running a radio without one can
  damage it.
- **Match the connector.** SMA and RP-SMA look alike but don't fit each other;
  check which one your device has.

## Companion antennas

Compact SMA antennas for handheld and portable devices.

<div class="mc-table-wrap" markdown>

| Product | Connector | Cost (CAD) | Link |
|---|---|---|---|
| Gizont 915 MHz SMA M | SMA | $12 | [Space Hedgehog (local store)](https://space-hedgehog.com/products/gizont-915mhz-antenna?variant=51602989711416) |
| Gizont 915 MHz SMA M | SMA | $10.53 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| Gizont 915 MHz RP-SMA M | RP-SMA | $10.53 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| LINX ANT-916-CW-HW-SMA | SMA | $14.65 | [DigiKey](https://www.digikey.ca/en/products/detail/te-connectivity-linx/ANT-916-CW-HW-SMA/2694126?s=N4IgTCBcDaIDIEkByANABAQSQFQLQE4BGANlwGEB1XACSoGUBZDEAXQF8g) |
| Taoglas TI.09.A.0111 | SMA | $17.47 | [DigiKey](https://www.digikey.ca/en/products/detail/taoglas-limited/TI-09-A-0111/2332695?s=N4IgTCBcDaICoEMD2BzANggzgAjgSQDoAGATgIEFiBGGkAXQF8g) |
| Seeed Studio LoRa Antenna Kit | SMA | $6.79 | [Seeed Studio](https://www.seeedstudio.com/LoRa-Antenna-Kit-for-reTerminal-DM-p-5714.html) |

</div>

## Repeater antennas

Omnidirectional N-type antennas for repeaters. The Alfa is a good starting point.
The Seeed is 1.3 metres long: use it only on high sites (around 30 m above
ground or more) for long-distance links.

<div class="mc-table-wrap" markdown>

| Product | Connector | Cost (CAD) | Link |
|---|---|---|---|
| Alfa AOA-915-5ACM | N-type | $34.99 | [Amazon](https://a.co/d/ieEIQpy) |
| Seeed Studio RF Explorer 902-928MHz 8dBi, 1300mm (318020693) | N-type | $110 | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |

</div>

For fixed long-distance links, a directional antenna:

<div class="mc-table-wrap" markdown>

| Product | Connector | Cost (CAD) | Link |
|---|---|---|---|
| L-com HG913Y-NF | N-type | $237.17 | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

## Antenna cables

Use the shortest cable that reaches. [Infinite Cables](https://www.infinitecables.com/)
in Toronto makes good-quality LMR-240 cables in many lengths and connector
combinations.

<div class="mc-table-wrap" markdown>

| Product | Connector | Link |
|---|---|---|
| LMR-240 Ultra Flex N-Type Male to N-Type Female | N-type M to N-type F | [Infinite Cables](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465) |

</div>

*Prices are dated to when this list was compiled; check the linked pages for
current prices and shipping.*

**Next:** [Mounting a repeater](repeater-mounting-options.md) · [Companions](recommended-companions.md)
