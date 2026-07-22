# MeshCore Canada UI/UX overhaul status

This file records the durable delivery and review contract for draft PR #66. Live
candidate evidence belongs in the pull request because the preview runtime can
change without a source edit.

## Baseline and scope

- Repository: `MeshCore-ca/MeshCore-Canada`
- Draft pull request: #66
- Integration branch: `agent/ui-ux-overhaul`
- Reconciled `main` commit: `cbbe9c03b13fa9dc478155fd4116d845893be4e2`
- Folded community-update source: PR #75 at `a47dfbc`
- Production target after review and merge: `https://meshcore.ca/`
- Isolated review target: `https://canadaverse.org/meshcore-canada/`
- Review host: the existing Pi 5 `splashpage` service

## Delivery posture

PR #66 is deliberately consolidated and must remain **draft** while its exact
candidate is tested on the Pi 5 and the human-review items below remain open.
Closing superseded PR #75 does not make PR #66 ready to merge. No production
`meshcore.ca` deployment is authorized by the preview work.

The preview is a complete no-index build, not a second content source. A preview
is accepted only when its manifest revision matches the pushed PR head, its
artifact digest matches the deployed files, and the running container records
both values. A reachable URL by itself is not deployment proof.

## Implemented overhaul

| Area | Result |
|---|---|
| Information architecture | Task-oriented Start, About, Tools, community, configuration, hardware, and contribution journeys |
| Homepage | Two primary goals, role routes, privacy-preserving location lookup, and direct help/community paths |
| Community directory | 21 validated structured listings; province pages generated from `data/communities.json` |
| PR #75 | Five Alberta listings, refreshed YQL details, all 26 submitted URLs, and the national 3-byte StoonMesh baseline folded into the structured source |
| Search and privacy | Local search by default; online geocoding requires explicit consent |
| Configuration tools | Accessible workbench, clearer editor containment, and preserved command/region semantics |
| Operations content | Named service credits, repeater loop-detection guidance, and current SenseCAP cable paths restored |
| Delivery | Separate strict production/preview builds, preview-wide noindex, deterministic artifact manifest, subpath-aware checks, and cache-busted custom assets |
| Accessibility | Keyboard-operable header/search, mobile labels, footer fallbacks, palette/contrast checks, and automated axe journeys |

## Automated evidence

The latest pre-commit worktree validation produced:

- 63 source pages passing metadata/content validation;
- 21 community listings (20 active, 1 forming) and 11 generated directory pages;
- 5 Python content tests, 56 Node content tests, and 65 editor tests passing;
- 218 region hierarchy nodes and 193 leaf regions passing catalog validation;
- both 193-region geometry validations passing with zero positive-area overlap;
- 45 gateway tests passing with one expected Windows-only POSIX skip;
- 17 automation tests passing;
- strict 69-page production and preview builds;
- 7 production no-index pages and 69 of 69 preview pages no-indexed;
- 7,113 production and 7,112 preview local references passing the built-link audit; and
- all changed custom CSS and JavaScript references using the staging cache token.

Full browser-matrix, Lighthouse, CI, exact-image, and public-route results are
recorded on PR #66 for the pushed candidate. They must be rerun when the PR head
changes.

## Protected behaviour

The overhaul must not change:

- region catalog or membership semantics;
- command generation, ordering, limits, or path meanings;
- fixed-anchor, jurisdiction, hierarchy, or geography invariants;
- proposal v1/v2 schemas or signed canonical payload behaviour;
- gateway permissions, signature domains, idempotency, or approval actors; or
- deterministic regeneration and fail-closed deployment checks.

Any diff in those outputs is a release blocker unless separately approved by
the appropriate maintainers.

## Preview deployment gate

The Pi 5 preview must satisfy every item below before it is reported live:

1. Build once from the pushed PR-head commit with that exact revision in
   `site-manifest.json`.
2. Confirm all preview pages are no-indexed and the preview sitemap is empty.
3. Recompute the manifest artifact digest from the deployed files.
4. Record the Git revision and artifact digest as container-image labels.
5. Validate Caddy configuration and run a production-equivalent canary first.
6. Apply subtree-wide `no-store` cache headers and `X-Robots-Tag: noindex,
   nofollow`.
7. Prove critical routes, assets, CSP behaviour, manifest identity, and the
   unrelated Canadaverse root before and after cutover.
8. Retain the pinned rollback image until public browser validation finishes.

## Human review register

Automation cannot silently approve:

- hardware, electrical, RF, product, price, and firmware facts;
- community ownership, status, language, contact freshness, or missing
  verification dates;
- region names, boundaries, hierarchy, or authority decisions;
- reviewed French technical and safety translations;
- analytics and privacy-retention policy;
- the complete mobile, keyboard, forced-colour, and assistive-technology
  experience; or
- the final production merge, DNS, firewall, secrets, and rollback decision.

Those items remain explicit review gates even when CI and the Pi preview pass.