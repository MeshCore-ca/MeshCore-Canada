"""Build a decorative Canada motif from the site's existing geographic data."""

import html
import json
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform, unary_union


ROOT = Path(__file__).resolve().parents[1]
REGIONS = ROOT / "docs/assets/regions"
OUT = ROOT / "docs/assets/canada-network-motif.svg"


def generate():
    # Decorative reference points are not the active radio-scope catalogue.
    catalog = json.loads((ROOT / "maintenance/legacy-regions/canada-regions.json").read_text(encoding="utf-8"))
    features = json.loads((REGIONS / "canada-region-partition.geojson").read_text(encoding="utf-8"))["features"]
    projection = Transformer.from_crs("EPSG:4326", "EPSG:3347", always_xy=True).transform
    country = transform(projection, unary_union([shape(feature["geometry"]) for feature in features])).simplify(7000, preserve_topology=True)
    west, south, east, north = country.bounds
    scale = min(912 / (east - west), 384 / (north - south))
    offset = (960 - (east - west) * scale) / 2

    def point(x, y):
        return (offset + (x - west) * scale, 18 + (north - y) * scale)

    paths = []
    for polygon in getattr(country, "geoms", [country]):
        if polygon.area < 800_000_000:
            continue
        coords = [point(x, y) for x, y in polygon.exterior.coords]
        paths.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in coords) + " Z")
    tags = ["crd", "mvrd", "whse", "cal", "edm", "nsl", "stoon", "regina", "wpg", "tby", "tor", "ott", "mtl", "capnat", "qik", "york", "hfx", "avalon"]
    seeds = {seed["tag"]: point(*projection(seed["lon"], seed["lat"])) for seed in catalog["seeds"] if seed["tag"] in tags}
    edges = [("crd", "mvrd"), ("mvrd", "cal"), ("mvrd", "whse"), ("whse", "nsl"), ("cal", "edm"), ("edm", "nsl"), ("edm", "stoon"), ("cal", "regina"), ("stoon", "regina"), ("regina", "wpg"), ("wpg", "tby"), ("tby", "tor"), ("tor", "ott"), ("ott", "mtl"), ("mtl", "capnat"), ("nsl", "qik"), ("qik", "capnat"), ("capnat", "york"), ("york", "hfx"), ("hfx", "avalon")]
    lines = []
    for first, second in edges:
        x1, y1 = seeds[first]
        x2, y2 = seeds[second]
        bend = min(24, abs(x2 - x1) * 0.15)
        lines.append(f'<path d="M{x1:.1f},{y1:.1f} Q{(x1+x2)/2:.1f},{(y1+y2)/2-bend:.1f} {x2:.1f},{y2:.1f}"/>')
    dots = [f'<circle cx="{seeds[tag][0]:.1f}" cy="{seeds[tag][1]:.1f}" r="3"/>' for tag in tags]
    svg = '\n'.join([
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 420" width="960" height="420">',
        '<title>Canada network motif</title>',
        '<desc>Decorative connections between regional reference points, not live links or radio coverage. Canada outline derived from Statistics Canada geography; see regions/NOTICE.txt.</desc>',
        '<defs><radialGradient id="land"><stop stop-color="#7db7ff" stop-opacity=".18"/><stop offset="1" stop-color="#7db7ff" stop-opacity=".04"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="2"/></filter></defs>',
        '<path d="' + html.escape(" ".join(paths), quote=True) + '" fill="url(#land)" stroke="#7db7ff" stroke-opacity=".5" stroke-width="1"/>',
        '<g fill="none" stroke="#7db7ff" stroke-opacity=".65" stroke-width="1.2">' + ''.join(lines) + '</g>',
        '<g fill="#7db7ff" opacity=".7" filter="url(#glow)">' + ''.join(dots) + '</g>',
        '<g fill="#9bcdff">' + ''.join(dots) + '</g>',
        '</svg>', ''
    ])
    OUT.write_text(svg, encoding="utf-8", newline="\n")
    print(f"Generated {OUT.name}: {len(svg.encode('utf-8')):,} bytes")


if __name__ == "__main__":
    generate()
