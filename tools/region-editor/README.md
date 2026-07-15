# MeshCore Canada region boundary editor

This is a small authenticated review tool for moving complete Statistics Canada dissemination areas (DAs) between existing leaf regions. It does not draw arbitrary polygons and it has no endpoint that writes region data. A successful edit downloads a proposal for normal Git review.

## Security model

- A real server-side form login verifies a scrypt password hash. Plaintext credentials are never stored.
- Sessions are short-lived HMAC-signed tokens in `Secure`, `HttpOnly`, `SameSite=Strict` cookies.
- Login and authenticated POST requests use CSRF protection. Login and export attempts are rate-limited per client address.
- Responses set a restrictive CSP and browser hardening headers. Leaflet JavaScript, CSS, and images are pinned and served locally.
- Authentication errors do not disclose whether the account name or password was wrong.
- The container is intended to run as a non-root user with a read-only filesystem, all Linux capabilities dropped, and source data mounted read-only.
- The export endpoint re-reads the current membership file. It rejects stale hashes, unknown DGUIDs, duplicate cells, ineffective edits, and edits whose target leaf is in another province or territory.

The editor deliberately does **not** save drafts or publish changes. Treat a downloaded proposal as untrusted review input until the normal generator and validation gates pass.

## Data contract

Mount the generated region artifacts at `/data/regions`:

- `canada-regions.json`
- `canada-region-membership.csv`
- `canada-region-partition.geojson` (the raw partition is accepted temporarily while regenerating)

Mount editor cell artifacts at `/data/editor-cells`:

- `manifest.json`
- `cells-<PRUID>.topo.json` (a gzip-encoded `.gz` variant is also accepted)

Each topology must have a `cells` object. Its geometries use these properties: `DGUID`, `DAUID`, `PRUID`, `CDUID`, `CDNAME`, `CSDUID`, `CSDNAME`, `CSDTYPE`, `leaf_tag`, and `seed_tag`. The browser overlays the current membership API response, so the CSV remains the authority.

The authenticated export endpoint returns only this review schema:

```json
{
  "schema": "mcc-region-editor-proposal/v1",
  "baseMembershipSha256": "...",
  "submittedBy": "optional",
  "reason": "Required local rationale for the boundary change",
  "changes": [
    {"DGUID": "...", "from": "wat", "to": "wel"}
  ]
}
```

## Create the login secret

Create the file outside the repository. The command refuses to overwrite an existing secret:

```sh
python tools/region-editor/create_secret.py \
  --output /srv/secrets/region-editor-auth.json \
  --username admin
chmod 600 /srv/secrets/region-editor-auth.json
```

The container runs as UID/GID `1000`; keep the mounted secret owned by that account (the normal first user on a Raspberry Pi) and mode `600`.

For non-interactive secret injection, pass `--password-stdin`; do not put a password on the command line.

## Container and Caddy

Build from this directory:

```sh
docker build -t mcc-region-editor:local tools/region-editor
```

Example Compose service (use the same read-only generated assets that the public map uses):

```yaml
region-editor:
  image: mcc-region-editor:local
  restart: unless-stopped
  read_only: true
  cap_drop: [ALL]
  security_opt: [no-new-privileges:true]
  environment:
    MCC_EDITOR_BASE_PATH: /debug/meshcore-regions/editor
    MCC_EDITOR_SECURE_COOKIE: "true"
    MCC_EDITOR_TRUSTED_PROXY: "false"
  volumes:
    - ./debug/meshcore-regions/assets:/data/regions:ro
    - ./region-editor-data:/data/editor-cells:ro
    - /srv/secrets/region-editor-auth.json:/run/secrets/region-editor-auth.json:ro
```

Proxy the prefix without stripping it, because the application validates that prefix and scopes its cookie to it:

```caddyfile
handle /debug/meshcore-regions/editor* {
    reverse_proxy region-editor:8080
}
```

Keep the container port off the public host. Caddy terminates HTTPS; the application should not be exposed directly.

## Test

The test suite uses only Python's standard library:

```sh
python -m unittest discover -s tools/region-editor/tests -v
```

For an intentionally insecure local HTTP smoke test only, set `MCC_EDITOR_SECURE_COOKIE=false` and use a disposable secret.
