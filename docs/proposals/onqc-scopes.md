---
title: ON/QC region scopes proposal
description: A proposal for simpler MeshCore region scopes in Ontario and Québec, with city, province, and mesh-wide codes.
audience:
  - repeater-operator
  - companion-user
task: review-onqc-scopes-proposal
scope: experimental
status: experimental
status_notice: false
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2026-12-24
difficulty: intermediate
estimated_time: 10 minutes
destructive: false
search:
  exclude: true
page_styles:
  - assets/styles/scopes-proposal.css?v=20260924-1
---

# ON/QC region scopes proposal

<div class="scp-hero">
  <p class="mc-eyebrow">Proposal for discussion</p>
  <p class="mc-lede">Region scopes stop local chatter from flooding the whole network. Today's setup is hard to follow, so this proposal cuts it down to four levels of codes that everyone in Ontario and Québec can remember.</p>
  <ul class="scp-hero__badges">
    <li data-kind="proposal">Not adopted yet</li>
    <li>Ontario + Québec pilot</li>
    <li>Repeater firmware 1.16+</li>
    <li>MeshCore app 1.43+</li>
  </ul>
</div>

## The short version

There are four levels of scope. Every repeater carries one code from each: its city, its province, `onqc` and `can`. When you send a message, you choose which level to use, and that decides how far it travels. `can` is reserved for later, so for now you only pick from the first three.

<div class="scp-levels-cards">
  <div class="scp-level-card" data-level="city">
    <h3>City</h3>
    <span class="scp-tag" data-level="city">yow</span> <span class="scp-tag" data-level="city">yul</span> <span class="scp-tag" data-level="city">yqb</span>
    <p>Your local area. Same codes as <a href="https://meshmapper.net/">MeshMapper</a>.</p>
  </div>
  <div class="scp-level-card" data-level="prov">
    <h3>Province</h3>
    <span class="scp-tag" data-level="prov">on</span> <span class="scp-tag" data-level="prov">qc</span>
    <p>Every repeater in that province.</p>
  </div>
  <div class="scp-level-card" data-level="mesh">
    <h3>Mesh</h3>
    <span class="scp-tag" data-level="mesh">onqc</span>
    <p>Every repeater in Ontario and Québec.</p>
  </div>
  <div class="scp-level-card" data-level="future">
    <h3>Canada</h3>
    <span class="scp-tag" data-level="future">can</span>
    <p>All of Canada. Reserved for later: carried now, not used yet.</p>
  </div>
</div>

- **Repeaters** carry their city, their province, `onqc` and `can`.
- **Companions** use `onqc` as their default, so direct messages reach anyone,
  once the repeaters around them are set up.
- **`Public`** uses `onqc`, so everyone in Ontario and Québec can talk.
- **Test channels and bots** use your city, so they stay local.
- **Messages with no scope** still work inside each city. Bridge repeaters
  between cities drop them, so they don't flood the next city.

## What a scope is

A scope is a short name attached to a message, such as `yow`. Repeaters use it
to decide whether to pass the message on.

<div class="mc-callout" markdown>
A scope is **not** encryption and **not** a GPS fence. Anyone who knows the
name can use it, and it has nothing to do with where you are. It is only a
label that says "repeaters that carry this name, please forward this."
</div>

Your app turns the name into a small code and puts it in the message header.
Every repeater keeps a list of names it will forward. When a message arrives,
the repeater checks the code against its list.

## How a repeater decides

Here is an Ottawa repeater under this proposal, and what it does with five
different messages.

