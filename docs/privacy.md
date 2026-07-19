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
last_reviewed: 2026-07-19
review_by: 2027-01-15
difficulty: beginner
estimated_time: 3 minutes
destructive: false
---

# Privacy at MeshCore Canada

Most pages are static documentation hosted through GitHub Pages. Reading them
does not require a MeshCore Canada or GitHub account.

## When data leaves your browser

| Action | What is sent | Where it goes |
|---|---|---|
| Search this documentation | Your search words stay in the browser | Nowhere |
| Search for a place in the region tools | The place, airport code, or postal code you enter | OpenStreetMap Nominatim or geocoder.ca, after you agree |
| Load street-map tiles | Your IP address and the visible map area | OpenStreetMap, after you agree |
| Open an external link | Normal web request information | The named external service |
| Submit an idea or region proposal | The text and proposal details shown at review, plus anti-spam verification | MeshCore Canada’s submission service, Cloudflare Turnstile, and a public GitHub issue |

The configurator also supports manual region selection. You do not need an
external place search to produce region commands.

## Public submissions

Ideas and boundary proposals become public GitHub issues. Review the preview
before submitting. Do not include passwords, private keys, home addresses,
private coordinates, or other personal information.

The submission service may keep limited security and rate-limit logs. The
project has not yet published a retention period, so this page remains marked
**draft** until maintainers approve one.

## Browser storage

The site may save non-sensitive journey progress or an idea draft only when the
page explains the feature and you choose to use it. Passwords, private keys,
anti-spam tokens, and exact location searches are excluded.

You can clear saved site data through your browser settings. The idea form also
provides a **Clear draft** action.

## Network data tools

Links to CoreScope, live.meshcore.ca, dev.meshcore.ca, MQTT services, flashers,
and community sites leave meshcore.ca. Those services have their own operators
and policies. The link text identifies the destination before you open it.

## Analytics

MeshCore Canada does not currently enable site analytics in this documentation.
If privacy-preserving analytics are proposed later, they must be documented
here before activation. They must not collect exact locations, command
contents, credentials, private keys, or raw form text.

## Questions or corrections

[Share a privacy correction](submit-idea.md) without a GitHub account, or
[open an issue on GitHub](https://github.com/MeshCore-ca/MeshCore-Canada/issues).
