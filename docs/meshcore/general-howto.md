---
title: Use common MeshCore app tools
description: Share a contact, import a contact, trace a path, and inspect heard repeats in the MeshCore app.
audience:
  - companion-user
  - meshcore-user
task: use-meshcore-app-tools
scope: upstream-meshcore
status: draft
owner: docs-app
last_reviewed: 2026-07-19
review_by: 2026-10-19
difficulty: beginner
estimated_time: 5-15 minutes
destructive: false
---

# Use common MeshCore app tools

Choose the task you need. These screenshots show one MeshCore mobile app
layout; names and positions may move in another app version.

- [Share your contact link](#share-your-contact-link)
- [Import a contact link](#import-a-contact-link)
- [Trace a path](#trace-a-path)
- [Check heard repeats](#check-heard-repeats)

<div class="mc-preflight" markdown>

**Before you start**

- Connect the app to your companion.
- Confirm the companion can send and receive locally.
- Do not post private keys, passwords, or precise private locations in a shared
  screenshot.

</div>

## Share your contact link

Use this when another person needs to add you as a contact.

1. Open the MeshCore app and connect to your companion.

2. Open the **Signal** screen.

    ![Signal control in the MeshCore app](images/MeshCore_GetContactID1.png){ loading=lazy width="300" }

3. Select **Advert**, then **To Clipboard**.

    ![Advert menu with the To Clipboard action](images/MeshCore_GetContactID2.png){ loading=lazy width="300" }

4. Paste the contact link into the conversation where you intend to share it.

<div class="mc-result" data-state="success" markdown>

**Expected result:** the clipboard contains a contact link that another
MeshCore user can import.

</div>

## Import a contact link

Use this after another person sends you their MeshCore contact link.

1. Copy only the contact link, then connect the app to your companion.

2. Open the **three-dot** menu.

    ![Three-dot menu in the MeshCore app](images/MeshCore_AddContactMan1.png){ loading=lazy width="300" }

3. Select **Add Contact**.

    ![Add Contact action](images/MeshCore_AddContactMan2.png){ loading=lazy width="300" }

4. Select **Import from Clipboard Link**.

    ![Import from Clipboard Link action](images/MeshCore_AddContactMan3.png){ loading=lazy width="300" }

5. Wait for the success message and the new-contact notice.

    ![Successful contact import message](images/MeshCore_AddContactMan5.png){ loading=lazy width="300" }

<div class="mc-result" data-state="success" markdown>

**Expected result:** the named contact appears in your contact list.

</div>

If the import fails, copy the original link again without extra words or
punctuation. Ask the sender for a new link if it still fails.

## Trace a path

A manual trace tests the repeater sequence you select. It does not guarantee
that later messages will use the same path.

### Open the trace tool

1. Connect the app to your companion.
2. Open the **three-dot** menu.

    ![Three-dot menu in the MeshCore app](images/MeshCore_TraceRoute1.png){ loading=lazy width="300" }

3. Select **Tools**.

    ![Tools action in the MeshCore app](images/MeshCore_TraceRoute2.png){ loading=lazy width="300" }

4. Select **Trace Path - Manual**.

    ![Manual trace-path action](images/MeshCore_TraceRoute3.png){ loading=lazy width="300" }

5. Select the **plus** button to add a repeater.

    ![Add-repeater button in the manual trace tool](images/MeshCore_TraceRoute4.png){ loading=lazy width="300" }

### Trace one hop

1. Add one repeater and confirm it.

    ![One repeater selected for a trace](images/MeshCore_TraceRoute1Hop1.png){ loading=lazy width="300" }

2. Confirm that one repeater identifier is shown.

    ![One-hop path ready to trace](images/MeshCore_TraceRoute1Hop2.png){ loading=lazy width="300" }

3. Select **Trace Path**.

### Trace more than one hop

1. Add the repeaters in the forward order required by the path.
2. Add the return sequence shown by your local path plan.

    ![Multiple repeaters selected for a trace](images/MeshCore_TraceRoute2Hop1.png){ loading=lazy width="300" }

3. Review the complete sequence, then select **Trace**.

    ![Multi-hop path ready to trace](images/MeshCore_TraceRoute2Hop2.png){ loading=lazy width="300" }

4. Read the result.

    ![Multi-hop trace result](images/MeshCore_TraceRoute2Hop3.png){ loading=lazy width="300" }

If you do not know the forward and return sequence, ask the local community
instead of guessing repeater identifiers.

## Check heard repeats

A heard repeat means your companion received a repeated copy of a packet it
sent. A missing repeat does not by itself show where the packet failed: the
repeater may not have heard the packet, or your companion may not have heard
the repeated copy.

1. Send a message in the intended channel.
2. When **Heard _n_ repeats** appears below the message, press and hold the
   message.

    ![Message showing a heard-repeat count](images/MeshCore_HeardRepeats_Step1.png){ loading=lazy width="300" }

3. Select **Heard Repeats**.

    ![Heard Repeats action](images/MeshCore_HeardRepeats_Step2.png){ loading=lazy width="300" }

4. Review the repeaters your companion heard for that packet.

    ![List of repeaters heard by the companion](images/MeshCore_HeardRepeats_Step3.png){ loading=lazy width="300" }

5. Select a repeater to inspect the reported path.

### Example: direct repeat

![Diagram of a direct heard repeat](images/MeshCore_HeardRepeats_Direct.png){ loading=lazy width="300" }

![App view of a direct heard repeat](images/MeshCore_HeardRepeats_Step4_1Repeat.png){ loading=lazy width="300" }

### Example: multi-hop repeat

![Diagram of a multi-hop heard repeat](images/MeshCore_HeardRepeats_MultiHop.png){ loading=lazy width="300" }

![App view of a multi-hop heard repeat](images/MeshCore_HeardRepeats_Step4_2Repeat.png){ loading=lazy width="300" }

## Next step

If a result is missing or unclear, compare one known-good nearby node and then
use [Get help](../start/get-help.md). Include the task and step where you
stopped, but remove sensitive values before sharing a screenshot.
