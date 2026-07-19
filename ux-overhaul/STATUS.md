# MeshCore Canada UI/UX overhaul status

This file tracks the implementation of the July 19, 2026 UI/UX overhaul
handoff. It records evidence, not intent.

## Baseline

- Repository: `MeshCore-ca/MeshCore-Canada`
- Integration branch: `agent/ui-ux-overhaul`
- Audited and reconciled base: `f608cfebc0c0dd3b7f5e67a1875a33b63310eb3f`
- Base relationship: current `origin/main` exactly matches the handoff baseline
- Production target after review: `https://meshcore.ca/`
- Staging target: `https://canadaverse.org/meshcore-canada/`
- Staging host: Pi 5 at `192.168.0.24`
- Staging service: existing `splashpage` Docker container

## Delivery decision

The handoff proposes a sequence of small pull requests. The project owner has
instead requested one consolidated pull request. The work remains split into
reviewable commits and validation gates inside that one branch. No production
merge or deployment is part of the staging implementation.

## Current stage

| Stage | Status | Evidence |
|---|---|---|
| Handoff read end-to-end | Complete | 3,578-line July 19 handoff reviewed |
| Latest `main` reconciled | Complete | `origin/main` is `f608cfe` |
| Clean integration worktree | Complete | `agent/ui-ux-overhaul` from `origin/main` |
| Current route and P0 audit | Complete | P0 safety/content tests and strict link audit pass |
| Pi 5 `splashpage` route audit | Complete | Healthy namespaced static route confirmed; 70 GB free |
| P0 containment | Complete | Unsafe recipes quarantined; destructive-flow tests pass |
| Shared design system and IA | Complete | Tokens, shell, components, six-category navigation |
| Journey and directory rebuilds | Complete | Start and 16-listing directory tests pass |
| Configurator/editor redesign | Complete | 119 Node tests, 46 gateway tests, 17 automation tests, and Chromium journeys pass |
| Product-quality CI | Complete | Pinned quality, browser, Lighthouse, and reviewed-main deployment workflows |
| Pi 5 staging deployment | Not started | Awaiting audited mount/route pattern |
| Consolidated pull request | Not started | Branch is local only |

## Protected behavior

The overhaul must not change:

- region catalog or membership semantics;
- command generation, ordering, limits, or path meanings;
- fixed-anchor, jurisdiction, hierarchy, or geography invariants;
- proposal v1/v2 schemas or signed canonical payload behavior;
- gateway permissions, signature domains, idempotency, or approval actors;
- deterministic regeneration and fail-closed deployment checks.

Any diff in those outputs is a release blocker unless separately approved by
the region maintainers.

## Requirement ledger

Status values are `not-started`, `in-progress`, `proved`, `human-review`, or
`blocked`.

| Requirement group | Status | Required proof |
|---|---|---|
| P0 content and safety containment | proved | Safety tests, 67-page strict build, 6,750-link audit |
| Generated `site/` removed and ignored | proved | `git ls-files site` is empty; clean build succeeds |
| Six-category task-oriented navigation | proved | Built nav and Chromium keyboard journey pass |
| Canonical homepage and Start journeys | proved | Critical-path browser tests pass |
| Shared semantic tokens and theme shell | human-review | Automated light/dark contrast gates pass; manual forced-colour review remains |
| Page metadata and lifecycle validation | proved | 61 pages pass schema and lifecycle validation |
| Structured community directory | proved | 16 listings reconcile from structured data |
| Hardware/build content system | human-review | Automated safety/structure/link tests pass; factual review remains |
| Safe firmware/destructive flows | human-review | Backup/preflight/recovery lint passes; domain review remains |
| Analyzer/MQTT chooser and secure builder | proved | Credential-safety and observer-lifecycle tests pass |
| Configurator redesign without output drift | proved | Region validator, command fixtures, and browser tests pass |
| Editor v1/v2 accessible redesign | human-review | Payload parity, gateway, keyboard, and axe gates pass; manual mobile/AT review remains |
| Trusted text equivalent for boundary PNG | proved | Deterministic preview and text-equivalent tests pass |
| Search, SEO, privacy, French readiness | human-review | Search/SEO/privacy checks pass; reviewed French content remains |
| Accessibility and performance gates | human-review | Chromium axe/journeys and desktop Lighthouse budgets pass; manual matrix remains |
| Pi 5 staging on namespaced route | not-started | Live route smoke tests without Canadaverse regressions |
| One consolidated PR ready for review | not-started | Remote PR and all required checks green |

## Human review register

The implementation may prepare and clearly label these items, but cannot
silently assert them:

- hardware, electrical, RF, product, price, and firmware factual verification;
- whether a local practice is national policy;
- community listing ownership, status, language, and contact freshness;
- region naming or authority decisions;
- reviewed French technical and safety translations;
- analytics provider and privacy approval;
- public gateway and preview retention policy;
- production DNS, firewall, secrets, merge, and rollback approval.

Editor-specific review still requires maintainers to approve proposed region/subregion names and derived parent authority, and people using keyboard, mobile, and assistive technology to verify the complete browser journey.

Work that does not depend on those decisions continues.
