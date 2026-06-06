# Flashing and Configuring a Repeater Node

This guide will help you flash a node and configure it as a MeshCore repeater.

---

## nRF52 Bootloader Update  

*(Skip this section if you are not using an nRF52-based board)*

**Important:**  
Before configuring a repeater, you must update the bootloader on **nRF52 based** boards (e.g, RAK 4631, Xiao NRF52840, Heltec T114, etc).  
Without this fix, a failed OTA update can brick the repeater and require physical recovery.

### Steps

1. Download the UF2 file (they have the 'update-' prefix) of the OTA bootloader fix for your device in the **[OTAFIX GitHub Repo](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases)**

   Examples:

      RAK 4631 -> update-wiscore_rak4631_board_bootloader-0.9.2-OTAFIX2.2-BP1.3_nosd.uf2 

      Heltec T114 -> update-heltec_t114_bootloader-0.9.2-OTAFIX2.2-BP1.3_nosd.uf2 

      Xiao NRF52840 (Used in Ikoka Stick) -> update-xiao_nrf52840_ble_sense_bootloader-0.9.2-OTAFIX2.1-BP1.2_nosd.uf2

2. Connect your repeater to your computer via USB.  
3. Double-click the button beside the USB port on the RAK board or the reset button on other boards.  
   - The green LED should turn on, indicating DFU mode (On the RAK specically this will occour).  
4. A new **USB drive** should appear on your computer.  
5. Drag the `.uf2` file into the drive.  
6. The copy will appear to fail, and the board will reboot — **this is expected**.  
7. Open **INFO.TXT** on the drive and confirm it reports bootloader version **0.9.2**.

---

## Flashing MeshCore Repeater Firmware - USB (Recommended Route)

1. Plug the device into your computer via USB.  
2. Open the **MeshCore Web Flasher**: <https://meshcore.io/flasher>  
3. Select your device hardware.  
4. Select **Repeater** as the firmware type.  
5. Click **Enter DFU Mode**.  
6. Click **Erase Flash**.  
7. Click **Flash** to install the firmware.

**Note:**  
If flashing fails after erasing, refresh the page, click **Enter DFU Mode** again, then click **Flash**.

---

## Configuring a MeshCore Repeater

1. Using a Browser that supports the [required serial connection](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility) (e.g., Google Chrome or Microsoft Edge), open the **MeshCore Web Flasher**:
   <https://meshcore.io/flasher>

2. Click the **Repeater Setup** button in the top right.

3. Connect to your repeater and check the **Show Advanced Settings** checkbox near the end so all fields below are visible.

4. Set a Location either entering Lattitude/Longitude or using the map icon.

5. Set a descriptive repeater **name** (e.g., `Callsign_R1`, `Downtown_R1`).

6. Set an **admin password** (required for MeshCore Remote Administration).

7. Apply the USA/Canada (Recommended) Preset:
   **910.525 MHz / BW 62.5 kHz / SF7 / CR5**

8. Set the advert intervals:
   1. **Advert Interval (minutes):** `60`
   2. **Flood Advert Interval (hours):** `24`
   3. **Flood Max:** `64`

9. Set **Path Hash Mode** to **3-byte (2)**.

10. *(Optional)* Set your own info (e.g., owner name or contact).

11. Click **Save Settings**, then reboot the repeater.

12. Reconnect with the configuration tool and click **Send Advert**.

If everything is working, nearby companion nodes should receive the advert.

---

**Tip:**  
After every reboot, you must **resync the repeater’s clock**.  
The repeater will still route messages without a clock, but **its adverts will be ignored** by companions that have already heard an advert from it until the time is set.

---

## Changing Repeater Private Key After Initial Setup (not always needed)

If your region is still using 1-byte mode, you may need to change your repeater's private key after you have set it up to avoid ID conflicts. If this happens, you can do it again via USB as per the [Configuring a MeshCore Repeater](#configuring-a-meshcore-repeater) section of this page, following the **[Generating a Repeater ID](generate-repeater-id.md)** instructions to pick a new ID and key.

*Optional*: If your repeater is on MeshCore Firmware v1.12.0 and up, you can set the private key remotely by logging in to the repeater console with a companion node that has admin access to your repeater. The steps are the same for USB and remote connections. If configuring remotely, make sure you have good signal to your repeater.

---
