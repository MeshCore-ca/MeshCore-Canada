---
title: Troubleshoot an observer
description: Find where your observer stopped working and ask for help without exposing secrets.
audience:
  - observer-operators
task: troubleshoot-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: intermediate
estimated_time: 15 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Troubleshoot an observer

Start with what you can see. Change one part at a time so you know what fixed it.

## Observer never appears

Check these in order:

1. **Radio:** confirm it is powered, connected to the observer method, and on the local mesh settings.
2. **Device or service:** confirm the observer process is running.
3. **Broker:** confirm the primary endpoint reports connected with TLS verification.
4. **Viewer:** wait a few minutes, refresh [CoreScope Observers](https://live.meshcore.ca/#/observers), and search the exact observer name.

Copy-safe service checks:

=== "MCtoMQTT"

    ```bash
    sudo systemctl status mctomqtt --no-pager
    sudo journalctl -u mctomqtt -n 80 --no-pager
    ```

=== "Companion capture"

    ```bash
    sudo systemctl status meshcore-capture --no-pager
    sudo journalctl -u meshcore-capture -n 80 --no-pager
    ```

=== "PyMC"

    ```bash
    sudo systemctl status pymc-repeater --no-pager
    sudo journalctl -u pymc-repeater -n 80 --no-pager
    ```

Before sharing any output, follow [What to share when asking for help](#what-to-share-when-asking-for-help).

For standalone firmware, run only these read commands in the device CLI:

```text
get name
get wifi.status
get mqtt.iata
get mqtt.status
get mqtt1.preset
get mqtt2.preset
get path.hash.mode
```

You should see Wi-Fi and at least the primary broker connected, a three-letter location code, and the `meshcore-ca-1` and `meshcore-ca-2` presets.

## Observer appears but no packets arrive

A connected broker is not packet proof.

1. Confirm the radio can hear normal nearby mesh activity.
2. Confirm packet publishing is enabled for the selected method.
3. Confirm the location code and packet topic agree.
4. Check [CoreScope Packets](https://live.meshcore.ca/#/packets) after nearby activity.

| Method | Packet setting |
|---|---|
| MQTT firmware | `get mqtt.packets` is `on`, `get bridge.enabled` is `on`, and `get mqtt.rx` is `on` |
| MCtoMQTT / companion capture | Packet topic ends in `/packets`, not only `/status` |
| PyMC | Broker `format` is `letsmesh` |
| Home Assistant | **Payload Mode** is `packet`, or older **Packets (Lets Mesh)** is enabled |
| RemoteTerm | Community MQTT packet topic is enabled |

If the radio hears nothing, resolve the radio preset, antenna, connection, or local activity before changing broker values.

## Only the backup connection fails

Compare the two entries. The backup host and token audience must both be `mqtt2.meshcore.ca`. A token for the primary host cannot authenticate to the backup.

Do not disable TLS verification to make the connection succeed.

## Observer appears in the wrong place

Check every configured location field. Use the same real three-letter [location code](iata-codes.md) in both broker entries and in the observer method.

Do not use:

- `CAN` as shorthand for Canada;
- `XXX` or `HOME`; or
- a neighbouring code merely because an older picker does not list the correct code.

Update the integration if it cannot accept the correct code.

## Observer connects and disconnects repeatedly

Check in this order:

1. stable power and USB connection;
2. host sleep or service restarts;
3. internet and DNS stability;
4. system clock accuracy;
5. repeated token, TLS, or WebSocket errors in local logs.

Record the time and time zone of one disconnect. That lets an administrator compare your report with infrastructure logs without exposing credentials.

## Home Assistant screen does not match the guide

Current screens use **Payload Mode** and a free-text location field. Older screens may use **Packets (Lets Mesh)** and a picker.

Update the integration before substituting a wrong location. If the current screen still differs, record the Home Assistant and MeshCore integration versions and ask for help.

## What to share when asking for help

If you need help, share this short report:

```text
Observer method:
Device or board:
Operating system / Home Assistant version:
Observer app, integration, or firmware version:
Location code:
Time checked (with time zone):
First failed stage: radio / observer / broker / viewer
Primary connected: yes / no / unknown
Backup connected: yes / no / not supported
Observer visible: yes / no
Recent packet visible: yes / no
Exact error after redaction:
Steps already tried:
```

Before posting, remove:

- Wi-Fi SSID and password;
- MQTT passwords, JWTs, tokens, cookies, and authorization headers;
- MeshCore private keys;
- owner email and personal contact details;
- exact home addresses or coordinates; and
- unrelated lines from full config files.

Post it in the [MeshCore Canada forum](https://forum.meshcore.ca/) or your local community's support channel. Include only the small part of the log that shows the problem.

Return to [Check your observer](verify.md) after each fix.
