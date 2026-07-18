# MeshCore Canada anonymous submission service

This server-side service creates public review issues for two MeshCore Canada
forms without requiring contributors to have GitHub accounts:

- community ideas from `https://meshcore.ca/submit-idea/`; and
- region boundary proposals from `https://meshcore.ca/config/editor/`.

Production is owned and operated by MeshCore Canada at exactly:

```text
https://api.meshcore.ca:21323/api/meshcore-canada/submissions
```

The service never changes repository contents or region authority. It creates
fixed-format issues in `MeshCore-ca/MeshCore-Canada`. Boundary proposals also
receive `boundary-update` and an App-authored PNG preview comment; after public
review, a repository-owned GitHub Action applies only a proposal closed as
**Completed** by an allowlisted maintainer.

See the repository-root [`instructions.md`](../../instructions.md) for the
copyable administrator activation, merge, verification, and rollback runbook.

## HTTP contract

The base path is `/api/meshcore-canada/submissions`.

- `GET <base>/config` returns:

  ```json
  {"version":1,"turnstileSiteKey":"...","turnstileAction":"meshcore_submission"}
  ```

- `POST <base>` accepts exactly:

  ```json
  {"version":1,"submission":{...},"turnstileToken":"...","website":""}
  ```

- `GET <base>/previews/<submission-sha256>.png` serves the immutable,
  server-generated boundary preview referenced by the GitHub issue comment.

- Success returns:

  ```json
  {"ok":true,"issueNumber":123,"issueUrl":"https://github.com/MeshCore-ca/MeshCore-Canada/issues/123","submissionSha256":"...","duplicate":false}
  ```

`website` is a honeypot and must be empty. POST requires an exact allowlisted
`Origin`; CORS never uses a wildcard or credentials. The service supports a
strict OPTIONS preflight for `POST` and `Content-Type`. Browser requests omit
cookies and referrers, then verify the returned hash and exact GitHub issue URL
before displaying the link.

`submissionSha256` is computed over UTF-8 canonical JSON with recursively
sorted object keys, no ASCII escaping, `,` and `:` separators, and no trailing
newline. It is the idempotency key for both schemas.

## Accepted schemas

### `mcc-community-idea/v1`

The server accepts the fixed category and experience enums plus:

- required `summary`, `need`, `idea`, and `publicAcknowledged: true`;
- optional `region`, `context`, and `followUp`; and
- the browser field limits enforced again server-side.

It normalizes line endings, rejects unknown keys, controls and invalid Unicode,
escapes contributor HTML, and neutralizes GitHub mentions. The issue contains
human-readable sections and the exact canonical JSON.

### `mcc-region-editor-proposal/v1`

The server revalidates every boundary proposal against the mounted authority:

- catalog hierarchy and jurisdiction ancestry must be valid;
- membership DGUIDs must be unique and match the per-province TopoJSON cells;
- every leaf must retain exactly one anchor;
- the submitted base hash and every `from` value must still be current;
- target leaves must be valid and in the same province or territory; shared cross-province repeater configurations do not move map cells;
- neighbouring U.S. forwarding paths are catalog metadata and are never boundary-editor geometry;
- anchors cannot move; and
- request, proposal, and changed-cell limits must pass.

Changed authority files reload atomically. Invalid or mismatched authority
fails closed. Large canonical boundary payloads use deterministic gzip plus
base64url issue-comment chunks; retries resume only missing valid chunks. The
canonical boundary payload is stored in machine-readable HTML comments instead
of adding a large JSON block to the public review text.

After validation, the gateway renders a deterministic two-panel **Current /
Proposed** PNG from the exact per-province census-cell TopoJSON. It uses no
external map tiles or contributor-controlled URLs. The image is marked
**Preview - not approved**, stored immutably under the proposal hash, and
served from the existing API path. The GitHub App posts one visible image
comment; retries restore a missing comment without duplicating it.

## GitHub App and Turnstile

The organization-owned GitHub App must have only:

- **Issues — Read and write** on `MeshCore-ca/MeshCore-Canada`;
- implicit metadata read access;
- no Contents permission; and
- no webhook.

The service signs a short-lived RS256 App JWT with `openssl`, requests an
installation token restricted again to that repository and `issues: write`,
and rejects broader returned scope. No App token or private key reaches a
browser. Do not replace this with a personal access token.

The approval Action is deliberately separate from the public service. It uses
the matching public key in the repository secret
`MCC_SUBMISSION_PUBLIC_KEY_PEM` to verify the signed proposal. The public key
cannot create signatures, and the App still has no Contents permission.
`.github/region-boundary-automation.json` contains the exact label, App
identities, and maintainer allowlist.

An accepted boundary issue must be App-authored, carry `boundary-update`, and
be closed as **Completed** by an allowlisted maintainer. The Action rechecks the
signature, current authority, and jurisdiction; records the reviewed census
override; regenerates and validates the national layer; commits to `main`;
and explicitly queues the Pages deployment. **Close as not planned** rejects a
proposal without applying it. Verification or generation failure reopens the
issue and leaves `main` unchanged.

The Turnstile widget must be held in a MeshCore Canada account and allow
`meshcore.ca` and `config.meshcore.ca`. Siteverify must return `success`, an
allowed hostname, and action `meshcore_submission`. Tokens are single-use and
limited to 2,048 characters.

