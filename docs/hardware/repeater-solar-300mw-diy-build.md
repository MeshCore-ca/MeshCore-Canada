---
title: Build a 300 mW solar repeater
description: "MrAlders0n's RAK Unify Box solar repeater: parts, prices and 22 assembly steps with photos."
audience:
  - repeater-builder
  - hardware-reviewer
task: build-300mw-solar-repeater
scope: experimental
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: one day plus sealant cure time
destructive: false
requires:
  - multimeter
  - safe-work-area
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Build a 300 mW solar repeater

By **MrAlders0n (Ottawa)** · Original guide: **January 1, 2026**

A solar-powered MeshCore repeater in the **RAK Unify Box** enclosure. Follow each
step carefully for a reliable, weatherproof build.

!!! warning "No warranty"
    This community build guide is provided without a warranty. Test everything
    with a multimeter before powering anything on. Questions? Ask **MrAlders0n**
    on the [Discord](https://discord.gg/GBCP4xdgNv).

## Parts list

Prices are from the original guide, dated **May 2026**, in Canadian dollars.
Check current prices and shipping before ordering.

<div class="mc-table-wrap" markdown>

| Item | Product | Cost (CAD) | Link |
|---|---|---|---|
| **Enclosure** | WisMesh Unify Enclosure 910422 | $72.50 | [AliExpress](https://aliexpress.com/item/1005008369061766.html) |
| **LoRa board** | RAK WisBlock RAK19003/RAK4631 (Type 6) | $36.38 | [AliExpress](https://aliexpress.com/item/1005008285698839.html) |
| **Antenna** | ALFA AOA-915-5ACM | $34.99 | [Amazon](https://www.amazon.ca/dp/B08H8J6ZV6) |
| **Antenna coax cable** | N female to IPX | $6.79 | [AliExpress](https://aliexpress.com/item/1005001920963497.html) |
| **Battery** | 3000 mAh Li-ion, Makerfocus (pack of 4, Micro JST 2.0), ships from China | $34.10 | [Makerfocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4) |
| **Battery protection** ^ | Li-ion PCM, Space Hedgehog | $6.00 | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off?variant=51646910660664) |
| **Vent** | Waterproof vent plug (M12×1.5-10) | $6.12 | [AliExpress](https://aliexpress.com/item/1005006370919409.html) |

</div>

^ The Makerfocus flat battery already includes a PCM; the extra PCM is an added
safety measure. With unprotected batteries (such as 18650 button tops), you
need a PCM.

**Approximate total: $180 CAD**

!!! tip "Using a different flat Li-ion battery"
    A battery with a different connector works too, but you need to change its
    connector to a Micro JST 2.0 and confirm the polarity (see the assembly
    steps). Example of a local battery with a Molex Picoblade 1.25 connector:
    [Space Hedgehog](https://space-hedgehog.com/products/3000mah-battery?variant=51602989875256).
    Example of a JST 2.0 connector: [Adafruit](https://www.adafruit.com/product/4714).

## Assembly steps

!!! danger "Antennas before power"
    **Always attach a LoRa antenna and the Bluetooth antenna to the RAK board
    before powering it on. Powering it without antennas can permanently damage
    the board.**

1. Unbox all the components and set them aside. Keep track of the small screws
   and fittings: they're easy to lose.
2. Mount the RAK backplate into the box with the four provided screws.
3. Drill two holes: one for the N-type antenna mount and one for the drain plug.
    - Use a step drill bit for clean holes.
    - **To find the top of the box,** flip it onto its back. The mount hole
      marked "1" is the top.
    - Drill slowly, one step at a time. Test-fit the N-type connector after each
      step until it fits snugly.
    - Do the same on the bottom of the box for the drain plug.
4. Attach the N-type antenna mount and the drain plug.
5. Connect the N-type antenna mount's cable to the LoRa IPEX connector on the
   RAK19003 board.
6. Mount the Bluetooth antenna to the side of the box with the included
   double-sided tape.
7. Connect the Bluetooth IPEX to the RAK19003 board.
8. Connect an antenna to the N-type connector, then flash and configure the RAK
   with the [repeater setup tool](../config/index.md).
9. Mount the RAK onto the backplate. It should look like this:

    [![RAK board and antenna cables mounted on the enclosure backplate](images/BuildRepeater1_MountedAll.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_MountedAll.jpeg)

10. Connect the JST PHR-2 cable to the RAK19003 battery plug, **making sure the
    polarity is correct**. Many JST cables are wired backwards.

    [![RAK19003 board layout showing the battery connector](images/RAK19003-Layout.png){ .mc-build-photo width="300" loading=lazy }](images/RAK19003-Layout.png)

11. Connect the other end of this cable to the **CHG** side of the Li-ion PCM.
    This picture shows the Voltaic Enclosures PCM we used at first; the
    recommended PCM works the same way.

    [![Li-ion PCM layout with the CHG and BATT sides labelled](images/VoltaicEnclosures_Layout.png){ .mc-build-photo width="300" loading=lazy }](images/VoltaicEnclosures_Layout.png)

12. Slide a piece of heat-shrink tubing, large enough to cover the PCM, over the
    cable before you connect the battery.
13. Connect the battery's JST PHR-2 cable to the **BATT** side of the PCM, again
    **making sure the polarity is correct**.

    [![RAK19003 wired to the PCM and battery](images/RAK19003-LayoutSolar.jpg){ .mc-build-photo width="300" loading=lazy }](images/RAK19003-LayoutSolar.jpg)

14. Heat-shrink the PCM so the whole board is covered.
15. *(Optional)* Secure the PCM to the backplate with double-sided tape, or let
    it float freely inside the box.
16. *(Optional)* Secure the battery to the backplate with double-sided tape or
    mounting hardware. It should look like this:

    [![Finished repeater interior with the battery and PCM secured](images/BuildRepeater1_Finished.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_Finished.jpeg)

17. Fit the rubber seal into the groove around the edge of the box's front plate.
18. Connect the solar panel wire from the front plate to the RAK19003. Don't let
    the seal fall out of place while you do.
19. Join the front and back plates and fasten them with the six screws. Tighten
    them securely to keep the seal weatherproof.
20. Wrap the whole N-type connector and the exposed metal part of the Alfa
    antenna with self-fusing silicone tape, or use two layers of heat-shrink.
21. Apply a bead of clear outdoor silicone caulk around the base of the N-type
    connector so water can't leak into the box.

    [![Self-fusing silicone tape wrapped around the N-type connector](images/BuildRepeater1_SelfFuseTape.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_SelfFuseTape.jpeg)
    [![Heat-shrink over the N-type connector](images/BuildRepeater1_Heatshrink.jpg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_Heatshrink.jpg)

22. *(Optional)* Add a bead of silicone caulk along the top edge of the box seal,
    between the two plates, and around the base of the antenna for extra
    waterproofing.

## Test it on the bench

Before you mount it, check that it boots, keeps its settings after a reboot, and
that a nearby companion hears its advert. If anything looks wrong, disconnect the
battery and solar panel and recheck the polarity before trying again.

**Next:** [Mounting a repeater](repeater-mounting-options.md)
