#!/usr/bin/env python3
"""Download and verify the five locked Statistics Canada boundary archives."""

from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import os
import shutil
import sys
import time
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "statcan-da-digital-2021": "digital_da",
    "statcan-da-cartographic-2021": "cartographic_da",
    "statcan-economic-regions-digital-2021": "economic_regions",
    "statcan-census-divisions-digital-2021": "census_divisions",
    "statcan-census-subdivisions-digital-2021": "census_subdivisions",
}
DOWNLOAD_ATTEMPTS = 3
DOWNLOAD_RETRY_DELAY_SECONDS = 1.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--lock",
        type=Path,
        default=ROOT / "docs" / "assets" / "regions" / "sources.lock.json",
    )
    parser.add_argument("--cache-dir", type=Path, required=True)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--github-output", type=Path)
    return parser.parse_args()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(
    source: dict,
    destination: Path,
    *,
    attempts: int = DOWNLOAD_ATTEMPTS,
    retry_delay_seconds: float = DOWNLOAD_RETRY_DELAY_SECONDS,
) -> None:
    if attempts < 1:
        raise ValueError("download attempts must be at least one")
    if retry_delay_seconds < 0:
        raise ValueError("download retry delay cannot be negative")
    expected_hash = str(source.get("sha256", "")).lower()
    expected_bytes = int(source.get("bytes", -1))
    if (
        destination.is_file()
        and destination.stat().st_size == expected_bytes
        and file_sha256(destination) == expected_hash
    ):
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.tmp")
    temporary.unlink(missing_ok=True)
    for attempt in range(1, attempts + 1):
        headers = {
            "Accept-Encoding": "identity",
            "User-Agent": "MeshCore-Canada-region-generator/1",
        }
        if attempt > 1:
            headers["Cache-Control"] = "no-cache"
        request = urllib.request.Request(str(source["url"]), headers=headers)
        try:
            with (
                urllib.request.urlopen(request, timeout=90) as response,
                temporary.open("wb") as output,
            ):
                shutil.copyfileobj(response, output, length=1024 * 1024)
            actual_bytes = temporary.stat().st_size
            if actual_bytes != expected_bytes:
                raise ValueError(
                    f"downloaded byte count differs for {source['id']}: "
                    f"expected {expected_bytes}, got {actual_bytes}"
                )
            actual_hash = file_sha256(temporary)
            if actual_hash != expected_hash:
                raise ValueError(
                    f"downloaded SHA-256 differs for {source['id']}: "
                    f"expected {expected_hash}, got {actual_hash}"
                )
            os.replace(temporary, destination)
            return
        except (OSError, ValueError, http.client.HTTPException) as error:
            temporary.unlink(missing_ok=True)
            if attempt == attempts:
                raise RuntimeError(
                    f"failed to fetch and verify {source['id']} after "
                    f"{attempts} attempts: {error}"
                ) from error
            print(
                f"Fetch attempt {attempt}/{attempts} failed for "
                f"{source['id']}: {error}; retrying",
                file=sys.stderr,
            )
            if retry_delay_seconds:
                time.sleep(retry_delay_seconds * (2 ** (attempt - 1)))
        finally:
            temporary.unlink(missing_ok=True)


def safe_extract(archive: Path, destination: Path, expected_hash: str) -> Path:
    marker = destination / ".archive.sha256"
    if marker.is_file() and marker.read_text(encoding="ascii").strip() == expected_hash:
        shapefiles = sorted(destination.rglob("*.shp"))
        if len(shapefiles) == 1:
            return shapefiles[0]
    if destination.exists():
        shutil.rmtree(destination)
    temporary = destination.with_name(f".{destination.name}.tmp")
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir(parents=True)
    try:
        with zipfile.ZipFile(archive) as handle:
            for info in handle.infolist():
                member = PurePosixPath(info.filename)
                if member.is_absolute() or ".." in member.parts:
                    raise ValueError(f"unsafe ZIP path in {archive.name}")
                target = temporary.joinpath(*member.parts)
                if info.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with handle.open(info) as source, target.open("wb") as output:
                    shutil.copyfileobj(source, output)
        shapefiles = sorted(temporary.rglob("*.shp"))
        if len(shapefiles) != 1:
            raise ValueError(f"{archive.name} must contain exactly one shapefile")
        (temporary / ".archive.sha256").write_text(expected_hash + "\n", encoding="ascii")
        os.replace(temporary, destination)
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)
    shapefiles = sorted(destination.rglob("*.shp"))
    if len(shapefiles) != 1:
        raise ValueError(f"{archive.name} extraction is incomplete")
    return shapefiles[0]


def main() -> None:
    args = parse_args()
    with args.lock.open(encoding="utf-8") as handle:
        lock = json.load(handle)
    records = {
        str(source.get("id")): source
        for source in lock.get("sources", [])
        if isinstance(source, dict)
    }
    if set(SOURCES) - set(records):
        raise ValueError("source lock is missing a required Statistics Canada archive")
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    resolved: dict[str, str] = {}
    for source_id, output_name in SOURCES.items():
        source = records[source_id]
        if not isinstance(source.get("url"), str) or not isinstance(source.get("file"), str):
            raise ValueError(f"source lock record is incomplete for {source_id}")
        archive = args.cache_dir / "archives" / source["file"]
        download(source, archive)
        shapefile = safe_extract(
            archive,
            args.cache_dir / "extracted" / source_id,
            str(source["sha256"]),
        )
        resolved[output_name] = str(shapefile.resolve())
    if args.manifest:
        args.manifest.parent.mkdir(parents=True, exist_ok=True)
        args.manifest.write_text(
            json.dumps(resolved, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    if args.github_output:
        with args.github_output.open("a", encoding="utf-8", newline="\n") as handle:
            for name, path in sorted(resolved.items()):
                if "\n" in path or "\r" in path:
                    raise ValueError("resolved source path contains a newline")
                handle.write(f"{name}={path}\n")
    print(json.dumps(resolved, sort_keys=True))


if __name__ == "__main__":
    main()
