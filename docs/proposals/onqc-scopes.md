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
  <p class="mc-lede">Region scopes stop local chatter from flooding the whole network. Today's setup is hard to follow, so this proposal cuts it down to three levels of codes that everyone in Ontario and Québec can remember.</p>
  <ul class="scp-hero__badges">
    <li data-kind="proposal">Not adopted yet</li>
    <li>Ontario + Québec pilot</li>
    <li>Repeater firmware 1.16+</li>
    <li>MeshCore app 1.43+</li>
  </ul>
</div>

## The short version

There are three levels of scope. Every repeater carries its city, its province, and the mesh codes `onqc` and `can`. When you send a message, you choose which level to use, and that decides how far it travels.

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
    <span class="scp-tag" data-level="mesh">onqc</span> <span class="scp-tag" data-level="future">can</span>
    <p><code>onqc</code>: every repeater in Ontario and Québec. <code>can</code>: all of Canada, reserved for later.</p>
  </div>
</div>

- **Repeaters** carry their city, their province, `onqc` and `can`.
- **Phones** use `onqc` as their default, so direct messages reach anyone.
- **Local channels** such as `#public` are set to your city, so chatter stays local.
- **Messages with no scope** keep working during the pilot.

## What a scope is

A scope is a short name attached to a message, such as `yow`. Repeaters use it
to decide whether to pass the message on.

<div class="mc-callout" markdown>
A scope is **not** encryption and **not** a GPS fence. Anyone can read the
name, and it has nothing to do with where you are. It is only a label that
says "repeaters that carry this name, please forward this."
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
      <li><span class="scp-packet"><span class="scp-tag" data-level="mesh">onqc</span> DM to Québec City, sent with the phone default</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Forwarded</span></li>
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
  <figcaption>The DM is tagged <code>onqc</code> because <code>onqc</code> is the phone default in this proposal. <a href="#why-the-phone-default-is-onqc">See why further down</a>. The repeater still hears every message. A scope only decides whether it passes the message on. Your phone also receives everything that reaches it.</figcaption>
</figure>

Three details catch people out:

- **Spelling must be exact.** `yow`, `YOW` and `ott` are three different
  names. A phone set to `yow` is ignored by a repeater that only carries `ott`.
- **Only floods are checked.** Once a direct message has a known path, it goes
  straight along that path and scopes no longer matter.
- **There is no inheritance.** Carrying `on` does not mean carrying `yow`.
  Each name has to be on the list by itself.

## The three levels

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

**Don't use `can` on your phone or channels yet.** Today it reaches the same
repeaters as `onqc`. Keep using `onqc`. Once other provinces carry `can` too,
it becomes the way to reach further, and `onqc` stays as "just the Ontario and
Québec mesh".

### Why airport codes?

- They are the same codes MeshMapper already uses, for example
  `yow.meshmapper.net`.
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

### Step 1: Clear any old regions

Many repeaters already have regions from the older setup, such as `can`,
`on-alg` or `ott`. `region def` never deletes anything, so clear them first.

1. Run `region` to list what is there.
2. Remove every name except `*` with `region remove <name>`. Start with the
   most indented line and work up. If you see `Err - not empty`, a name is
   still indented under it, so remove that one first.
3. Run `region save`.

For example, a repeater set up with the old Ottawa path:

```text
region remove ott
region remove on-alg
region remove on
region remove can
region save
```

Removing `on` and `can` is fine. The region settings in step 3 add them back. Run `region` again, and you
should only see `* F`.

### Step 2: Standard MeshCore Canada settings

```text
set path.hash.mode 2
set advert.interval 240
set flood.advert.interval 47
set flood.max 16
```

<dl class="scp-explain">
  <dt>path.hash.mode 2</dt><dd>Uses 3-byte repeater IDs in message paths, so fewer repeaters share an ID.</dd>
  <dt>advert.interval 240</dt><dd>Announces this repeater to direct neighbours every 4 hours.</dd>
  <dt>flood.advert.interval 47</dt><dd>Announces this repeater across the network every 47 hours.</dd>
  <dt>flood.max 16</dt><dd>No flood message travels more than 16 hops, scoped or not.</dd>
</dl>

### Step 3: Region settings