<figure class="scp-figure">
  <div class="scp-filter">
    <div class="scp-repeater">
      <svg class="scp-repeater__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8M6.2 2.4a8.3 8.3 0 0 0 0 11.2M17.8 2.4a8.3 8.3 0 0 1 0 11.2"/></svg>
      <p>Ottawa repeater</p>
      <div class="scp-repeater__list">
        <span class="scp-tag" data-level="any">*</span>
        <span class="scp-tag" data-level="city">yow</span>
        <span class="scp-tag" data-level="prov">on</span>
        <span class="scp-tag" data-level="mesh">onqc</span>
        <span class="scp-tag" data-level="future">can</span>
      </div>
      <small>Its list of names to forward</small>
    </div>
    <ul class="scp-checks">
      <li><span class="scp-packet"><span class="scp-tag" data-level="city">yow</span> Ottawa channel</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Forwarded</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="mesh">onqc</span> DM to Québec City, sent with the companion default</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Forwarded</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="any">none</span> Older app, no scope</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Forwarded</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="city">yul</span> Montréal channel</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="drop">Dropped</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="prov">qc</span> Québec-wide channel</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="drop">Dropped</span></li>
    </ul>
  </div>
  <div class="scp-rule">
    <div class="scp-rule__item" data-result="ok"><strong>Name is on the list:</strong> forward it.</div>
    <div class="scp-rule__item" data-result="drop"><strong>Name is not on the list:</strong> drop it.</div>
    <div class="scp-rule__item" data-result="ok"><strong>No scope at all:</strong> it counts as <code>*</code>. Forward it only if <code>*</code> is allowed.</div>
    <div class="scp-rule__item" data-result="drop"><strong>Too many hops:</strong> dropped once it passes <code>flood.max</code>, whatever its scope.</div>
  </div>
  <figcaption>The DM is tagged <code>onqc</code> because <code>onqc</code> is the companion default in this proposal. <a href="#why-the-companion-default-is-onqc">See why further down</a>. The repeater still hears every message. A scope only decides whether it passes the message on. Your companion also receives everything that reaches it.</figcaption>
</figure>

Four details catch people out:

- **Spelling must be exact.** `yow`, `YOW` and `ott` are three different
  names. A companion set to `yow` is ignored by a repeater that only carries `ott`.
- **Only floods are checked.** Once a direct message has a known path, it goes
  straight along that path and scopes no longer matter.
- **There is no inheritance.** Carrying `on` does not mean carrying `yow`.
  Each name has to be on the list by itself.
- **A repeater with no regions set drops every scoped message.** Out of the
  box, a repeater only carries `*`, so it forwards messages with no scope and
  nothing else. Scoped messages only work once the repeaters along the way are
  set up.

## The four levels

<figure class="scp-figure">
  <div class="scp-zone" data-level="future">
  <p class="scp-zone__title"><span class="scp-tag" data-level="future">can</span> Canada <span>Reserved for later. Carried now, not used yet.</span></p>
  <div class="scp-zone" data-level="mesh">
    <p class="scp-zone__title"><span class="scp-tag" data-level="mesh">onqc</span> Mesh <span>Every repeater in Ontario and Québec</span></p>
    <div class="scp-zone__row">
      <div class="scp-zone" data-level="prov">
        <p class="scp-zone__title"><span class="scp-tag" data-level="prov">on</span> Ontario</p>
        <div class="scp-cities">
          <div class="scp-city"><strong>yow</strong><span>Ottawa, Lanark, Calabogie, Renfrew, Alfred, Hawkesbury</span></div>
          <div class="scp-city"><strong>yyz</strong><span>Toronto</span></div>
          <div class="scp-city"><strong>ygk</strong><span>Kingston</span></div>
          <div class="scp-city"><strong>ykf</strong><span>Waterloo</span></div>
          <div class="scp-city" data-more><strong>…</strong><span>Other MeshMapper zones</span></div>
        </div>
      </div>
      <div class="scp-zone" data-level="prov">
        <p class="scp-zone__title"><span class="scp-tag" data-level="prov">qc</span> Québec</p>
        <div class="scp-cities">
          <div class="scp-city"><strong>yul</strong><span>Montréal, Trois-Rivières</span></div>
          <div class="scp-city"><strong>yqb</strong><span>Québec City</span></div>
          <div class="scp-city"><strong>yow</strong><span>Gatineau, Rigaud (shared with Ottawa)</span></div>
          <div class="scp-city"><strong>ytf</strong><span>Saguenay–Lac-Saint-Jean</span></div>
          <div class="scp-city" data-more><strong>…</strong><span>Other MeshMapper zones</span></div>
        </div>
      </div>
    </div>
  </div>
  </div>
  <div class="scp-flat">
    <strong>What an Ottawa repeater actually stores:</strong>
    <span class="scp-flat__list"><span class="scp-tag" data-level="any">*</span><span class="scp-tag" data-level="city">yow</span><span class="scp-tag" data-level="prov">on</span><span class="scp-tag" data-level="mesh">onqc</span><span class="scp-tag" data-level="future">can</span></span>
    <span>A flat list of names. The boxes above are for people, not for the repeater.</span>
  </div>
  <figcaption>The <code>yow</code> zone crosses the Ottawa River. Gatineau repeaters use <code>yow</code> for their city and <code>qc</code> for their province.</figcaption>