The default verified limit is five submissions per IP per hour. Separate
higher pre-verification and global bounds prevent forged requests from turning
the service into an unlimited Siteverify client. Only the exact Caddy peer is a
trusted proxy, and only one forwarded client address is accepted.

## Production layout

The supplied files use:

```text
checkout: /opt/meshcore-canada
state:    /var/lib/meshcore-submissions
secrets:  /etc/meshcore-submissions
compose project: meshcore-submissions
compose service: submission-gateway
image: meshcore-canada/submission-gateway:production
loopback listener: 127.0.0.1:8787
public listener: api.meshcore.ca:21323 (Caddy)
```

`compose.example.yml` uses host networking so a non-root UID/GID `10001`
container can bind only to loopback. It has a read-only root filesystem,
dropped capabilities, resource and log limits, read-only authority/secret
mounts, and one writable state mount. That mount holds the SQLite ledger and
immutable preview PNGs under `previews/`.

Copy `environment.example` to `/etc/meshcore-submissions/environment`. Keep
the Turnstile secret and GitHub App PEM in separate mode-`0600` files owned by
UID/GID `10001`.

## DNS, TLS, and port 21323

If Cloudflare hosts DNS, `api.meshcore.ca` must be **DNS only** because ordinary
orange-cloud HTTPS proxying does not support port `21323`. Cloudflare Spectrum
may be used only as an intentionally configured TCP/TLS alternative. Turnstile
does not require the DNS record itself to be proxied.

The provider and host firewalls must allow public TCP `21323`. Caddy terminates
TLS and reverse-proxies only the submission path to `127.0.0.1:8787`. Keep
`8787` private. Normal Caddy ACME issuance also requires reachability on port
`80` and/or `443` unless DNS challenge or an existing managed certificate is
configured. Use `Caddyfile.example`; do not silently move the API to a different
port.

If a Content-Security-Policy is later added to the GitHub Pages site, allow
`https://challenges.cloudflare.com` in `script-src`, `frame-src`, and
`connect-src` while retaining the site's existing map and geocoder sources.

## Lifecycle and verification

Run from `/opt/meshcore-canada/tools/region-proposal-gateway`:

```sh
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml config
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml up -d --build
sudo docker compose \
  --env-file /etc/meshcore-submissions/environment \
  -f compose.example.yml ps
curl -fsS http://127.0.0.1:8787/healthz
```

After validating and reloading Caddy:

```sh
API='https://api.meshcore.ca:21323/api/meshcore-canada/submissions'
curl -fsS "$API/config"
curl -si -H 'Origin: https://meshcore.ca' "$API/config"
curl -si -X OPTIONS \
  -H 'Origin: https://meshcore.ca' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  "$API"
curl -si -H 'Origin: https://example.invalid' "$API/config"
MISSING_PREVIEW="$(printf '0%.0s' {1..64})"
curl -si "$API/previews/$MISSING_PREVIEW.png"
```

Expect HTTP 200 config, action `meshcore_submission`, exact allowed-origin
CORS, HTTP 204 preflight, and denial without an allow-origin header for the
invalid origin. The unknown preview must return HTTP 404. The root runbook
requires the branch deployment to pass before the reviewed pull request is
merged, followed by signed-out live tests of both forms and a not-planned
boundary rejection test.

## Idempotency, recovery, and backups

Before issue creation the service writes a durable `pending` row keyed by the
canonical submission hash. The hash and an App signature over
`mcc-submission/v1:<schema>:<hash>` are embedded in the issue. Recovery accepts
a GitHub search result only when both markers match, preventing a public user
from forging an idempotency match.

After GitHub returns `201`, the issue number and URL are persisted before any
comments. A retry with a `created` row returns the same issue and resumes a
missing exact preview comment or payload chunks. A retry with only a `pending`
row searches GitHub and fails closed while search indexing catches up; it never
blindly creates a duplicate.

For migration or manual ledger work:

1. Stop only `submission-gateway`.
2. Back up `/var/lib/meshcore-submissions`.
3. Audit GitHub for the signed hash.
4. Change only a proven orphaned `pending` row.
5. Never delete a confirmed `created` row.

Do not prune a preview PNG while its issue may still be viewed. Preview URLs
are immutable and intentionally remain valid for the issue history.

Keep the host checkout synchronized with each published region-data release.
Rotate App and Turnstile keys through protected files, restart, and verify both
flows before revoking old credentials. Never log request bodies, contributor
text, Turnstile tokens, App tokens, or secrets.

## Tests

No live credentials are required. The container installs the pinned Pillow
renderer. The gateway also includes a deterministic standard-library PNG
renderer so a minimal host Python cannot take the submission API offline; the
same Current/Proposed boundary contract remains available. Install the pinned
dependency to exercise both paths, then run:

```sh
python -m pip install -r tools/region-proposal-gateway/requirements.txt
python -m unittest discover -s tools/region-proposal-gateway/tests -v
python -m unittest discover -s tests/automation -v
node --test tests/editor/*.test.mjs
python scripts/validate_community_submission.py
```

The suites cover both schemas, authority reload, canonical hashes, exact
CORS/HTTP behavior, Turnstile hostname/action checks, least-privilege App
tokens, safe issue rendering, idempotency, URL validation, and resumable
large-payload comments. They also cover deterministic PNG rendering, immutable
storage, public cache headers, and retry-safe preview comments. The automation
suite covers approval gates, signature-bound payload extraction, source
locking, safe archive extraction, and complete CSD/split decision recording.
