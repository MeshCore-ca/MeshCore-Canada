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

Many LoRa devices with removable antennas ship with a basic factory antenna. The Ottawa mesh community has had good results with the 902–928 MHz options below.

<div class="mc-guide-status" data-status="draft" markdown>

**Check before buying.** These antennas have worked well in Ottawa and other meshes, but product revisions change. Confirm the current datasheet, connector, dimensions, mounting needs, and radio compatibility with the manufacturer before ordering.

</div>

!!! danger "Disconnect power before changing an antenna"
    Make sure your device is disconnected from power and battery when swapping an antenna. Since these devices can transmit radio signals, turning on a device without an antenna can damage it. [See more information here](https://electronics.stackexchange.com/questions/335912/can-i-break-a-radio-tranceiving-device-by-operating-it-with-no-antenna-connected){ target="_blank" rel="noopener" }.

## Check compatibility first

<ul class="mc-checklist">
  <li>The antenna is specified for the Canadian 902–928 MHz band.</li>
  <li>The connector family and polarity match: SMA and RP-SMA can look similar but do not mate electrically in the same way.</li>
  <li>The connector gender, pigtail, and feed line form one complete path.</li>
  <li>The device and mount can support the antenna's size, weight, wind load, and cable strain.</li>
  <li>Outdoor connectors can be weatherproofed and inspected without trapping water.</li>
  <li>The current product page and datasheet support the details used in your decision.</li>
</ul>

## Companion antennas

These are SMA antennas and are more compact, yet they've consistently shown excellent performance in Ottawa and other meshes. We recommend any of the options listed here.

!!! warning "SMA vs. RP-SMA"
    Pay close attention to what connection type a companion or repeater has, since some come with Reverse Polarity SMA (RP-SMA). You will need an adapter to connect your SMA antenna, or you will need to buy an RP-SMA antenna. [More information on the differences between these connectors](https://blog.linitx.com/what-are-sma-rp-sma-connectors-and-whats-the-difference/){ target="_blank" rel="noopener" }.

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

## Repeater omni antennas

These N-type antennas are intended for repeaters. The Alfa is Ottawa's common starting point, but antenna height, feed-line loss, terrain, and local RF conditions also affect coverage.

If you want something larger and higher-performing, we have tested the Seeed 1300 mm fiberglass antenna with excellent results. Please note that it is 1.3 metres long. We only recommend this antenna for repeaters installed at significant height (around 30 m AGL or higher) and intended for long-distance links or backbone use.

<div class="mc-table-wrap" markdown>

| Product | Connector | Cost (CAD) | Link |
|---|---|---|---|
| Alfa AOA-915-5ACM | N-type | $34.99 | [Amazon](https://a.co/d/ieEIQpy) |
| Seeed Studio RF Explorer 902-928MHz 8dBi, 1300mm (318020693) | N-type | $110 | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |

</div>

## Repeater directional antennas

Directional antennas are intended for fixed repeaters and long-distance point-to-point or point-to-multipoint links. All antennas listed here use N-type connectors and are suitable for permanent outdoor installations.

<div class="mc-table-wrap" markdown>

| Product | Connector | Cost (CAD) | Link |
|---|---|---|---|
| L-com HG913Y-NF | N-type | $237.17 | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

A permanent repeater antenna is a complete installation decision, not just a gain number. Include feed-line loss, connector count, pattern, local RF conditions, structure, lightning and grounding review, weather, and safe access.

*Prices were recorded when this list was compiled (check the linked page for the current price and date). They will vary by supplier and may not include shipping.*

## Antenna cables

For short, high-quality LMR-240 cables, [Infinite Cables](https://www.infinitecables.com/) in Toronto is the best source we've found. Their cables are on the expensive side, but the build quality is excellent and they offer a wide variety of lengths and connector combinations to suit any installation. Use the shortest practical cable with acceptable loss, and confirm both connectors, cable type, length, outdoor rating, bend radius, strain relief, and weather sealing.

<div class="mc-table-wrap" markdown>

| Product | Connector | Link |
|---|---|---|
| LMR-240 Ultra Flex N-Type Male to N-Type Female | N-type M to N-type F | [Infinite Cables](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465) |

</div>

## Record the decision

Before installation, record:

- antenna product and revision;
- published band and pattern;
- every connector and adapter in order;
- cable type and length;
- mounting and weatherproofing method;
- source links and the date checked; and
- the local test you will use after installation.

## Check after installation

With the enclosure still accessible, confirm the radio reports the intended settings, the feed line is not loose or sharply bent, the weather seal does not create a water path, and a local message test succeeds. Do not attribute a change in coverage to the antenna alone without repeatable before/after evidence.

## Finish the installation

For a fixed installation, continue to [mounting options](repeater-mounting-options.md). For a portable node, return to [companion choices](recommended-companions.md).