</figure>

### What about `can`?

Every repeater carries `can` now so that a Canada-wide scope works later
without anyone having to reconfigure their repeater again. Many repeaters set
up with the current configurator already carry it.

**Don't use `can` on your companion or channels yet.** Today it reaches the same
repeaters as `onqc`. Keep using `onqc`. Once other provinces carry `can` too,
it becomes the way to reach further, and `onqc` stays as "just the Ontario and
Québec mesh".

### Why airport codes?

- They are the same codes MeshMapper already uses, for example
  `yow.meshmapper.net`.
- MeshCore already uses airport codes elsewhere, such as the
  [location code every observer reports](../analyzer/iata-codes.md). They are
  not a perfect fit for mesh areas, but that is not going to change, and a
  second set of names just for regions would only add confusion over time.
- There are no accents or capital letters to get wrong. `montréal`,
  `Montreal` and `montreal` would be three different scopes.
- They are easy to split later. If Renfrew wants its own area one day, it can
  use its own airport code and still keep `on` and `onqc`. Nothing else changes.

Always write the code with its area the first time, for example
`yow` (Ottawa / NCR area), so people learn it.

## Reading `region def yow|* on|* onqc|* can`

`region def` builds a repeater's list in one line. It keeps a **cursor** that
starts at the top, `*`. Each name is created under the cursor, and `|*` jumps
the cursor back to the top.

<figure class="scp-figure">
  <div class="scp-tape" aria-label="region def yow|* on|* onqc|* can">
    <span class="scp-tape__cmd">region def</span>
    <span class="scp-tape__tok"><b>1</b>yow</span>
    <span class="scp-tape__tok" data-kind="jump"><b>2</b>|*</span>
    <span class="scp-tape__tok"><b>3</b>on</span>
    <span class="scp-tape__tok" data-kind="jump"><b>4</b>|*</span>
    <span class="scp-tape__tok"><b>5</b>onqc</span>
    <span class="scp-tape__tok" data-kind="jump"><b>6</b>|*</span>
    <span class="scp-tape__tok"><b>7</b>can</span>
  </div>
  <ol class="scp-steps">
    <li>Create <code>yow</code> under the cursor. The cursor moves into <code>yow</code>.<div class="scp-tree">*
└ <mark>yow</mark></div></li>
    <li><code>|*</code> jumps the cursor back to the top.<div class="scp-tree"><mark>*</mark>
└ yow</div></li>
    <li>Create <code>on</code> under the cursor. The cursor moves into <code>on</code>.<div class="scp-tree">*
├ yow
└ <mark>on</mark></div></li>
    <li><code>|*</code> jumps back to the top again.<div class="scp-tree"><mark>*</mark>
├ yow
└ on</div></li>
    <li>Create <code>onqc</code>.<div class="scp-tree">*
├ yow
├ on
└ <mark>onqc</mark></div></li>
    <li><code>|*</code> back to the top.<div class="scp-tree"><mark>*</mark>
├ yow
├ on
└ onqc</div></li>
    <li>Create <code>can</code>. Done.<div class="scp-tree">*
