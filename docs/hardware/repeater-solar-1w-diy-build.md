---
title: Build a 1 W solar repeater with the Ikoka Stick
description: Parts, prices, assembly photos, wiring diagram, and optional INA3221 telemetry for MrAlders0n's Ikoka Stick solar repeater build.
audience:
  - advanced-repeater-builder
task: build-1w-solar-repeater
scope: ottawa-field-practice
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-09-09
review_by: 2026-10-17
difficulty: advanced
estimated_time: multiple days including fabrication and cure time
destructive: true
requires:
  - multimeter
  - soldering-experience
  - fabrication-experience
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20260909-1
---

<span id="experimental-1-w-solar-repeater"></span>
<span id="building-a-1w-solar-repeater-ikoka-stick"></span>

# Building a 1 W solar repeater — Ikoka Stick

By **MrAlders0n (Ottawa)** · Original guide: **January 1, 2026**

Build a solar-powered MeshCore repeater using a GOME Ikoka Stick, a junction box enclosure, and an epoxied solar panel.

**Board:** GOME Ikoka Stick (HW v0.4.0)<br>
**Power:** Waveshare Solar Power Manager (standard)<br>
**Firmware:** MeshCore

## Before you start

!!! warning "No warranty"
    This community build guide is provided without a warranty. Check continuity and polarity with a multimeter before applying power. Disconnect solar, battery, and USB power before soldering or changing wiring.

<span id="is-this-build-appropriate"></span>

!!! info "When to use a 1 W repeater"
    1 W repeaters are useful for backbone links and locations struggling to connect to the mesh. They are not needed at every site; coordinate with your local community.

