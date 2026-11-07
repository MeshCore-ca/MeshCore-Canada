---
title: Set up a room server
description: Flash, configure and test a MeshCore room server in Canada, all on one page.
audience:
  - room-server-operator
task: start-room-server
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-10-29
review_by: 2026-12-31
tested_with:
  content_baseline: 7daceca
  review_method: bilingual content and navigation checks, not physical-device testing
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Content and linked setup paths reviewed on 2026-10-29; radio and installation checks remain operator tasks.
difficulty: intermediate
estimated_time: 20-30 minutes
destructive: true
requires:
  - supported-room-server
  - data-capable-usb-cable
---

# Set up a room server

A room server hosts a shared chat room on the mesh. People log in with a guest
password and can catch up on messages they missed. It isn't a repeater: put up
a separate [repeater](../config/index.md) for coverage.

## Before you start

- **A supported device** that the [MeshCore flasher](https://meshcore.io/flasher)
  offers **Room Server** firmware for.
- **A USB cable that carries data.** Charge-only cables won't work.
- **Chrome or Edge on a computer.** The flasher needs
  [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).
- **Someone to look after it.** Decide who keeps the admin password and can
  reach the device by USB if it needs fixing.

### Used this device before? Back it up first

!!! danger "Erase Flash deletes stored room-server data"
    That includes its identity (private key), room messages, guest and admin
    access, name and radio settings.

1. Note its name, radio settings and access settings.
2. Save its private key with a supported tool. Keep it secret.
3. Keep passwords in a password manager, never in screenshots, issues or chat.

If you can't back up something you need, **stop before Erase Flash** and
[ask for help](get-help.md).

## 1. Flash the firmware

1. Connect the device to your computer by USB.
2. Open the [MeshCore flasher](https://meshcore.io/flasher) and select your
   exact board.
3. Select **Room Server** and the firmware version for that board.
4. Follow the flasher's connection steps. Use **Enter DFU Mode** only if your
   board asks for it.
5. New device or deliberate reset? Back up first, then click **Erase Flash** only
   if your board's instructions require it. For an update, leave erase off.
6. Click **Flash** and wait for the completion message before unplugging.

### Check it worked

The device restarts as a room server, and **Configure via USB** in the flasher
can connect to it.

### Recovery if flashing fails

Don't keep erasing. Leave the device connected, refresh the flasher, put the
board back in DFU mode, select the same board and **Room Server** firmware, and
try **Flash** again. If the board no longer shows up,
[ask for help](get-help.md) before trying anything else.

## 2. Name it and set passwords and radio

1. In the flasher, click **Configure via USB** and connect to the device.
2. Give it a name that doesn't reveal a private location.
3. Set a **guest password** (shared with people who should join the room) and a
   different **admin password** (kept private). Store both in a password manager.
4. Check the [community directory](../provinces/index.md) for your area's
   settings. If none are listed, choose **Canada**
   (`910.525 MHz / 62.5 kHz / SF7 / CR5`) and **3-byte** paths
   (`set path.hash.mode 2`).
5. Save and reboot.

Use **Canada** unless your community lists different settings. If Canada isn't
offered, follow the [older-preset instructions](../provinces/index.md#canada-baseline).

## Test it

Do this on the bench before you put it anywhere hard to reach.

1. Send an advert from the room server.
2. Check that a nearby companion finds it.
3. Log in from the companion with the guest password.
4. Reboot it and check that its name, passwords and radio settings stuck.

If anything fails, keep it plugged in by USB, flash it again and repeat the test.

## What's next

- Tell your [local community](../provinces/index.md) the room exists and how
  to get the guest password.
- Ask someone nearby to test it from their own companion.
- Something not working? [Get help](get-help.md).
