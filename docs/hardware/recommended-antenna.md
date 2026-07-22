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
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-15 minutes
destructive: false
requires:
  - confirmed-radio-band
  - confirmed-device-connector
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choose an antenna and feed line

Start with the radio, connector, and installation. Then compare antennas that cover the Canadian 902–928 MHz band.

<div class="mc-guide-status" data-status="draft" markdown>

**Check before buying.** The products below are examples to compare, not verified performance recommendations. Confirm the current datasheet, connector, dimensions, mounting needs, and radio compatibility.

</div>

!!! danger "Disconnect power before changing an antenna"
    Do not power or transmit from a radio without the correct antenna attached. Disconnect USB and battery power before connecting or removing an antenna, and follow the radio manufacturer's instructions.

## Check compatibility first

<ul class="mc-checklist">
  <li>The antenna is specified for the Canadian 902–928 MHz band.</li>
  <li>The connector family and polarity match: SMA and RP-SMA can look similar but do not mate electrically in the same way.</li>
  <li>The connector gender, pigtail, and feed line form one complete path.</li>
  <li>The device and mount can support the antenna's size, weight, wind load, and cable strain.</li>
  <li>Outdoor connectors can be weatherproofed and inspected without trapping water.</li>
  <li>The current product page and datasheet support the details used in your decision.</li>
</ul>

## Portable antennas to compare

Confirm whether the radio uses SMA, RP-SMA, or an internal connector before ordering.

<div class="mc-table-wrap" markdown>

| Product | Listed connector | Check | Source |
|---|---|---|---|
| LINX ANT-916-CW-HW-SMA | SMA | Frequency range, mating connector, dimensions, and device support | [DigiKey](https://www.digikey.ca/en/products/detail/te-connectivity-linx/ANT-916-CW-HW-SMA/2694126?s=N4IgTCBcDaIDIEkByANABAQSQFQLQE4BGANlwGEB1XACSoGUBZDEAXQF8g) |
| Taoglas TI.09.A.0111 | SMA | Frequency range, mating connector, dimensions, and device support | [DigiKey](https://www.digikey.ca/en/products/detail/taoglas-limited/TI-09-A-0111/2332695?s=N4IgTCBcDaICoEMD2BzANggzgAjgSQDoAGATgIEFiBGGkAXQF8g) |
| Seeed Studio LoRa Antenna Kit | SMA | Frequency range, exact kit contents, mating connector, and device support | [Seeed Studio](https://www.seeedstudio.com/LoRa-Antenna-Kit-for-reTerminal-DM-p-5714.html) |

</div>

## Fixed antennas to compare

A permanent repeater antenna is a complete installation decision, not just a gain number. Include feed-line loss, connector count, pattern, local RF conditions, structure, lightning/grounding review, weather, and safe access.

<div class="mc-table-wrap" markdown>

| Product | Type | Listed connector | Check | Source |
|---|---|---|---|---|
| Seeed Studio 318020693 | Fiberglass omnidirectional | N-type | Frequency range, pattern, dimensions, wind load, mount, and cable path | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |
| L-com HG913Y-NF | Directional | N-type | Frequency range, pattern, aiming, wind load, mount, and cable path | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

## Choose the feed line

Use the shortest practical cable with acceptable loss. Confirm both connectors, cable type, length, loss at the operating frequency, outdoor rating, bend radius, strain relief, and weather sealing. [Infinite Cables](https://www.infinitecables.com/) is one Canadian source for assembled RF cables; its [LMR-240 Ultra Flex N-type example](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465) may not match your required connectors.

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