!!! danger "Antenna required"
    **Attach a LoRa antenna before powering the Ikoka Stick. Transmitting without an antenna can permanently damage the radio.** Use the [MeshCore power setting for your exact Ikoka radio module](https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md#77-q-i-have-a-station-g2-or-a-heltec-v4-or-an-ikoka-stick-or-a-radio-with-an-ebyte-e22-900m30s-or-an-ebyte-e22-900m33s-module-what-should-their-transmit-power-be-set-to); a 1 W output rating is not an instruction to set TX power to 30 dBm.

<span id="bill-of-materials-to-verify"></span>

## Parts list

Prices are from the original guide dated **January 1, 2026**, not current quotes. All amounts are in Canadian dollars; check availability, shipping, and taxes before ordering.

<div class="mc-table-wrap mc-build-table mc-parts-table" markdown>

| # | Part | Qty | Price | Source |
|---|------|-----|-------|--------|
| 1 | GOME Ikoka Stick (HW v0.4.0) | 1 | $55 | [GitHub](https://github.com/ndoo/ikoka-stick-meshtastic-device) (group buy) |
| 2 | Waveshare Solar Power Manager (standard) | 1 | $15 | [Waveshare](https://www.waveshare.com/wiki/Solar_Power_Manager) |
| 3 | IP65 Junction Box, 220x170x110mm, Gray | 1 | $30 | [AliExpress](https://www.aliexpress.com/item/1005007587120013.html) |
| 4 | Solar panel, 10W/18V, 250x340mm | 1 | $35 | [Amazon](https://a.co/d/0eJo5GCr) |
| 5 | 3P1S 18650 battery pack (or 4P1S) | 1 | $25-35 | [MP&W Supply](https://mpandw.ca/) |
| 6 | Battery protection board (high/low voltage cutoff) | 1 | $8 | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off) |
| 7 | 890-960MHz 4-cavity bandpass filter, 50W (recommended) | 1 | $65 | [Alibaba](https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html) |
| 8 | 10-15cm SMA right angle to N-Type female O-ring nut cable | 1 | $6 | [AliExpress](https://www.aliexpress.com/item/1005008569444661.html) |
| 9 | 7.5cm SMA Male 90° to SMA Male 90° cable | 1 | $7 | [AliExpress](https://www.aliexpress.com/item/1005006702037541.html) |
| 10 | 0.5ft USB-A to USB-C right angle cable | 1 | $7 | [Amazon](https://a.co/d/045htrEG) |
| 11 | M3x35 spacers | 4 | | |
| 12 | M3x5 screws | 8 | | |
| 13 | Gorilla Epoxy Syringe, 25ml | 1 | $15 | [Home Depot](https://www.homedepot.ca/product/gorilla-epoxy-syringe-25ml/1000778451) |
| 14 | Waterproof vent plug (breather valve) | 1 | $2 | [AliExpress](https://www.aliexpress.com/item/1005006370919409.html) |
| 15 | Outdoor silicone caulk (clear) | 1 | $10 | Any hardware store |
| 16 | Adafruit INA3221 (optional) | 1 | $15-20 | [DigiKey](https://www.digikey.ca/en/products/detail/adafruit-industries-llc/6062/25660599) |

</div>

**Estimated total cost:** ~$280-290 without the INA3221, ~$300-310 with it. This does not include the antenna, 3D-printed parts, or mounting hardware (M3 spacers/screws).

**Alternative filter option (minimal):** Callboost 915MHz cavity filter, 26M BW, $82. [AliExpress](https://www.aliexpress.com/item/1005004468960058.html)

### Antenna

An antenna is not included in this parts list as selection will vary by deployment. It is highly recommended to use a higher dBi antenna such as a 6-8 dBi or higher with 1W builds. We have found that the Ikoka Stick does not pair well with the Alfa 5.8 dBi antenna for some reason, with several folks in Ottawa observing noticeably worse signal quality when using them together. This is not a definitive statement, just a pattern observed across multiple deployments.

For recommended antenna options, see the [GOME Repeater Omni Antennas](recommended-antenna.md#repeater-omni-antennas) page.

<span id="tools-and-downloads"></span>

## Tools required

<div class="mc-table-wrap mc-build-table" markdown>

| Tool | Notes |
|------|-------|
| Soldering iron | Fine tip recommended for I2C wiring |
| Solder + flux | |
| Multimeter | For continuity and voltage checks |
| Step drill bit | For drilling clean holes in the junction box |
| Jigsaw or rotary tool | For cutting the solar panel opening |
| 1/8" drill bit | For opening up mounting holes |
| Pencil | For marking the cutout |
| Clamps + flat piece of wood | For clamping solar panel during epoxy cure |
| Wire strippers | |

</div>

<span id="prerequisites"></span>
<span id="downloads"></span>

## Printed parts and downloads

Before starting assembly, you will need the following 3D-printed parts. Both are available for download below:

- **Mounting plate** for the junction box (holds the filter, Ikoka, and Waveshare board)
- **3P1S 18650 battery holder** (or sized to match your chosen battery configuration)

- [Mounting plate + 3P1S 18650 battery holder (combined .3mf)](files/repeater-solar-1w-diy-build-plate-and-battery-holder.3mf)
- [Mounting plate (.stl)](files/repeater-solar-1w-diy-build-plate.stl)
- [3P1S 18650 battery holder (.stl)](files/repeater-solar-1w-diy-build-3x18650-battery-holder.stl)

<span id="what-this-build-changes"></span>
<span id="assembly-stages"></span>

## Assembly steps

Keep the solar panel, battery, and USB disconnected while cutting, soldering, or changing wiring.

### Enclosure Preparation

1. Flip the solar panel face-down. On the back, locate the black junction box where the red and black power wires exit. Measure this junction box with calipers or a ruler.

2. On the **front face** of the gray junction box, use a pencil to trace a rectangle matching the solar panel junction box dimensions. Center it near the top of the panel.

3. Using a step drill bit, drill a large starter hole in the center of the traced rectangle.

4. Using a jigsaw or rotary tool, cut along the traced lines to remove the rectangular section. Clean up any rough edges.

### Mounting the Solar Panel

5. Mix a batch of Gorilla Epoxy and apply it generously across the entire front face of the junction box, covering the area where the solar panel will sit.

6. Route the solar panel's power cable through the rectangular cutout from the outside into the box.

      [![Solar panel wires routed through junction box](images/repeater-solar-1w-diy-build-1.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-1.jpg)

7. Press the solar panel onto the epoxied face of the junction box. Place a flat piece of wood across the front of the panel and use clamps on all four corners to apply even pressure. Be careful not to over-tighten, as this can crack the panel. Alternatively, lay the assembly flat on the ground with weights on the back of the box.

8. Allow the epoxy to fully cure according to the manufacturer's instructions before removing the clamps.

9. Using clear outdoor silicone caulk, apply a bead around all four edges where the solar panel meets the junction box. Smooth the caulk to create a weatherproof seal.

### Mounting Plate and Filter

10. Attach the four M3x35 spacers to the corners of the junction box mounting plate. You may need to use a 1/8" drill bit to open the holes slightly to fit M3 screws through the plate. Use the 3D-printed mount plate as a reference for hole placement.

      [![Mounting plate with spacers and filter assembled](images/repeater-solar-1w-diy-build-2.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-2.jpg)

11. Mount the RF bandpass filter to the mounting plate, positioning it roughly in the center.

12. Connect the N-Type to SMA cable to the filter's **output** port. This cable will pass through the box wall to the external antenna.

13. Determine where the N-Type connector should exit the junction box. Using a step drill bit, drill the hole, stepping up one size at a time and test-fitting after each step until the connector fits snugly.

14. Feed the N-Type connector through the box wall from the inside out and tighten the O-ring nut to secure it.

15. On the **bottom** of the junction box, drill a hole for the waterproof vent plug using the step drill bit.

16. Install the vent plug and tighten it.

      [![Filter mounted in box with N-Type, SMA cables, and vent plug installed](images/repeater-solar-1w-diy-build-3.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-3.jpg)

### Filter and Radio Preparation

17. Connect the SMA-to-SMA cable to the filter's **input** port. Finger-tighten for now.

18. **Waveshare Solar Power Manager prep (standard model):** The original build uses a wire bridge across the BOOT button pads so that output resumes after a power loss without a button press. With all power disconnected, solder a short wire across the pads on the back of the board, as shown below. This modification is specific to the standard model; do not assume the B, C, or D versions use the same circuit. Test power-loss recovery before sealing the enclosure.

      [![Boot button shorted on Waveshare Solar Power Manager](images/repeater-solar-1w-diy-build-4.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-4.jpg)

### Component Mounting

19. Outside the box (for easier access), mount the Ikoka Stick and the Waveshare Solar Power Manager to the 3D-printed mounting plate. If using the optional INA3221, mount it as well.

20. **(Optional, Adafruit INA3221)** Using a soldering iron, carefully remove the Ikoka Stick's OLED display header pins. Work slowly and gently to avoid damaging nearby components.

21. **(Optional, Adafruit INA3221)** Solder the INA3221 to the Ikoka's I2C bus using the display header pads. See the [INA3221 Wiring](#ina3221-wiring-optional) section below for the pin connections.

      [![INA3221 wired to Ikoka Stick I2C with Waveshare Solar Power Manager](images/repeater-solar-1w-diy-build-5.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-5.jpg)

22. Install the mounting plate assembly into the junction box and secure it with M3x5 screws into the M3x35 spacers.

### Battery Installation

23. Attach the 3D-printed battery holder to the inside front of the case, below where the solar panel wires enter. Use double-sided tape or epoxy to secure it.

24. If your 18650 battery pack does not have a built-in PCM (protection circuit module), wire the battery protection board between the battery and the Waveshare. Follow the polarity markings carefully.

### Power Wiring

25. **(Optional, Adafruit INA3221) Solar wiring:** Connect the solar panel positive wire to INA3221 **CH3+**. Connect CH3- to the Waveshare solar input positive. Connect the solar panel negative wire directly to the Waveshare solar input negative.

26. **(Optional, Adafruit INA3221) Battery wiring:** Connect the battery (or the PCM) positive wire to INA3221 **CH1+**. Connect CH1- to the positive pin on the Waveshare battery JST PH2.0 connector. Connect the battery negative wire directly to the negative pin on the JST PH2.0 connector. Plug the connector into the Waveshare board.

      **Note:** If you are not using the INA3221, wire the solar panel and battery directly to the Waveshare board's solar and battery inputs.

### Final Connections

27. Connect the SMA cable from the filter's input to the Ikoka Stick's SMA connector. Snug both ends with a suitable wrench without twisting the cable or overtightening. A loose RF connection will cause signal loss. Attach the external antenna before applying power.

28. Run the USB-A to USB-C cable from the Waveshare Solar Power Manager's USB output to the Ikoka Stick's USB-C input.

      *If using the Adafruit INA3221, your completed assembly should look similar to this:*

      [![Completed build with INA3221, Waveshare, and Ikoka Stick](images/repeater-solar-1w-diy-build-6.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-6.jpg)

      *Without the INA3221:*

      [![Completed build without INA3221](images/repeater-solar-1w-diy-build-7.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-7.jpg)

      *Full interior view with INA3221, battery pack, and all wiring complete:*

      [![Full interior view of completed build with INA3221](images/repeater-solar-1w-diy-build-8.jpg){ .mc-build-photo width="300" height="225" loading=lazy }](images/repeater-solar-1w-diy-build-8.jpg)

## INA3221 wiring (optional)

The Adafruit INA3221 connects to the Ikoka Stick via I2C using the **OLED display header** pads. Remove the display header pins and solder wires directly to the pads.

**I2C connection (Ikoka display header to INA3221):**

<div class="mc-table-wrap mc-build-table" markdown>

| Ikoka Display Header | INA3221 Pin | Wire |
|----------------------|-------------|------|
| Pin 1 - GND | GND | Ground |
| Pin 2 - VCC (3.3V) | VCC | Power |
| Pin 3 - SCL | SCL | Clock |
| Pin 4 - SDA | SDA | Data |

</div>

**INA3221 channel assignments:**

<div class="mc-table-wrap mc-build-table" markdown>

| Channel | Connected To | Purpose |
|---------|--------------|---------|
| CH1 | Battery | Monitor battery voltage and current draw |
| CH2 | (unused) | Available for future use |
| CH3 | Solar | Monitor solar input voltage and charging current |

</div>

**Note:** VCC on the INA3221 is the board power pin (3.3V from the Ikoka). VIN1/VIN2/VIN3 are the measurement channel inputs, not the power pin.

### Firmware build flags

MeshCore defaults to address `0x42`; the Adafruit INA3221 uses `0x40`. Keep the inherited board flags and add the sensor settings to the 30 dBm repeater environment:

```ini
[env:ikoka_stick_nrf_30dbm_repeater]
build_flags =
  ${ikoka_stick_nrf_repeater.build_flags}
  ${ikoka_stick_nrf_e22_30dbm.build_flags}
  -D TELEM_INA3221_ADDRESS=0x40
  -UENV_INCLUDE_INA219
  -D TELEM_INA3221_SHUNT_VALUE=0.05
```

The address and INA219 flags are from the original guide: they select `0x40` and disable the conflicting INA219 driver. The shunt-value flag matches the Adafruit board's **0.05 Ω** resistors so current readings use the correct scale. See [Adafruit's pinout](https://learn.adafruit.com/adafruit-ina3221-breakout/pinouts) and [MeshCore's sensor defaults](https://github.com/meshcore-dev/MeshCore/blob/main/src/helpers/sensors/EnvironmentSensorManager.cpp).

## Wiring diagram

[![Wiring diagram](images/repeater-solar-1w-diy-build-9.svg){ .mc-build-photo .mc-build-diagram width="600" height="543" loading=lazy }](images/repeater-solar-1w-diy-build-9.svg)

<span id="test-it-on-the-bench"></span>

## Check before powering on { #check-the-readings }

- Check polarity and continuity, then inspect solder joints for shorts.
- Use a protected, matched 1S battery pack and stay within the cells' charging-temperature limits.
- Confirm the antenna, filter, and RF cables are connected.
- Check that the power manager supplies the expected USB voltage before connecting the radio.
- Test that power returns after an interruption. If fitted, compare INA3221 readings with a multimeter.
- [Flash and configure the repeater](../start/repeater.md), then check that a nearby companion receives its advert before installing it.

## Troubleshooting and recovery { #recovery-and-undo }

If the unit does not start, disconnect power and recheck the wiring and BOOT-button modification. Stop using any battery that is hot, swollen, leaking, or damaged. If a firmware change fails, use the [USB recovery steps](../meshcore/flash-repeater.md#recovery-plan) after checking the power and RF connections.

<span id="maintenance"></span>

After installation, check the mounting, panel bond, seals, vent, cables, and battery condition regularly and after severe weather.

## Source

Restored from [MrAlders0n's pre-overhaul guide](https://github.com/MeshCore-ca/MeshCore-Canada/blob/76a4262a354a111d19ddf8cc4abb25b1267fd9db/docs/hardware/repeater-solar-1w-diy-build.md). The original parts, assembly sequence, photos, wiring tables, and downloads are retained. The optional telemetry example also includes the Adafruit shunt value.

For the standard power manager's limits and connector markings, see the [Waveshare manual](https://files.waveshare.com/upload/6/6c/Solar_Power_Manager_user_manual_en.pdf).