├ yow
├ on
├ onqc
└ <mark>can</mark></div></li>
  </ol>
  <figcaption>The result is a flat list: every code sits side by side under <code>*</code>. The highlighted name is where the cursor is.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
`region def` only adds or moves names. It never deletes the ones already
there. Run `region` afterwards to see the full list.
</div>

## Repeater setup

Type these into the repeater's command line **one command at a time**: in the
MeshCore app, open the repeater, log in as admin and use the command box in
**Repeater Admin**, or use the USB console. Each command has its own copy
button. Wait for `OK` before sending the next one.

<div class="mc-callout" data-kind="warning" markdown>
**No `OK`? Send the same command again.** Over the mesh, a reply can take a few
seconds or get lost. In the MeshCore app, tap and hold the command in the
history and choose **Send Again**. Running a command twice is safe. If a
repeated `region remove` answers `Err - not found`, the first one already
worked.
</div>

### Step 1: Check your firmware

```text
ver
```

This shows the firmware version. It decides which region commands you use in
step 4:

- **1.16 or newer:** use `region def`.
- **1.15 or older:** `region def` answers `Err - ??`. Use the `region put`
  commands under [Older firmware](#older-firmware) instead, or update the
  firmware first.

### Step 2: Clear any old regions

Many repeaters already have regions from the older setup, such as `can`,
`on-alg` or `ott`. The new commands never delete anything, so clear them first.

1. List what is there:

    ```text
    region
    ```

2. Remove every name except `*`, one at a time, with `region remove <name>`.
   Start with the most indented line and work up. If you see
   `Err - not empty`, another name is still indented under it, so remove that
   one first.
3. Save:

    ```text
    region save
    ```

For example, a repeater set up with the old Ottawa path runs these, in order:

```text
region remove ott
```

```text
region remove on-alg
```

```text
region remove on
```

```text
region remove can
```

```text
region save
```

Removing `on` and `can` is fine. Step 4 adds them back. Run `region` again,
and you should only see `*^ F`.

### Step 3: Standard MeshCore Canada settings

```text
set path.hash.mode 2
```

```text
set advert.interval 240
```

```text
set flood.advert.interval 47
```

```text
set flood.max 16
```

<dl class="scp-explain">
  <dt>path.hash.mode 2</dt><dd>Uses 3-byte repeater IDs in message paths, so fewer repeaters share an ID. Needs firmware 1.14 or newer.</dd>
  <dt>advert.interval 240</dt><dd>Announces this repeater to direct neighbours every 4 hours.</dd>
  <dt>flood.advert.interval 47</dt><dd>Announces this repeater across the network every 47 hours.</dd>
  <dt>flood.max 16</dt><dd>No flood message travels more than 16 hops, scoped or not.</dd>
</dl>

These save by themselves. No `region save` is needed for them.

### Step 4: Region settings

Your city code is your **MeshMapper zone**. Open [MeshMapper](https://meshmapper.net/),
find the zone your repeater sits in, and use its code. It is a map everyone
already uses, so there is nothing new to look up.

On **firmware 1.16 or newer**, pick your area and run the four commands in
order:

=== "Ottawa and surrounding areas"

    ```text
    region def yow|* on|* onqc|* can
    ```

    ```text
    region allowf *
    ```

    ```text
    region default yow
    ```

    ```text
    region save
    ```

=== "Gatineau"

    ```text
    region def yow|* qc|* onqc|* can
    ```

    ```text
    region allowf *
    ```

    ```text
    region default yow
    ```

    ```text
    region save
    ```

=== "Montréal and surrounding areas"

    ```text
    region def yul|* qc|* onqc|* can
    ```

    ```text
    region allowf *
    ```

    ```text
    region default yul
    ```

    ```text
    region save
    ```

=== "Québec City"

    ```text
    region def yqb|* qc|* onqc|* can
    ```

    ```text
    region allowf *
    ```

    ```text
    region default yqb
    ```

    ```text
    region save
    ```

These zones follow the MeshMapper boundaries that already exist. They are not
perfect, but they are how most people already see the map today, so there is
nothing new to learn.

<dl class="scp-explain">
  <dt>region def …</dt><dd>Carry your city, your province, <code>onqc</code> and <code>can</code>.</dd>
  <dt>region allowf *</dt><dd>Also forward messages with <strong>no scope</strong>. This is already on by default. We set it anyway so you can see it.</dd>
  <dt>region default &lt;city&gt;</dt><dd>This repeater's own adverts use your city's scope, so they stay local.</dd>
  <dt>region save</dt><dd>Keeps the region settings after a reboot.</dd>
</dl>

#### Older firmware

If `region def` answers `Err - ??`, your firmware is older than 1.16. Add each
code with `region put` instead. These examples are for Ottawa. For another
area, replace `yow` with your city code, and `on` with `qc` in Québec.

=== "Firmware 1.15"

    ```text
    region put yow
    ```

    ```text
    region put on
    ```

    ```text
    region put onqc
    ```

    ```text
    region put can
    ```

    ```text
    region allowf *
    ```

    ```text
    region default yow
    ```

    ```text
    region save
    ```

=== "Firmware 1.10 to 1.14"

    ```text
    region put yow
    ```

    ```text
    region allowf yow
    ```

    ```text
    region put on
    ```

    ```text
    region allowf on
    ```

    ```text
    region put onqc
    ```

    ```text
    region allowf onqc
    ```

    ```text
    region put can
    ```

    ```text
    region allowf can
    ```

    ```text
    region allowf *
    ```

    ```text
    region save
    ```

On **1.15**, each `region put` answers `OK - (flood allowed)`, and
`region default yow` answers `default scope is now yow`. A new region forwards
straight away. On **1.10 to 1.14**, a new
region starts with forwarding **off**, so each one also needs
`region allowf`. Those versions also have no `region default`, so the
repeater's own adverts stay unscoped. Updating the firmware is worth it.

### Step 5: Check the result

```text
region
```

For Ottawa, you should see:

```text
*^ F
 yow F
 on F
 onqc F
 can F
```

`F` means "flood allowed": the repeater forwards that name. The `^` next to
`*` marks the repeater's home region; with none set, it sits on `*`. You can
ignore it.

### Bridge repeaters

A repeater that links two city zones on purpose carries **both** city codes.
For example, a repeater in **Rigaud** sits in the `yow` zone, on the Québec
side, and links it to the Montréal zone. On firmware 1.16 or newer, run these
in order:

```text
region def yow|* yul|* qc|* onqc|* can
```

```text
region denyf *
```

```text
region default yow
```

```text
region save
```

<dl class="scp-explain">
  <dt>region def …</dt><dd>Carries both city codes, plus <code>qc</code>, <code>onqc</code> and <code>can</code>.</dd>
  <dt>region denyf *</dt><dd><strong>Drops messages with no scope.</strong> This is the one difference from a normal repeater. New users with no scope still reach everyone in their own city; their messages just don't cross into the next one. See <a href="#who-hears-what">Who hears what</a>.</dd>
  <dt>region default yow</dt><dd>Its own adverts stay in its home zone, <code>yow</code>.</dd>
</dl>

Only add a neighbouring city when the repeater really links the two areas, or
city messages will leak further than people expect.

<div class="mc-callout" data-kind="warning" markdown>
**This only works if the bridge is the only link.** Any repeater that can hear
repeaters in both areas is also a bridge and should drop `*` too. Otherwise,
messages with no scope go around it.
</div>

### Allow or drop, quick reference

| Command | What it does |
| --- | --- |
| `region allowf <name>` | Forward messages with that name |
| `region denyf <name>` | Drop messages with that name. The repeater still receives them itself. |
| `<name>` | Can be `*` for messages with no scope, or a code such as `yow` |
| `set flood.max.unscoped <hops>` | A separate hop limit for messages with no scope. It only matters when it is lower than `flood.max`. `0` has the same effect as `region denyf *`. |
| `region save` | Always run it after `allowf` or `denyf` |

## Companion setup

<div class="mc-callout" data-kind="warning" markdown>
**Wait until the repeaters around you are set up.** A repeater with no regions
set drops every scoped message. If you set your default to `onqc` before the
repeaters on your routes carry it, your channel messages and first DMs will
only reach nearby. Until then, leave **Default Region Scope** empty. You will
still receive everything.
</div>

### Step 1: Set your default scope

In the MeshCore app, open **Settings**. Under **Network Settings**, tap
**Default Region Scope**, add `onqc` and select it.

### Step 2: Set a scope on each channel

Open the channel, use the channel menu, tap **Set Region Scope**, and pick the
scope from this table:

| Channel | Scope | Why |
| --- | --- | --- |
| `Public` | `onqc` | Everyone in Ontario and Québec can talk |
| Test channels, such as `#test` | Your city, for example `yow` | Tests stay local |
| Bot channels | Your city, for example `yow` | Bot replies stay local |
| Your own channels | Your city, `on`/`qc`, or `onqc` | Pick how far it should reach |

If you run a bot, set that bot's own **Default Region Scope** to your city too.

<div class="mc-callout" markdown>
**Scoped messages are a little shorter.** Once a channel has a scope, the app
allows fewer characters per message. In our testing, the limit on `Public`
dropped from 137 to 127 characters after setting it to `onqc`. The app sets
the exact limit, and it can vary with your node name and app version.
</div>

## Why the companion default is `onqc`

You cannot pick a scope for a single direct message. When a DM has no known
path yet, it floods using your **default scope**. The reply that tells your
companion the path comes back using **your contact's** default scope.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">Companion default <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="drop">Never arrives</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>You, Ottawa</strong><small>sends yow</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Ottawa repeater</strong><small>yow on onqc can</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Montréal repeater</strong><small>yul qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Québec repeater</strong><small>yqb qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Friend, Québec City</strong><small>default yqb</small></li>
    </ol>
    <p class="scp-route__note">The Montréal repeater does not carry <code>yow</code>, so the message stops there. Even if it got through, your friend's reply would use <code>yqb</code> and stop on the way back.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">Companion default <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Delivered</span></div>
    <ol class="scp-track" data-animate>
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>You, Ottawa</strong><small>sends onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Ottawa repeater</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Montréal repeater</strong><small>yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Québec repeater</strong><small>yqb qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Friend, Québec City</strong><small>default onqc</small></li>
    </ol>
    <p class="scp-route__note">Every repeater carries <code>onqc</code>, in both directions. Once the path is found, later DMs go direct and scopes no longer matter.</p>
  </div>
  <figcaption>Logins to a repeater or room server work the same way when no path is known.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
**The catch:** a channel with no scope of its own also uses your default,
`onqc`, so it reaches all of Ontario and Québec. That is what we want for
`Public`, but not for test channels and bots. That is why step 2 of the
companion setup sets those to your city.
</div>

## Who hears what

With bridges dropping messages with no scope, a new user who hasn't set a scope
yet still reaches everyone in their own city. Their messages just don't cross
into the next city. Here is the Ottawa to Montréal link through Rigaud.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">New user in Ottawa, no scope <span class="scp-tag" data-level="any">none</span><span class="scp-route__verdict" data-result="ok">Whole Ottawa area</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>New user, Ottawa</strong><small>no scope</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Ottawa repeater</strong><small>allows *</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Rigaud bridge</strong><small>drops *</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Montréal repeater</strong><small>allows *</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Montréal user</strong><small>never sees it</small></li>
    </ol>
    <p class="scp-route__note">Every Ottawa-zone repeater passes it on, so the new user reaches the whole Ottawa area. Rigaud hears it but does not pass it on, so Montréal is never flooded.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">Ottawa bot or MeshMapper, scoped <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="ok">Ottawa zone only</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Bot, Ottawa</strong><small>sends yow</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Ottawa repeater</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Rigaud bridge</strong><small>yow yul qc onqc can</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Montréal repeater</strong><small>yul qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Montréal user</strong><small>never sees it</small></li>
    </ol>
    <p class="scp-route__note">Rigaud carries <code>yow</code>, so it passes the message on. Montréal repeaters do not carry <code>yow</code>, so it stops at the edge of the zone.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">DM with the companion default <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Whole mesh</span></div>
    <ol class="scp-track" data-animate>
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>You, Ottawa</strong><small>sends onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Ottawa repeater</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Rigaud bridge</strong><small>yow yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Montréal repeater</strong><small>yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Friend, Montréal</strong><small>default onqc</small></li>
    </ol>
    <p class="scp-route__note">Every repeater carries <code>onqc</code>, including the bridge, so DMs still cross the whole mesh.</p>
  </div>
  <figcaption>The same thing happens at every bridge between two cities.</figcaption>
</figure>

More examples on the same link:

| Message | Ottawa repeaters<br>`* yow on onqc can` | Rigaud bridge<br>`yow yul qc onqc can` | Montréal repeaters<br>`* yul qc onqc can` | Who gets it |
| --- | --- | --- | --- | --- |
| New user in Ottawa, no scope | ✅ Forward | ❌ Drop | Never reached | Whole Ottawa area |
| New user in Montréal, no scope | Never reached | ❌ Drop | ✅ Forward | Whole Montréal area |
| Ottawa channel or bot, `yow` | ✅ Forward | ✅ Forward | ❌ Drop | Ottawa zone only |
| Montréal channel or bot, `yul` | ❌ Drop | ✅ Forward | ✅ Forward | Montréal zone only |
| Québec-wide channel, `qc` | ❌ Drop | ✅ Forward | ✅ Forward | Québec side, including Gatineau |
| DM with the companion default, `onqc` | ✅ Forward | ✅ Forward | ✅ Forward | Whole ON/QC mesh |

This is why bots and MeshMapper should be scoped to their city: they stay
contained no matter what, and new users who haven't set a scope yet still work
locally.

## Rollout

<ol class="scp-timeline">
  <li data-phase="Phase 1"><h3>Repeaters</h3><p>Owners clear old regions and add their codes. Normal repeaters keep <code>*</code> allowed; bridge repeaters drop it. Nothing breaks inside any city.</p></li>
  <li data-phase="Phase 2"><h3>Companions</h3><p>Once the repeaters around them are set up, users set their default and <code>Public</code> to <code>onqc</code>, and test channels and bots to their city.</p></li>
  <li data-phase="Phase 3"><h3>Only if needed</h3><p>If messages with no scope are still too noisy inside a city, repeaters can also run <code>set flood.max.unscoped 3</code>. Scoped messages still reach 16 hops.</p></li>
</ol>

## Things to know

- **Scoped messages are about 10 characters shorter.** The app lowers the
  message length limit on scoped channels (137 to 127 in our testing).
- **Repeater adverts stay in their city.** Montréal users will not see Ottawa
  repeaters through flood adverts.
- **16 hops has to be enough.** `flood.max` applies to `onqc` too. If the
  longest real path across the mesh is longer than 16 hops, cross-mesh
  messages will stop part way.
- **Versions:** `region def` needs repeater firmware 1.16 or newer. Default
  scope in the app needs MeshCore 1.43 or newer.

## Next steps

- Agree on the list of city codes for Ontario and Québec.
- Add a "find your town" lookup to meshcore.ca that shows your code.
- Publish clean-up and setup commands for each city.
- Add a simple Ontario and Québec mode to the [repeater configurator](../config/index.md).
- Other provinces keep the current setup until the pilot has proven itself.

Have thoughts? Share them on the
[MeshCore Canada Discord](https://discord.gg/BESFVMt7yk) or the
[forum](https://forum.meshcore.ca/).
