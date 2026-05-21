# MeshCore FAQ

## General

??? question "What frequencies does MeshCore use in Canada?"
    MeshCore Canada communities should start with the **USA/Canada (Recommended)** preset.

    If your app or config tool shows raw radio values instead of a named preset, use:

    | Field | Value |
    |-------|-------|
    | Frequency | `910.525 MHz` |
    | Bandwidth | `62.5 kHz` |
    | Spreading Factor | `SF7` |
    | Coding Rate | `5` |

    Always check your local province or community page in case a nearby mesh publishes a different setting.

??? question "What is 3-byte path hash mode?"
    MeshCore adverts include compact path identifiers. MeshCore Canada recommends **3-byte** path hashes because larger repeater-backed networks have more room for unique identifiers than with the legacy 1-byte setting.

    In the MeshCore CLI, use:

    ```text
    set path.hash.mode 2
    ```

??? question "Do I need a ham radio license?"
    MeshCore Canada cannot give legal advice. Most Canadian MeshCore community docs assume licence-exempt LoRa operation in the appropriate ISM band, but you are responsible for using legal frequencies, power levels, antennas, and duty cycle in your location.

    If you are operating as an amateur radio station or using non-standard equipment, check the current ISED rules and local amateur radio guidance before transmitting.

??? question "What range should I expect?"
    Range depends heavily on antenna quality, height, terrain, obstructions, noise floor, and line of sight. A handheld device indoors may only cover a neighborhood. A well-placed outdoor repeater with a clear antenna view can cover much more.

    For troubleshooting, compare against a nearby known-good node before assuming the firmware or MQTT path is broken.

## Hardware

??? question "What devices are compatible with MeshCore?"
    Use devices listed by the MeshCore Flasher or by a MeshCore Canada build guide for the role you need. Compatibility varies by radio chip, flash size, board wiring, display, battery hardware, and WiFi support.

    The MeshCore.ca direct MQTT firmware path currently targets WiFi-capable LoRa boards published in the [MQTT Firmware](../analyzer/builds/mqtt-firmware.md) guide.

??? question "Can I use my Meshtastic device with MeshCore?"
    Sometimes, but it must be flashed with MeshCore firmware and supported by the MeshCore build you choose. A device running Meshtastic firmware will not join a MeshCore mesh.

    Back up any identity or configuration you care about before reflashing. Treat a first MeshCore flash as a new setup.

??? question "Which board should I buy first?"
    For a first companion, choose a board or ready-made device that is listed in the official MeshCore tools and has community support near you. For a fixed repeater or observer, prioritize stable power, a good antenna path, and remote access over display features.

## Network

??? question "How do I join an existing mesh network?"
    1. Find your local page in the [Mesh Directory](../provinces/index.md).
    2. Set the radio preset to **USA/Canada (Recommended)** unless the local page says otherwise.
    3. Set path hash mode to **3-byte**.
    4. Reboot the device after changing radio settings.
    5. Send an advert and check whether nearby users can see you.

??? question "How do I set up a new mesh in my area?"
    Use the MeshCore Canada baseline unless you have a local reason to publish a different setting:

    ```text
    set radio 910.525,62.5,7,5
    set path.hash.mode 2
    ```

    Then open an update request through [Contributing](../contributing.md) so the directory can list the community, region, status, contacts, and any setting differences.

??? question "Why does my observer show no packets?"
    A broker connection only proves the observer reached MQTT. It may still hear no mesh traffic if the radio preset is wrong, path hash mode is wrong, packet publishing is disabled, or no nearby nodes are active.

    Use [Check Your Observer](../analyzer/verify.md) and [Troubleshooting](../analyzer/troubleshooting.md) to narrow the symptom.
