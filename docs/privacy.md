---
title: Privacy at MeshCore Canada
description: Understand what the MeshCore Canada website, tools, and public contribution forms send or store.
audience:
  - site-visitor
  - contributor
task: understand-site-privacy
scope: canada-baseline
status: draft
owner: site-maintainers
last_reviewed: 2026-11-02
review_by: 2027-01-15
difficulty: beginner
estimated_time: 3 minutes
destructive: false
---

# Privacy at MeshCore Canada

You can read this site without a MeshCore Canada or GitHub account.

## When data leaves your browser

| Action | What is sent | Where it goes |
|---|---|---|
| Search this documentation | Your search words stay in the browser | Nowhere |
| Find nearby communities | The city you submit | The Government of Canada’s place search (geo.ca); distances are calculated in your browser |
| Load header network totals | Your IP address and standard web request information, without search text | Beacon at dev.meshcore.ca |
| Search for a place in the region tools | The place, airport code, or postal code you enter | IATA codes are checked locally. Place names go to the Government of Canada’s place search (geo.ca); postal codes use OpenStreetMap or geocoder.ca |
| Search for a town or street address in the [setup tool](config/index.md) | The town or address you type. Coordinates you type stay in your browser | The Government of Canada’s place search (geo.ca): `geolocator.api.geo.ca` |
| Open the interactive region map | Your IP address and the visible map area | OpenStreetMap |
| Check a repeater path ID | The first byte of the public key | Beacon at dev.meshcore.ca; regional and longer-prefix comparisons stay in your browser |
| Load the GitHub star count | Your IP address and standard web request information | GitHub |
| Open an external link | Normal web request information | The named external service |
| Submit a community idea | The text and proposal details shown at review, plus anti-spam verification | MeshCore Canada’s submission service, Cloudflare Turnstile, and a public GitHub issue |

## Public submissions

Ideas and boundary proposals become public GitHub issues. Review the preview
before submitting. Do not include passwords, private keys, home addresses,
private coordinates, or other personal information.

The submission service may keep security and rate-limit logs. A retention
period has not yet been published.

## The setup tool

The [setup tool](config/index.md) never asks for or stores your admin password
or Wi-Fi password. Where a command needs one, it shows a placeholder for you to
fill in yourself.

- **Sharing and resuming.** The tool’s link (**Copy a link to these answers**,
  which is also the address in your browser) holds your non-secret answers,
  such as the repeater’s name, its region, and the place (a town, or the street
  address you picked) with its coordinates, so you can share or resume a setup.
  It never holds passwords, Wi-Fi details, or a pasted `region` reply. Links can
  appear in browser history and server access logs, so don’t share one that
  holds a private location.
- **Show on maps.** This is on by default. For a street address or coordinates,
  the tool says “Anyone can see this spot on public maps.” If you untick it,
  the tool leaves the commands that set your repeater’s location out of the
  list, and an address or coordinates stay out of the link too.
- **Switching language.** So you don’t start over, the tool keeps your ticks,
  firmware version, and pasted replies in that browser tab, for the switch
  only. The other page uses them once, then removes them. If it doesn’t pick
  them up within 10 minutes, they’re ignored, and they go when you close the
  tab.
- **Region files.** MeshMapper isn’t contacted unless you click a link to it.
  The setup tool, [How repeaters work](config/guide.md) and the region map read
  region files published on this site.

## Saved on your device

Switching language on the region map carries your selection in the link to the
other page. This can include entered coordinates, a location label, city and
province scopes, and radio-profile choices. These links may appear in browser
history and server access logs. Do not share a link containing a private
location.

The retired region editor can download drafts saved in this browser. Downloading
does not upload or delete them; old drafts are not approved MeshMapper boundaries.

Setup checklists, idea drafts, and the last Beacon region code selected in the
repeater-ID checker are saved in your browser only when you use those features.
Repeater public keys, passwords, private keys, anti-spam tokens, and location
searches are not saved there.

Aggregate header counts are cached for five minutes in the current browser tab.
Community city searches appear in the page URL so you can share or revisit the results.

You can clear saved site data through your browser settings. The idea form also
provides a **Clear draft** action.

## External services

CoreScope, MQTT services, flashers, and community sites have their own
operators and privacy policies.

## Analytics

MeshCore Canada does not use site analytics.

## Questions or corrections

[Share a privacy correction](submit-idea.md) without a GitHub account, or
[open an issue on GitHub](https://github.com/MeshCore-ca/MeshCore-Canada/issues).
