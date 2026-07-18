"""Deterministic PNG previews for validated region boundary proposals."""

from __future__ import annotations

import io
import math
from collections import Counter
from typing import Any, Mapping

from PIL import Image, ImageDraw, ImageFont


IMAGE_WIDTH = 1600
IMAGE_HEIGHT = 1000
MAX_RENDER_POINTS = 4_000_000
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

PROVINCE_NAMES = {
    "10": "Newfoundland and Labrador",
    "11": "Prince Edward Island",
    "12": "Nova Scotia",
    "13": "New Brunswick",
    "24": "Quebec",
    "35": "Ontario",
    "46": "Manitoba",
    "47": "Saskatchewan",
    "48": "Alberta",
    "59": "British Columbia",
    "60": "Yukon",
    "61": "Northwest Territories",
    "62": "Nunavut",
}

REGION_PALETTE = (
    "#0072B2",
    "#D55E00",
    "#009E73",
    "#CC79A7",
    "#E69F00",
    "#56B4E9",
    "#7A5195",
    "#2F4B7C",
    "#B05A8C",
    "#4E8A57",
    "#8C6D31",
    "#5F6B6D",
)


class PreviewRenderError(RuntimeError):
    """The trusted authority geometry could not produce a safe preview."""


def _font(size: int, *, bold: bool = False) -> ImageFont.ImageFont:
    names = (
        ("DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
        if bold
        else ("DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    )
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # pragma: no cover - for older locally installed Pillow
        return ImageFont.load_default()


def _lighten(colour: str, amount: float = 0.58) -> str:
    channels = [int(colour[index:index + 2], 16) for index in (1, 3, 5)]
    mixed = [round(channel + (255 - channel) * amount) for channel in channels]
    return "#" + "".join(f"{channel:02X}" for channel in mixed)


def _tag_label(tag: str, maximum: int) -> str:
    return tag.upper() if len(tag) <= maximum else tag[:maximum - 3].upper() + "..."


def _project(longitude: float, latitude: float) -> tuple[float, float]:
    latitude = max(-85.0, min(85.0, latitude))
    radians = math.radians(latitude)
    return math.radians(longitude), math.log(math.tan(math.pi / 4.0 + radians / 2.0))


def _bounds(points: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    return (
        min(point[0] for point in points),
        min(point[1] for point in points),
        max(point[0] for point in points),
        max(point[1] for point in points),
    )


def _intersects(
    left: tuple[float, float, float, float],
    right: tuple[float, float, float, float],
) -> bool:
    return not (
        left[2] < right[0]
        or left[0] > right[2]
        or left[3] < right[1]
        or left[1] > right[3]
    )


class _TopologyDecoder:
    def __init__(self, topology: object):
        if not isinstance(topology, dict) or topology.get("type") != "Topology":
            raise PreviewRenderError("preview authority is not TopoJSON")
        transform = topology.get("transform")
        arcs = topology.get("arcs")
        objects = topology.get("objects")
        if (
            not isinstance(transform, dict)
            or not isinstance(transform.get("scale"), list)
            or len(transform["scale"]) != 2
            or not isinstance(transform.get("translate"), list)
            or len(transform["translate"]) != 2
            or not all(isinstance(value, (int, float)) for value in transform["scale"] + transform["translate"])
            or not isinstance(arcs, list)
            or not isinstance(objects, dict)
            or not isinstance(objects.get("cells"), dict)
            or not isinstance(objects["cells"].get("geometries"), list)
        ):
            raise PreviewRenderError("preview authority has an invalid TopoJSON schema")
        self.scale = (float(transform["scale"][0]), float(transform["scale"][1]))
        self.translate = (float(transform["translate"][0]), float(transform["translate"][1]))
        self.arcs = arcs
        self.geometries = objects["cells"]["geometries"]
        self._arc_cache: dict[int, list[tuple[float, float]]] = {}
        self.point_count = 0

    def arc(self, reference: object) -> list[tuple[float, float]]:
        if not isinstance(reference, int) or isinstance(reference, bool):
            raise PreviewRenderError("preview authority contains an invalid arc reference")
        arc_index = reference if reference >= 0 else ~reference
        if arc_index < 0 or arc_index >= len(self.arcs):
            raise PreviewRenderError("preview authority contains an out-of-range arc")
        if arc_index not in self._arc_cache:
            raw_arc = self.arcs[arc_index]
            if not isinstance(raw_arc, list):
                raise PreviewRenderError("preview authority contains an invalid arc")
            x = 0.0
            y = 0.0
            decoded: list[tuple[float, float]] = []
            for delta in raw_arc:
                if (
                    not isinstance(delta, list)
                    or len(delta) < 2
                    or not isinstance(delta[0], (int, float))
                    or not isinstance(delta[1], (int, float))
                ):
                    raise PreviewRenderError("preview authority contains invalid coordinates")
                x += float(delta[0])
                y += float(delta[1])
                decoded.append(
                    (
                        x * self.scale[0] + self.translate[0],
                        y * self.scale[1] + self.translate[1],
                    )
                )
            self.point_count += len(decoded)
            if self.point_count > MAX_RENDER_POINTS:
                raise PreviewRenderError("preview authority is too complex to render")
            self._arc_cache[arc_index] = decoded
        coordinates = self._arc_cache[arc_index]
        return coordinates if reference >= 0 else list(reversed(coordinates))

    def ring(self, references: object) -> list[tuple[float, float]]:
        if not isinstance(references, list):
            raise PreviewRenderError("preview authority contains an invalid ring")
        result: list[tuple[float, float]] = []
        for reference in references:
            coordinates = self.arc(reference)
            if result and coordinates and result[-1] == coordinates[0]:
                result.extend(coordinates[1:])
            else:
                result.extend(coordinates)
        if len(result) >= 3 and result[0] != result[-1]:
            result.append(result[0])
        return result

    def polygons(self, geometry: object) -> list[list[list[tuple[float, float]]]]:
        if not isinstance(geometry, dict):
            raise PreviewRenderError("preview authority contains an invalid geometry")
        geometry_type = geometry.get("type")
        raw = geometry.get("arcs")
        if geometry_type == "Polygon":
            polygon_sets = [raw]
        elif geometry_type == "MultiPolygon":
            polygon_sets = raw
        else:
            raise PreviewRenderError("preview authority contains an unsupported geometry")
        if not isinstance(polygon_sets, list):
            raise PreviewRenderError("preview authority contains invalid polygon arcs")
        result: list[list[list[tuple[float, float]]]] = []
        for polygon in polygon_sets:
            if not isinstance(polygon, list):
                raise PreviewRenderError("preview authority contains an invalid polygon")
            rings = [self.ring(references) for references in polygon]
            rings = [ring for ring in rings if len(ring) >= 4]
            if rings:
                result.append(rings)
        return result


def _project_polygons(
    polygons: list[list[list[tuple[float, float]]]],
) -> list[list[list[tuple[float, float]]]]:
    return [
        [[_project(longitude, latitude) for longitude, latitude in ring] for ring in polygon]
        for polygon in polygons
    ]


def _geometry_points(
    polygons: list[list[list[tuple[float, float]]]],
) -> list[tuple[float, float]]:
    return [point for polygon in polygons for ring in polygon for point in ring]


def _fit_view(
    bounds: tuple[float, float, float, float], panel_width: int, panel_height: int,
) -> tuple[float, float, float, float]:
    minimum = math.radians(0.16)
    width = max(bounds[2] - bounds[0], minimum)
    height = max(bounds[3] - bounds[1], minimum)
    centre_x = (bounds[0] + bounds[2]) / 2.0
    centre_y = (bounds[1] + bounds[3]) / 2.0
    target_ratio = panel_width / panel_height
    if width / height > target_ratio:
        height = width / target_ratio
    else:
        width = height * target_ratio
    width *= 1.22
    height *= 1.22
    return (
        centre_x - width / 2.0,
        centre_y - height / 2.0,
        centre_x + width / 2.0,
        centre_y + height / 2.0,
    )


def _screen_ring(
    ring: list[tuple[float, float]],
    view: tuple[float, float, float, float],
    frame: tuple[int, int, int, int],
) -> list[tuple[int, int]]:
    left, top, right, bottom = frame
    scale_x = (right - left) / (view[2] - view[0])
    scale_y = (bottom - top) / (view[3] - view[1])
    return [
        (
            round(left + (point[0] - view[0]) * scale_x),
            round(bottom - (point[1] - view[1]) * scale_y),
        )
        for point in ring
    ]


def _draw_panel(
    image: Image.Image,
    frame: tuple[int, int, int, int],
    view: tuple[float, float, float, float],
    visible: list[dict[str, Any]],
    changed: Mapping[str, Mapping[str, str]],
    colours: Mapping[str, str],
    *,
    proposed: bool,
) -> None:
    background = "#F7F9FB"
    frame_width = frame[2] - frame[0]
    frame_height = frame[3] - frame[1]
    panel = Image.new("RGB", (frame_width, frame_height), background)
    draw = ImageDraw.Draw(panel)
    local_frame = (0, 0, frame_width - 1, frame_height - 1)
    changed_width = 3 if len(changed) <= 50 else 2 if len(changed) <= 250 else 1
    for cell in visible:
        dguid = cell["dguid"]
        tag = changed[dguid]["to"] if proposed and dguid in changed else cell["leaf"]
        fill = _lighten(colours[tag]) if tag in colours else "#E7EBEF"
        outline = "#AEB7C0"
        width = 1
        if dguid in changed:
            outline = "#151B23"
            width = changed_width
        for polygon in cell["polygons"]:
            outer = _screen_ring(polygon[0], view, local_frame)
            if len(outer) >= 3:
                draw.polygon(outer, fill=fill, outline=outline, width=width)
            for hole in polygon[1:]:
                interior = _screen_ring(hole, view, local_frame)
                if len(interior) >= 3:
                    draw.polygon(interior, fill=background, outline=outline, width=1)
    mask = Image.new("L", (frame_width, frame_height), 0)
    ImageDraw.Draw(mask).rounded_rectangle(local_frame, radius=14, fill=255)
    image.paste(panel, (frame[0], frame[1]), mask)
    ImageDraw.Draw(image).rounded_rectangle(
        frame, radius=14, outline="#B7C0C9", width=2
    )


def render_boundary_preview(canonical: Mapping[str, Any], topology: object) -> bytes:
    """Render one validated proposal against its exact authority TopoJSON."""

    raw_changes = canonical.get("changes")
    if not isinstance(raw_changes, list) or not raw_changes:
        raise PreviewRenderError("a boundary preview requires changed cells")
    changed: dict[str, Mapping[str, str]] = {}
    for item in raw_changes:
        if (
            not isinstance(item, dict)
            or not isinstance(item.get("DGUID"), str)
            or not isinstance(item.get("from"), str)
            or not isinstance(item.get("to"), str)
        ):
            raise PreviewRenderError("the boundary preview proposal is invalid")
        changed[item["DGUID"]] = item
    if len(changed) != len(raw_changes):
        raise PreviewRenderError("the boundary preview contains duplicate cells")

    decoder = _TopologyDecoder(topology)
    geometries: dict[str, tuple[dict[str, Any], object]] = {}
    for geometry in decoder.geometries:
        properties = geometry.get("properties") if isinstance(geometry, dict) else None
        dguid = properties.get("DGUID") if isinstance(properties, dict) else None
        if isinstance(dguid, str):
            geometries[dguid] = (properties, geometry)

    changed_cells: list[dict[str, Any]] = []
    pruid = ""
    for dguid, change in changed.items():
        entry = geometries.get(dguid)
        if entry is None:
            raise PreviewRenderError("a changed cell is missing from preview authority")
        properties, geometry = entry
        leaf = properties.get("leaf_tag")
        cell_pruid = str(properties.get("PRUID", "")).zfill(2)
        if leaf != change["from"] or not cell_pruid:
            raise PreviewRenderError("preview authority disagrees with the proposal")
        if pruid and pruid != cell_pruid:
            raise PreviewRenderError("a boundary preview spans jurisdictions")
        pruid = cell_pruid
        polygons = _project_polygons(decoder.polygons(geometry))
        points = _geometry_points(polygons)
        if not points:
            raise PreviewRenderError("a changed cell has no preview geometry")
        changed_cells.append(
            {"dguid": dguid, "leaf": leaf, "polygons": polygons, "bounds": _bounds(points)}
        )

    changed_points = [
        point
        for cell in changed_cells
        for polygon in cell["polygons"]
        for ring in polygon
        for point in ring
    ]
    panel_frame_width = 724
    panel_frame_height = 665
    view = _fit_view(_bounds(changed_points), panel_frame_width, panel_frame_height)

    visible: list[dict[str, Any]] = []
    changed_by_id = {cell["dguid"]: cell for cell in changed_cells}
    for dguid, (properties, geometry) in geometries.items():
        if dguid in changed_by_id:
            cell = changed_by_id[dguid]
        else:
            polygons = _project_polygons(decoder.polygons(geometry))
            points = _geometry_points(polygons)
            if not points:
                continue
            cell = {
                "dguid": dguid,
                "leaf": str(properties.get("leaf_tag", "")),
                "polygons": polygons,
                "bounds": _bounds(points),
            }
        if _intersects(cell["bounds"], view):
            visible.append(cell)
    if not visible:
        raise PreviewRenderError("no map cells intersect the preview")

    involved_tags = sorted(
        {change["from"] for change in changed.values()} | {change["to"] for change in changed.values()}
    )
    colours = {
        tag: REGION_PALETTE[index % len(REGION_PALETTE)]
        for index, tag in enumerate(involved_tags)
    }

    image = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT), "#FFFFFF")
    draw = ImageDraw.Draw(image)
    title_font = _font(42, bold=True)
    subtitle_font = _font(24)
    label_font = _font(21, bold=True)
    body_font = _font(19)
    small_font = _font(17)

    draw.text((52, 34), "Proposed boundary change", fill="#111827", font=title_font)
    pill_text = "PREVIEW - NOT APPROVED"
    pill_box = draw.textbbox((0, 0), pill_text, font=label_font)
    pill_width = pill_box[2] - pill_box[0] + 34
    draw.rounded_rectangle(
        (IMAGE_WIDTH - pill_width - 52, 38, IMAGE_WIDTH - 52, 82),
        radius=22,
        fill="#FFF0E8",
        outline="#D55E00",
        width=2,
    )
    draw.text(
        (IMAGE_WIDTH - pill_width - 35, 48),
        pill_text,
        fill="#8C2D04",
        font=label_font,
    )

    province = PROVINCE_NAMES.get(pruid, f"Jurisdiction {pruid}")
    count = len(changed)
    draw.text(
        (54, 96),
        f"{count:,} census cell{'s' if count != 1 else ''} | {province}",
        fill="#4B5563",
        font=subtitle_font,
    )

    move_counts = Counter((change["from"], change["to"]) for change in changed.values())
    summary_parts = [
        f"{_tag_label(source, 18)} -> {_tag_label(target, 18)} ({move_count:,})"
        for (source, target), move_count in sorted(move_counts.items())[:3]
    ]
    if len(move_counts) > 3:
        summary_parts.append(f"+{len(move_counts) - 3} more")
    move_summary = "   |   ".join(summary_parts)
    draw.text((54, 134), move_summary, fill="#374151", font=body_font)

    current_frame = (42, 222, 766, 887)
    proposed_frame = (834, 222, 1558, 887)
    draw.text((48, 183), "CURRENT", fill="#4B5563", font=label_font)
    draw.text((840, 183), "PROPOSED", fill="#111827", font=label_font)
    _draw_panel(image, current_frame, view, visible, changed, colours, proposed=False)
    _draw_panel(image, proposed_frame, view, visible, changed, colours, proposed=True)
    draw = ImageDraw.Draw(image)

    legend_x = 54
    legend_y = 916
    for index, tag in enumerate(involved_tags[:8]):
        x = legend_x + index * 132
        draw.rounded_rectangle((x, legend_y, x + 24, legend_y + 24), radius=4, fill=_lighten(colours[tag]), outline=colours[tag], width=2)
        draw.text((x + 32, legend_y + 1), _tag_label(tag, 10), fill="#29313A", font=small_font)
    if len(involved_tags) > 8:
        draw.text((legend_x + 8 * 132, legend_y + 1), f"+{len(involved_tags) - 8} regions", fill="#4B5563", font=small_font)

    footer = "Outlined cells would move. Generated from the submitted proposal and current MeshCore Canada region data."
    draw.text((54, 958), footer, fill="#5F6B76", font=small_font)

    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True, compress_level=9)
    payload = output.getvalue()
    if not payload.startswith(PNG_SIGNATURE):
        raise PreviewRenderError("the boundary preview encoder failed")
    return payload
