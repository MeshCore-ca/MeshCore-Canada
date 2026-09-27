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
last_reviewed: 2026-07-22
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
| Find nearby communities | The city you submit | Natural Resources Canada’s Geolocator API; distances are calculated in your browser |
| Load header network totals | Your IP address and standard web request information, without search text | Beacon at dev.meshcore.ca |
| Search for a place in the region tools | The place, airport code, or postal code you enter | IATA codes are checked locally. Place names go to Natural Resources Canada’s Geolocator API; postal codes use OpenStreetMap or geocoder.ca |
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

## Saved on your device

Switching language or moving between the region map and configurator carries your
selection in the destination URL. This can include entered coordinates, a location
label, city and province scopes, and radio-profile choices. These URLs may appear in browser
history and server access logs. Do not share a link containing a private location.
Downloaded setup summaries omit exact coordinates and credentials.

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
