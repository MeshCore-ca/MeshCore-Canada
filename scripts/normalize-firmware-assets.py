#!/usr/bin/env python3
"""Normalize MeshCore.ca firmware assets for MeshCore Flasher.

MeshCore Flasher uses the firmware filename to decide whether a custom ESP32
image is a full merged image or an app-only update image. Merged images must
end exactly with "-merged.bin" so the flasher writes them at 0x00000.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path


OLD_STYLE_RE = re.compile(r"^(?P<prefix>.+)-(?P<kind>merged|update)-(?P<date>\d{8})\.bin$")
SAFE_STYLE_RE = re.compile(r"^(?P<prefix>.+)-(?P<date>\d{8})-(?P<kind>merged|update)\.bin$")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_filename(filename: str, kind: str) -> str:
    if kind not in {"merged", "update"}:
        raise ValueError(f"unsupported artifact type {kind!r} for {filename}")

    match = OLD_STYLE_RE.match(filename)
    if match:
        if match.group("kind") != kind:
            raise ValueError(
                f"{filename} looks like {match.group('kind')} but manifest says {kind}"
            )
        return f"{match.group('prefix')}-{match.group('date')}-{kind}.bin"

    if kind == "merged" and filename.endswith("-merged.bin"):
        return filename
    if kind == "update" and filename.endswith("-update.bin"):
        return filename

    raise ValueError(
        f"{filename} is not MeshCore Flasher safe; expected a name ending in -{kind}.bin"
    )


def legacy_filename(filename: str, kind: str) -> str | None:
    match = SAFE_STYLE_RE.match(filename)
    if not match or match.group("kind") != kind:
        return None
    return f"{match.group('prefix')}-{kind}-{match.group('date')}.bin"


def ensure_alias(source: Path, target: Path, check: bool) -> bool:
    if target.exists():
        if source.exists() and sha256_file(source) != sha256_file(target):
            raise ValueError(f"{target.name} exists but does not match {source.name}")
        return False

    if check:
        raise ValueError(f"{target.name} is missing")
    if not source.exists():
        raise FileNotFoundError(source)

    shutil.copy2(source, target)
    return True


def validate_artifact(path: Path, artifact: dict[str, object]) -> None:
    if not path.exists():
        raise FileNotFoundError(path)

    expected_size = artifact.get("size")
    if isinstance(expected_size, int) and path.stat().st_size != expected_size:
        raise ValueError(
            f"{path.name} size mismatch: expected {expected_size}, got {path.stat().st_size}"
        )

    expected_hash = artifact.get("sha256")
    if isinstance(expected_hash, str) and sha256_file(path) != expected_hash:
        raise ValueError(f"{path.name} sha256 mismatch")


def normalize_manifest(manifest_path: Path, assets_dir: Path | None, check: bool) -> tuple[int, int]:
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    artifacts = data.get("artifacts")
    if not isinstance(artifacts, list):
        raise ValueError(f"{manifest_path} does not contain an artifacts list")

    rewrites = 0
    aliases = 0

    for artifact in artifacts:
        if not isinstance(artifact, dict):
            raise ValueError(f"{manifest_path} contains a non-object artifact")

        filename = artifact.get("file")
        kind = artifact.get("type")
        if not isinstance(filename, str) or not isinstance(kind, str):
            raise ValueError(f"{manifest_path} artifact is missing file/type")

        normalized = safe_filename(filename, kind)
        if assets_dir is not None:
            source = assets_dir / filename
            target = assets_dir / normalized
            if filename != normalized:
                aliases += int(ensure_alias(source, target, check))
            elif not target.exists():
                legacy = legacy_filename(filename, kind)
                if legacy is not None:
                    aliases += int(ensure_alias(assets_dir / legacy, target, check))
            validate_artifact(target, artifact)

        if filename != normalized:
            artifact["file"] = normalized
            rewrites += 1

    if rewrites:
        if check:
            raise ValueError(f"{manifest_path} needs {rewrites} filename rewrite(s)")
        manifest_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    return rewrites, aliases


def normalize_unlisted_old_style_files(assets_dir: Path, check: bool, prune_unsafe: bool) -> tuple[int, int]:
    aliases = 0
    pruned = 0
    for source in sorted(assets_dir.glob("meshcore-ca-*.bin")):
        match = OLD_STYLE_RE.match(source.name)
        if not match:
            continue
        target_name = f"{match.group('prefix')}-{match.group('date')}-{match.group('kind')}.bin"
        aliases += int(ensure_alias(source, assets_dir / target_name, check))
        if prune_unsafe:
            if check:
                raise ValueError(f"{source.name} is an unsafe legacy filename")
            source.unlink()
            pruned += 1
    return aliases, pruned


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="firmware directory, or a manifest file with --manifest-only")
    parser.add_argument("--manifest-only", action="store_true", help="rewrite only manifest filenames")
    parser.add_argument("--check", action="store_true", help="validate without writing or copying")
    parser.add_argument(
        "--prune-unsafe",
        action="store_true",
        help="remove old-style firmware names after safe replacements exist",
    )
    args = parser.parse_args()

    target = Path(args.path)
    if target.is_dir():
        manifest_path = target / "manifest.json"
        assets_dir: Path | None = target
    elif args.manifest_only:
        manifest_path = target
        assets_dir = None
    else:
        raise SystemExit("path must be a firmware directory unless --manifest-only is used")

    if not manifest_path.exists():
        raise FileNotFoundError(manifest_path)

    rewrites, aliases = normalize_manifest(manifest_path, assets_dir, args.check)
    pruned = 0
    if assets_dir is not None:
        extra_aliases, pruned = normalize_unlisted_old_style_files(
            assets_dir, args.check, args.prune_unsafe
        )
        aliases += extra_aliases

    mode = "checked" if args.check else "normalized"
    print(
        f"{manifest_path}: {mode}; manifest rewrites={rewrites}, "
        f"aliases copied={aliases}, unsafe aliases pruned={pruned}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"normalize-firmware-assets: error: {exc}", file=sys.stderr)
        raise SystemExit(1)
