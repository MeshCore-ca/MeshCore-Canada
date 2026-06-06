# Repeaters

Repeaters form the stable backbone of the Ottawa MeshCore network.  
You can choose between **pre-built repeaters** or **DIY builds**, and both are great options.  

Pre-built units have improved a lot in reliability and price, while DIY builds remain popular for those who like full control over their hardware.

!!! warning "Upgrade the repeater antenna"
    The included antenna performs poorly on all of these models. Plan to replace it, and upgrade to at least the ALFA 5.8 dBi.
    See: [Recommended Antennas](recommended-antenna.md)
    
---

## Important Note for nRF52-Based Repeaters

If you plan to use a **nRF52** board for a repeater, you must update it to the **OTAFIX bootloader firmware**.  
Without this fix, if an OTA update fails over BLE, the repeater will enter an unusable state and require physical access to recover.

See more infomation [in the repeater flashing instructions page](../meshcore/flash-repeater.md).

---

## Pre-Built

These options come fully assembled; simply flash MeshCore and mount them in a high location to expand the mesh.

### Pre-Built Repeater Options

!!! warning "SenseCAP Solar Node P1 Notes"
    To build out a SenseCAP Solar Node P1, you need to purchase the **4 items below**: the node itself, batteries, an upgraded antenna, and the correct pigtail cable. There is now an option to replace the stock RP-SMA pigtail cable, see the last two items below.


| Product | Notes | Link |
|---------|-------|------|
| **SenseCAP Solar Node P1 w/o GPS & Battery** | Solar-powered communication node using the XIAO nRF52840 Plus + Wio-SX1262 LoRa module. Includes a 5W solar panel, IPX5 waterproofing. | [RobotShop (Canadian Store)](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery) |
| **Batteries for SenseCAP Solar Node P1 (Local Store)** | Four button-top 18650 cells, required if you purchase the P1 model without GPS & Battery. | [Motion Power & Witt Supply Co.](https://mpandw.ca/products/button-top-eve-35v-house-made) |
| **LoRa Antenna for SenseCAP Solar Node P1** | External antenna for the node. | [Amazon.ca](https://www.amazon.ca/dp/B08H8J6ZV6?ref=ppx_yo2ov_dt_b_fed_asin_title) |
| **RP-SMA to N-Type Cable (Type 2, 30 cm) for SenseCAP Solar Node P1** | Pigtail cable for connecting the node to an external antenna. Make sure to select **Type 2 (RP-SMA)** and **30 cm** when ordering. | [AliExpress](https://www.aliexpress.com/item/1005004652556159.html) |
| **Optional - Cable Assembly Coaxial SMA to I-PEX MHF1 4.724** | Pigtail cable to replace the device's stock RP-SMA to I-Pex pigtail cable. If you purchase this, you do not need to purchase an RP-SMA to N-Type Cable. | [DigiKey](https://www.digikey.ca/en/products/detail/seeed-technology-co-ltd/321990397/15277462) |
| **Optional - SMA to N-Type Cable (Type 1, 30 cm) for SenseCAP Solar Node P1** | Pigtail cable for connecting the node to an external antenna if you decide to use the SMA to I-Pex pigtail cable from DigiKey. Make sure to select **Type 1 (SMA)** and **30 cm** when ordering. | [AliExpress](https://www.aliexpress.com/item/1005004652556159.html) |

---

## Build Your Own

We have two DIY solar repeater builds. Choose based on the role the repeater will fill in the mesh.

### 300mW Solar Repeater (default)

Use this for the vast majority of deployments. It is cheaper, simpler to assemble, and fully sufficient for most rooftop, gutter, and pole-mounted locations across the city.

[300mW Solar Repeater Build Guide](./repeater-solar-300mw-diy-build.md)

### 1W Solar Repeater (backbone / long-reach)

Only build a 1W repeater when you have a specific reason to. Good reasons include backbone links between repeaters, and locations that have been proven through testing to need the extra output to reach far enough to connect to the rest of the mesh. Higher transmit power increases noise floor and battery draw.

[1W Solar Repeater Build Guide](./repeater-solar-1w-diy-build.md)

!!! tip "Not sure which to build?"
    Start with the **300mW** build. Reach out to the community first if you think you need a 1W, since location and antenna choice usually matter more than transmit power.

---
