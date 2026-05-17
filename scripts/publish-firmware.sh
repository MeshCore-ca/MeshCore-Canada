#!/usr/bin/env bash
# publish-firmware.sh
#
# Uploads firmware binaries to a GitHub Release on the MeshCore-Canada repo.
# Run this from your external CI after building firmware.
#
# Requirements:
#   - GITHUB_TOKEN env var (fine-grained PAT with Contents: write permission)
#   - Python 3
#   - gh CLI installed (https://cli.github.com), OR curl
#
# Usage:
#   export GITHUB_TOKEN="ghp_..."
#   ./publish-firmware.sh ./build-output/
#
# The build-output directory should contain:
#   - meshcore-ca-*.bin files
#   - manifest.json (describes all artifacts)
#
# The script will:
#   1. Normalize firmware names so MeshCore Flasher chooses the right offset
#   2. Create a GitHub Release tagged firmware-YYYYMMDD
#   3. Upload manifest-referenced .bin files as release assets
#   4. Upload manifest.json as a release asset

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-MeshCore-ca/MeshCore-Canada}"
BUILD_DIR="${1:?Usage: publish-firmware.sh <build-output-dir>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: $BUILD_DIR is not a directory" >&2
  exit 1
fi

BUILD_DIR="$(cd "$BUILD_DIR" && pwd)"

MANIFEST="$BUILD_DIR/manifest.json"
if [ ! -f "$MANIFEST" ]; then
  echo "Error: manifest.json not found in $BUILD_DIR" >&2
  exit 1
fi

echo "Normalizing firmware filenames for MeshCore Flasher..."
python3 "$SCRIPT_DIR/normalize-firmware-assets.py" --prune-unsafe "$BUILD_DIR"

json_field() {
  local field="$1"
  python3 -c 'import json, sys; print(json.load(open(sys.argv[1], encoding="utf-8"))[sys.argv[2]])' "$MANIFEST" "$field"
}

VERSION=$(json_field version)
DATE=$(json_field date)
TAG="firmware-${VERSION}"
TITLE="Firmware ${VERSION}"

mapfile -t BIN_NAMES < <(python3 - "$MANIFEST" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)

seen = set()
for artifact in data.get("artifacts", []):
    name = artifact["file"]
    if name in seen:
        continue
    seen.add(name)
    print(name)
PY
)

BIN_FILES=()
for name in "${BIN_NAMES[@]}"; do
  BIN_FILES+=("$BUILD_DIR/$name")
done

if [ ${#BIN_FILES[@]} -eq 0 ]; then
  echo "Error: manifest contains no firmware artifacts" >&2
  exit 1
fi

for bin in "${BIN_FILES[@]}"; do
  if [ ! -f "$bin" ]; then
    echo "Error: manifest references missing firmware file $bin" >&2
    exit 1
  fi
done

echo "=== Firmware Release ==="
echo "Repo:     $REPO"
echo "Tag:      $TAG"
echo "Version:  $VERSION"
echo "Date:     $DATE"
echo "Binaries: ${#BIN_FILES[@]} files"
echo ""

# ---------- Create release + upload with gh CLI ----------

if command -v gh &>/dev/null; then
  echo "Using gh CLI..."

  # Create the release and attach all manifest-referenced assets.
  gh release create "$TAG" \
    --repo "$REPO" \
    --title "$TITLE" \
    --notes "Firmware build ${VERSION} (${DATE}). See the [MQTT Firmware](https://meshcore.ca/analyzer/builds/mqtt-firmware/) page for setup instructions." \
    --latest \
    "$MANIFEST" "${BIN_FILES[@]}"

  echo ""
  echo "Release published: https://github.com/$REPO/releases/tag/$TAG"
  exit 0
fi

# ---------- Fallback: curl + GitHub API ----------

echo "gh CLI not found, falling back to curl..."

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Error: GITHUB_TOKEN env var is required" >&2
  exit 1
fi

AUTH="Authorization: Bearer $GITHUB_TOKEN"
API="https://api.github.com"

# Create the release
RELEASE_RESPONSE=$(curl -sfS \
  -H "$AUTH" \
  -H "Accept: application/vnd.github+json" \
  -X POST "$API/repos/$REPO/releases" \
  -d "{
    \"tag_name\": \"$TAG\",
    \"name\": \"$TITLE\",
    \"body\": \"Firmware build ${VERSION} (${DATE}). See the [MQTT Firmware](https://meshcore.ca/analyzer/builds/mqtt-firmware/) page for setup instructions.\",
    \"make_latest\": \"true\"
  }")

RELEASE_ID=$(printf '%s' "$RELEASE_RESPONSE" | python3 -c 'import json, sys; print(json.load(sys.stdin).get("id") or "")')
UPLOAD_URL=$(printf '%s' "$RELEASE_RESPONSE" | python3 -c 'import json, sys; print((json.load(sys.stdin).get("upload_url") or "").split("{", 1)[0])')

if [ "$RELEASE_ID" = "null" ] || [ -z "$RELEASE_ID" ]; then
  echo "Error: failed to create release" >&2
  echo "$RELEASE_RESPONSE" >&2
  exit 1
fi

echo "Release created: ID $RELEASE_ID"

# Upload each asset
upload_asset() {
  local file="$1"
  local name
  name=$(basename "$file")
  local content_type="application/octet-stream"
  if [[ "$name" == *.json ]]; then
    content_type="application/json"
  fi

  echo "  Uploading $name..."
  curl -sfS \
    -H "$AUTH" \
    -H "Content-Type: $content_type" \
    -X POST "${UPLOAD_URL}?name=${name}" \
    --data-binary "@$file" > /dev/null
}

upload_asset "$MANIFEST"
for bin in "${BIN_FILES[@]}"; do
  upload_asset "$bin"
done

echo ""
echo "Release published: https://github.com/$REPO/releases/tag/$TAG"
echo "Assets uploaded: $((${#BIN_FILES[@]} + 1)) files"
