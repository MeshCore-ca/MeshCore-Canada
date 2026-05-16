#!/usr/bin/env bash
# publish-firmware.sh
#
# Uploads firmware binaries to a GitHub Release on the MeshCore-Canada repo.
# Run this from your external CI after building firmware.
#
# Requirements:
#   - GITHUB_TOKEN env var (fine-grained PAT with Contents: write permission)
#   - gh CLI installed (https://cli.github.com), OR curl
#   - jq installed
#
# Usage:
#   export GITHUB_TOKEN="ghp_..."
#   ./publish-firmware.sh ./build-output/
#
# The build-output directory should contain:
#   - meshcore-ca-*.bin files (named per the standard)
#   - manifest.json (describes all artifacts)
#
# The script will:
#   1. Create a GitHub Release tagged firmware-YYYYMMDD
#   2. Upload all .bin files as release assets
#   3. Upload manifest.json as a release asset

set -euo pipefail

REPO="${GITHUB_REPOSITORY:-MeshCore-ca/MeshCore-Canada}"
BUILD_DIR="${1:?Usage: publish-firmware.sh <build-output-dir>}"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: $BUILD_DIR is not a directory" >&2
  exit 1
fi

MANIFEST="$BUILD_DIR/manifest.json"
if [ ! -f "$MANIFEST" ]; then
  echo "Error: manifest.json not found in $BUILD_DIR" >&2
  exit 1
fi

VERSION=$(jq -r '.version' "$MANIFEST")
DATE=$(jq -r '.date' "$MANIFEST")
TAG="firmware-${VERSION}"
TITLE="Firmware ${VERSION}"

BIN_FILES=("$BUILD_DIR"/meshcore-ca-*.bin)
if [ ${#BIN_FILES[@]} -eq 0 ]; then
  echo "Error: no meshcore-ca-*.bin files found in $BUILD_DIR" >&2
  exit 1
fi

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

  # Create the release (draft first so we can attach all assets)
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

RELEASE_ID=$(echo "$RELEASE_RESPONSE" | jq -r '.id')
UPLOAD_URL=$(echo "$RELEASE_RESPONSE" | jq -r '.upload_url' | sed 's/{.*}//')

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
