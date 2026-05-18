# MeshCore FAQ

!!! info "This page is a work in progress"
    Content coming soon. Want to help? See [Contributing](../contributing.md).

## General

<!-- TODO: Common questions about MeshCore -->

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

??? question "Do I need a ham radio license?"
    <!-- TODO: License requirements for different power levels -->

??? question "What is the range I can expect?"
    <!-- TODO: Typical ranges, factors that affect range -->

## Hardware

<!-- TODO: Hardware-related questions -->

??? question "What devices are compatible with MeshCore?"
    <!-- TODO: List of supported boards -->

??? question "Can I use my Meshtastic device with MeshCore?"
    <!-- TODO: Compatibility info -->

## Network

<!-- TODO: Network and mesh questions -->

??? question "How do I join an existing mesh network?"
    Set your radio preset to **USA/Canada (Recommended)**, then set path hash mode to **3-byte**. Companions, repeaters, room servers, and observers all need compatible radio settings before they can hear each other.

    On devices with MeshCore CLI access, the 3-byte setting is:

    ```text
    set path.hash.mode 2
    ```

??? question "How do I set up a new mesh in my area?"
    Use the MeshCore Canada baseline unless you have a local reason to publish a different setting:

    ```text
    set radio 910.525,62.5,7,5
    set path.hash.mode 2
    ```

    Publish the chosen settings clearly on your community page so new users know which preset to pick.
