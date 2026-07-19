---
title: Change a repeater ID for a legacy 1-byte region
description: Coordinate, back up, change, verify, and restore a repeater identity only when a legacy region requires it.
audience:
  - legacy-region-operator
  - repeater-maintainer
task: change-legacy-repeater-id
scope: legacy
status: legacy
owner: docs-firmware
last_reviewed: 2026-07-19
review_by: 2026-10-17
difficulty: advanced
estimated_time: 15-30 minutes
destructive: true
requires:
  - local-region-approval
  - trusted-serial-connection
  - secure-key-storage
page_styles:
  - assets/styles/devices-builds.css
---
# Change a Repeater ID for a Legacy 1-Byte Region

<div class="mc-guide-status" data-status="legacy" markdown>

**Legacy exception.** Do not use this in the Canada 3-byte baseline. Proceed only when the local region operator confirms that the repeater remains in 1-byte mode and coordinates the new ID.

</div>

!!! warning "Legacy exception — do not use by default"
    MeshCore Canada's onboarding baseline uses 3-byte path hashes. Manually coordinating repeater IDs is only for a local region that still operates in 1-byte mode and has asked you to use this process.

- **Scope:** Local 1-byte compatibility only
- **Status:** Legacy procedure; local region approval required

## What this will change

Changing the private key changes the node identity. It can break existing administration, contact, and tracking relationships. The old key is the only identity rollback path.

## Prerequisites and backup

1. Confirm with the local region operator that the repeater must remain in 1-byte mode and that a new ID is required.
2. Connect to the repeater and record its current public key with `get public.key`.
3. Over a trusted serial connection, back up the current private key with `get prv.key` and store it as a secret in a secure location.
4. Confirm the proposed 2–6 character ID is unused in the local region's coordination record.

Never post or transmit either private key through an issue, screenshot, public chat, or log. The saved old private key is the rollback path.

## Generate and apply the key

1. Open the [MeshCore Key Generator](https://gessaman.com/mc-keygen/).
2. Enter the locally approved, unused 2–6 character ID and select **Generate Key**.
3. Confirm the generated private key is a 64-character hexadecimal value.
4. Copy it directly to the trusted repeater console without saving it in an ordinary note or chat.
5. Run, replacing the placeholder with the generated value:

    ```text
    set prv.key <PRIVATE-KEY>
    ```

6. Reboot the repeater.

## Verify and restore

After reboot, run `get public.key` and confirm its prefix matches the locally approved ID. Recheck admin access, radio settings, region configuration, adverts, and local routing before returning the repeater to service.

If verification fails, restore the backed-up old private key with `set prv.key <OLD-PRIVATE-KEY>`, reboot, and confirm the original public key and access are restored.


## Recovery

If admin access, the public-key prefix, adverts, region configuration, or routing is wrong, keep the repeater on the bench. Restore the backed-up old private key over the trusted serial connection, reboot, and confirm the complete former state before returning it to service.

## Next step

Record the locally approved ID, operator approval, old/new public-key prefixes, verification, and rollback location without recording either private key in the public maintenance record.

## Verification limits

This legacy process has no attached current firmware/version test matrix. A firmware and regional operator review is required before it can be marked verified.
