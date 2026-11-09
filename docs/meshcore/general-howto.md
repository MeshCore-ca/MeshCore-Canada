---
title: Common tasks in the MeshCore app
description: Share or import a contact, trace a path, and check heard repeats in the MeshCore app.
audience:
  - companion-user
  - meshcore-user
task: use-meshcore-app-tools
scope: upstream-meshcore
status: draft
owner: docs-app
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 5-15 minutes
destructive: false
---

# Common tasks in the MeshCore app

Step-by-step guides for the most common things you'll do in the MeshCore mobile
app.

- [Send your first message](#send-your-first-message)
- [Share your contact link](#share-your-contact-link)
- [Import a contact link](#import-a-contact-link)
- [Trace a path](#trace-a-path)
- [Check heard repeats](#check-heard-repeats)

## Send your first message

1. Open the app and connect to your companion.
2. Open the **Public** channel, or your community's channel.
3. Send a short hello and ask for a reply.

**Heard X repeats** under your message means a repeater picked it up. A reply
means two-way messaging works.

## Share your contact link

1. Open the MeshCore app and connect to your node.
2. Tap the **Signal** icon.

    ![Signal icon in the MeshCore app](images/MeshCore_GetContactID1.png){ loading=lazy width="300" }

3. Tap **Advert → To Clipboard**.

    ![Advert menu with the To Clipboard option](images/MeshCore_GetContactID2.png){ loading=lazy width="300" }

4. Paste your contact link anywhere you want to share it.

## Import a contact link

1. Open the app and connect to your node.
2. Tap the **three dots**.

    ![Three-dot menu in the MeshCore app](images/MeshCore_AddContactMan1.png){ loading=lazy width="300" }

3. Tap **Add Contact**.

    ![Add Contact option](images/MeshCore_AddContactMan2.png){ loading=lazy width="300" }

4. Tap **Import from Clipboard Link**.

    ![Import from Clipboard Link option](images/MeshCore_AddContactMan3.png){ loading=lazy width="300" }

5. After a few seconds you'll see **"Success - contact has been imported"**.

    ![Contact imported successfully message](images/MeshCore_AddContactMan5.png){ loading=lazy width="300" }

6. A second popup appears: **"New Contact Discovered &lt;NAME&gt;"**.
7. The contact is now added.

## Trace a path

### One hop

1. Open the app and connect.
2. Tap the **three dots**.

    ![Three-dot menu in the MeshCore app](images/MeshCore_TraceRoute1.png){ loading=lazy width="300" }

3. Tap **Tools**.

    ![Tools option in the MeshCore app](images/MeshCore_TraceRoute2.png){ loading=lazy width="300" }

4. Tap **Trace Path - Manual**.

    ![Trace Path - Manual option](images/MeshCore_TraceRoute3.png){ loading=lazy width="300" }

5. Tap the **plus button**.

    ![Plus button in the manual trace tool](images/MeshCore_TraceRoute4.png){ loading=lazy width="300" }

6. Select a repeater and confirm.

    ![One repeater selected for a trace](images/MeshCore_TraceRoute1Hop1.png){ loading=lazy width="300" }

7. You'll see one repeater ID: that's a **1-hop trace**.

    ![One-hop path ready to trace](images/MeshCore_TraceRoute1Hop2.png){ loading=lazy width="300" }

8. Tap **Trace Path**.

### Two or more hops

1. Follow steps 1 to 5 above.
2. Select repeaters **in order**:
    - choose the **forward path** and confirm;
    - reopen the add menu and choose the **return path**;
    - or type the IDs yourself, for example `d3, f3, d3`.

    ![Several repeaters selected for a trace](images/MeshCore_TraceRoute2Hop1.png){ loading=lazy width="300" }

3. Confirm both the forward and return paths, then tap **Trace**.

    ![Multi-hop path ready to trace](images/MeshCore_TraceRoute2Hop2.png){ loading=lazy width="300" }

4. View the results.

    ![Multi-hop trace result](images/MeshCore_TraceRoute2Hop3.png){ loading=lazy width="300" }

## Check heard repeats

When you send a message, it travels to a nearby repeater, which repeats it. If
your companion hears that repeat, it counts as a **heard repeat**. Your companion
can miss a repeat, for example:

- your message reaches the repeater, but the repeat doesn't make it back to you;
- you're on a 1 W companion and the repeater is 0.3 W: you can reach it, but
  you may be too far away to hear its repeat.

1. Send a message in the Public channel.
2. When **Heard X repeats** shows under your message, press and hold the message.

    ![Message showing a heard-repeats count](images/MeshCore_HeardRepeats_Step1.png){ loading=lazy width="300" }

3. Tap **Heard Repeats**.

    ![Heard Repeats option](images/MeshCore_HeardRepeats_Step2.png){ loading=lazy width="300" }

4. You'll see every repeater your companion heard repeating that message.

    ![List of repeaters the companion heard](images/MeshCore_HeardRepeats_Step3.png){ loading=lazy width="300" }

5. Tap a repeater to see the path its repeat took back to you.

**Notes:**

- A repeater close to you may show up as a **direct hop**.
- You may also see a **distant repeater**. That happens when it hears your message
  shortly after another repeater and your companion hears both repeats.
- Your companion must hear a repeater *directly* for it to appear in the list.

### Example: direct repeat

![Diagram of a direct heard repeat](images/MeshCore_HeardRepeats_Direct.png){ loading=lazy width="300" }

![App view of a direct heard repeat](images/MeshCore_HeardRepeats_Step4_1Repeat.png){ loading=lazy width="300" }

### Example: multi-hop repeat

One repeater hears your message and repeats it, then your companion hears a
second repeater's repeat of that same message:

![Diagram of a multi-hop heard repeat](images/MeshCore_HeardRepeats_MultiHop.png){ loading=lazy width="300" }

![App view of a multi-hop heard repeat](images/MeshCore_HeardRepeats_Step4_2Repeat.png){ loading=lazy width="300" }

Stuck? [Get help](../start/get-help.md).