Your city code is your **MeshMapper zone**. Open [MeshMapper](https://meshmapper.net/),
find the zone your repeater sits in, and use its code. It is a map everyone
already uses, so there is nothing new to look up.

The pattern is always the same:

```text
region def <city>|* <on or qc>|* onqc|* can
```

Examples:

=== "Ottawa"

    ```text
    region def yow|* on|* onqc|* can
    region allowf *
    region default yow
    region save
    ```

=== "Gatineau"

    ```text
    region def yow|* qc|* onqc|* can
    region allowf *
    region default yow
    region save
    ```

=== "Montréal"

    ```text
    region def yul|* qc|* onqc|* can
    region allowf *
    region default yul
    region save
    ```

=== "Québec"

    ```text
    region def yqb|* qc|* onqc|* can
    region allowf *
    region default yqb
    region save
    ```

<dl class="scp-explain">
  <dt>region def …</dt><dd>Carry your city, your province, <code>onqc</code> and <code>can</code>.</dd>
  <dt>region allowf *</dt><dd>Also forward messages with <strong>no scope</strong>. This is already on by default. We set it anyway so you can see it.</dd>
  <dt>region default yow</dt><dd>This repeater's own adverts use your city's scope, so they stay local.</dd>
  <dt>region save</dt><dd>Keeps the region settings after a reboot. The <code>set</code> commands save by themselves.</dd>
</dl>

To check, run `region`. For Ottawa you should see:

```text
* F
 yow F
 on F
 onqc F
 can F
```

`F` means "flood allowed": the repeater forwards that name.

### Bridge repeaters

A repeater that links two city zones on purpose carries **both** city codes.
For example, a repeater in **Rigaud** sits in the `yow` zone, on the Québec
side, and links it to the Montréal zone:

```text
region def yow|* yul|* qc|* onqc|* can
region allowf *
region default yow
region save
```

It forwards Ottawa and Montréal city messages, plus `qc`, `onqc` and `can`. Its own
adverts stay in its home zone, `yow`. Only add a neighbouring city when the
repeater really links the two areas, or city messages will leak further than
people expect.

### Allow or drop, quick reference

| Command | What it does |
| --- | --- |
| `region allowf <name>` | Forward messages with that name |
| `region denyf <name>` | Drop messages with that name. The repeater still receives them itself. |
| `<name>` | Can be `*` for messages with no scope, or a code such as `yow` |
| `set flood.max.unscoped <hops>` | A separate hop limit for messages with no scope. It only matters when it is lower than `flood.max`. `0` has the same effect as `region denyf *`. |
| `region save` | Always run it after `allowf` or `denyf` |

## Phone and companion setup

1. Open the MeshCore app, then **Settings**. Under **Network Settings**, tap
   **Default Region Scope**, add `onqc` and select it.
2. Open each local channel, such as `#public`. Use the channel menu, then
   **Set Region Scope**, and pick your city code, for example `yow`.
3. For a channel meant to reach further, pick `on`, `qc` or `onqc` instead.

## Why the phone default is `onqc`

You cannot pick a scope for a single direct message. When a DM has no known
path yet, it floods using your **default scope**. The reply that tells your
phone the path comes back using **your contact's** default scope.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">Phone default <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="drop">Never arrives</span></div>
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
    <div class="scp-route__head">Phone default <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Delivered</span></div>
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
**The catch:** a channel with no scope of its own also uses your default. With
`onqc` as the default, an unscoped `#public` would reach all of Ontario and
Québec. That is why step 2 of the phone setup sets local channels to your city.
</div>

## Rollout

<ol class="scp-timeline">
  <li data-phase="Phase 1"><h3>Repeaters</h3><p>Owners clear old regions, add their codes and keep <code>*</code> allowed. Nothing breaks for anyone.</p></li>
  <li data-phase="Phase 2"><h3>Phones</h3><p>Users set their default to <code>onqc</code> and set local channels to their city.</p></li>
  <li data-phase="Phase 3"><h3>Cutover</h3><p>On an agreed date, repeaters run <code>set flood.max.unscoped 3</code>. Messages with no scope then stay within 3 hops, while scoped messages still reach 16.</p></li>
</ol>

## Things to know

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
