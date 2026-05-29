# Companion Nodes

Companion nodes run dedicated companion firmware and operate as user endpoints on the MeshCore/Meshtastic network.  
Most companion nodes pair with your smartphone over BLE to provide access to the mesh.

There are also standalone companion nodes with built-in screens and input devices. These operate without a smartphone but still function as endpoints.

!!! warning "Upgrade the companion antenna"
    The included antenna performs poorly on all of these models. Plan to replace it, and upgrade to at least the Gizont on companions that support changing the antenna.
    See: [Recommended Antennas](recommended-antenna.md)

## Bluetooth Low Energy (BLE) Companions

These devices require a smartphone and the MeshCore or Meshtastic app. They connect to your phone over BLE, and you use the app to interact with the mesh. In this setup, the companion acts only as the radio, linking your phone to the mesh network.

### Pre-Built

The easiest way to get started is to buy a companion node, flash it with MeshCore/Meshtastic, and join the mesh.

The MeshCore/Meshtastic app connects to the node over Bluetooth (BLE) and is used to send and receive messages on the mesh.

!!! warning "Important ThinkNode M1 Note"
    Make sure to order an **RP-SMA Antenna** with the device.  
    **Do not accidentally buy SMA — you specifically need RP-SMA.**  
    ThinkNode uses RP-SMA for the ThinkNode M1 for some reason

The following pre-built companion nodes are popular and widely available:

!!! warning "Aliexpress bundles"
    Aliexpress usually shows the cheapest items (e.g., only the GPS module) when opening their links. Make sure you select the right bundle when adding to your cart.
   

| Product            | Notes | Link |
|--------------------|-------|------|
| **ThinkNode M1** | Compact device powered by the nRF52840 with a 1.54" screen and GPS support. Designed as a ready-to-use companion node for reliable messaging and tracking. **Note:** Has RP-SMA connector - See SMA vs. RP-SMA warning above. | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| **LilyGO T-Echo** | Compact device with onboard display and GPS. A solid ready-to-use option with minimal setup required. **Note:** Buy the non-flashed version; it’s cheaper and easy to flash MeshCore/Meshtastic using the web flasher. | [LilyGO Store](https://lilygo.cc/products/t-echo-lilygo) |
| **SenseCAP T1000-E** | Slim card-style tracker device from SeeedStudio. Portable and IP65-rated. **Note:** Range is more limited due to internal antennas. | [SeeedStudio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| **RAK WisMesh Tag** | Rugged device with GPS, integrated antennas, 1000mAh battery, and IP66 enclosure. Pre-flashed firmware for instant use. **Note:** Range is more limited due to internal antennas. | [AliExpress](https://www.aliexpress.com/item/1005009754254701.html) |

---

### Build Your Own

For hobbyists who like to source parts and assemble their own node, here is an Ottawa-friendly example build (antenna not included; see [Recommended Antennas](recommended-antenna.md)).

This is a **companion node** role and requires a smartphone.  
The MeshCore/Meshtastic app connects to the node over Bluetooth (BLE) and is used to send and receive messages on the mesh.

### Example DIY Build

| Item         | Product Name                  | Cost (CAD) | Link |
|--------------|-------------------------------|------------|------|
| **LoRa Board** | Heltec T114 (Bundle with screen & case) | $53.68 | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html)|
| **Battery**   | Makerfocus 3.7V 3000mAh LiPo - (Pack of 4), Micro JST 1.5 connection with protection board | $34.10     | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| **Antenna** | Gizont 167CM 915MHz SMA M |$6.37 | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) (Make sure you select the right antenna when opening the link)

*Approximate total cost (excluding antenna):* **$87.88 CAD**  
*Prices will vary, so please confirm with links. MakerFocus batteries are shipped from China with no duties.*

!!! warning "Case for Example DIY Build"
    The stock case included in the Heltec T114 Bundle mentioned above will not fit with the larger 3000mAh battery. For 3D-printable cases, check out **[Alley Cat’s models](https://www.printables.com/@AlleyCat/models)** — they are excellent for custom companion node builds.

If you are in the Ottawa area, you can also purchase this build fully assembled locally from [Space Hedgehog](https://space-hedgehog.com/).

---

## Standalone Nodes

There are standalone devices such as the **T-Deck**, but we recommend starting with a companion node instead.  
Standalone units tend to be more expensive, the UI is not as smooth as the mobile app, and they still have quirks and firmware limitations that can make them challenging for beginners.

### Available Standalone Devices

| Product              | Notes | Link |
|----------------------|-------|------|
| **LilyGO T-LORA Pager** | A compact standalone LoRa messaging device styled like a classic pager. Useful for simple off-grid communication without needing a smartphone. | [LilyGO Store](https://lilygo.cc/en-ca/products/t-lora-pager) |
| **LilyGO T-Deck Plus** | Updated version of the T-Deck with improved specs and refinements. Built with Meshtastic/MeshCore/Meshtastic in mind.<br>**However:** the built-in trackball is a major downside and many users dislike it. | [LilyGO Store](https://lilygo.cc/products/t-deck-plus-meshtastic) |
