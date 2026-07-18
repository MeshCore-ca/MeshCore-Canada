"""Deterministic PNG previews for validated region boundary proposals."""

from __future__ import annotations

import binascii
import io
import math
import struct
import zlib
from collections import Counter
from typing import Any, Mapping

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # The gateway remains usable on a minimal host install.
    Image = None
    ImageDraw = None
    ImageFont = None


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


_FONT_5X7 = {
    " ": (0, 0, 0, 0, 0, 0, 0),
    "A": (14, 17, 17, 31, 17, 17, 17),
    "B": (30, 17, 17, 30, 17, 17, 30),
    "C": (14, 17, 16, 16, 16, 17, 14),
    "D": (30, 17, 17, 17, 17, 17, 30),
    "E": (31, 16, 16, 30, 16, 16, 31),
    "F": (31, 16, 16, 30, 16, 16, 16),
    "G": (14, 17, 16, 23, 17, 17, 14),
    "H": (17, 17, 17, 31, 17, 17, 17),
    "I": (14, 4, 4, 4, 4, 4, 14),
    "J": (7, 2, 2, 2, 2, 18, 12),
    "K": (17, 18, 20, 24, 20, 18, 17),
    "L": (16, 16, 16, 16, 16, 16, 31),
    "M": (17, 27, 21, 21, 17, 17, 17),
    "N": (17, 25, 21, 19, 17, 17, 17),
    "O": (14, 17, 17, 17, 17, 17, 14),
    "P": (30, 17, 17, 30, 16, 16, 16),
    "Q": (14, 17, 17, 17, 21, 18, 13),
    "R": (30, 17, 17, 30, 20, 18, 17),
    "S": (15, 16, 16, 14, 1, 1, 30),
    "T": (31, 4, 4, 4, 4, 4, 4),
    "U": (17, 17, 17, 17, 17, 17, 14),
    "V": (17, 17, 17, 17, 17, 10, 4),
    "W": (17, 17, 17, 21, 21, 21, 10),
    "X": (17, 17, 10, 4, 10, 17, 17),
    "Y": (17, 17, 10, 4, 4, 4, 4),
    "Z": (31, 1, 2, 4, 8, 16, 31),
    "0": (14, 17, 19, 21, 25, 17, 14),
    "1": (4, 12, 4, 4, 4, 4, 14),
    "2": (14, 17, 1, 2, 4, 8, 31),
    "3": (30, 1, 1, 14, 1, 1, 30),
    "4": (2, 6, 10, 18, 31, 2, 2),
    "5": (31, 16, 16, 30, 1, 1, 30),
    "6": (14, 16, 16, 30, 17, 17, 14),
    "7": (31, 1, 2, 4, 8, 8, 8),
    "8": (14, 17, 17, 14, 17, 17, 14),
    "9": (14, 17, 17, 15, 1, 1, 14),
    "-": (0, 0, 0, 31, 0, 0, 0),
    ".": (0, 0, 0, 0, 0, 12, 12),
    ",": (0, 0, 0, 0, 0, 4, 8),
    ":": (0, 4, 4, 0, 4, 4, 0),
    "|": (4, 4, 4, 4, 4, 4, 4),
    ">": (16, 8, 4, 2, 4, 8, 16),
    "+": (0, 4, 4, 31, 4, 4, 0),
    "/": (1, 2, 2, 4, 8, 8, 16),
    "?": (14, 17, 1, 2, 4, 0, 4),
}


def _rgb(colour: str) -> tuple[int, int, int]:
    if len(colour) != 7 or not colour.startswith("#"):
        raise PreviewRenderError("the boundary preview contains an invalid colour")
    try:
        return tuple(int(colour[index:index + 2], 16) for index in (1, 3, 5))
    except ValueError as exc:
        raise PreviewRenderError("the boundary preview contains an invalid colour") from exc


class _StdlibRaster:
    """Small deterministic RGB raster used when Pillow is unavailable."""

    def __init__(self, width: int, height: int, background: str):
        self.width = width
        self.height = height
        self.pixels = bytearray(bytes(_rgb(background)) * (width * height))

    def _set(self, x: int, y: int, colour: tuple[int, int, int]) -> None:
        if 0 <= x < self.width and 0 <= y < self.height:
            offset = (y * self.width + x) * 3
            self.pixels[offset:offset + 3] = colour

    def rectangle(
        self,
        box: tuple[int, int, int, int],
        *,
        fill: str | None = None,
        outline: str | None = None,
        width: int = 1,
    ) -> None:
        left, top, right, bottom = box
        left = max(0, min(self.width - 1, left))
        right = max(0, min(self.width - 1, right))
        top = max(0, min(self.height - 1, top))
        bottom = max(0, min(self.height - 1, bottom))
        if left > right or top > bottom:
            return
        if fill is not None:
            colour = bytes(_rgb(fill))
            row = colour * (right - left + 1)
            for y in range(top, bottom + 1):
                offset = (y * self.width + left) * 3
                self.pixels[offset:offset + len(row)] = row
        if outline is not None and width > 0:
            colour = _rgb(outline)
            for offset in range(width):
                self.line((left + offset, top + offset), (right - offset, top + offset), colour)
                self.line((left + offset, bottom - offset), (right - offset, bottom - offset), colour)
                self.line((left + offset, top + offset), (left + offset, bottom - offset), colour)
                self.line((right - offset, top + offset), (right - offset, bottom - offset), colour)

    def line(
        self,
        start: tuple[int, int],
        end: tuple[int, int],
        colour: str | tuple[int, int, int],
        width: int = 1,
    ) -> None:
        rgb = _rgb(colour) if isinstance(colour, str) else colour
        x0, y0 = start
        x1, y1 = end
        dx = abs(x1 - x0)
        dy = -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        error = dx + dy
        radius = max(0, width - 1) // 2
        while True:
            for py in range(y0 - radius, y0 + radius + 1):
                for px in range(x0 - radius, x0 + radius + 1):
                    self._set(px, py, rgb)
            if x0 == x1 and y0 == y1:
                break
            doubled = 2 * error
            if doubled >= dy:
                error += dy
                x0 += sx
            if doubled <= dx:
                error += dx
                y0 += sy

    def paste(self, source: "_StdlibRaster", position: tuple[int, int]) -> None:
        left, top = position
        for source_y in range(source.height):
            target_y = top + source_y
            if not 0 <= target_y < self.height:
                continue
            source_left = max(0, -left)
            source_right = min(source.width, self.width - left)
            if source_left >= source_right:
                continue
            source_start = (source_y * source.width + source_left) * 3
            source_end = (source_y * source.width + source_right) * 3
            target_start = (target_y * self.width + left + source_left) * 3
            self.pixels[target_start:target_start + source_end - source_start] = (
                source.pixels[source_start:source_end]
            )

    def polygon(
        self,
        points: list[tuple[int, int]],
        *,
        fill: str,
        outline: str,
        width: int,
    ) -> None:
        if len(points) < 3:
            return
        minimum_y = max(0, min(point[1] for point in points))
        maximum_y = min(self.height - 1, max(point[1] for point in points))
        fill_rgb = bytes(_rgb(fill))
        closed = points if points[0] == points[-1] else points + [points[0]]
        for y in range(minimum_y, maximum_y + 1):
            sample_y = y + 0.5
            intersections: list[float] = []
            for first, second in zip(closed, closed[1:]):
                x1, y1 = first
                x2, y2 = second
                if (y1 <= sample_y < y2) or (y2 <= sample_y < y1):
                    intersections.append(x1 + (sample_y - y1) * (x2 - x1) / (y2 - y1))
            intersections.sort()
            for index in range(0, len(intersections) - 1, 2):
                left = max(0, math.ceil(intersections[index]))
                right = min(self.width - 1, math.floor(intersections[index + 1]))
                if left <= right:
                    row = fill_rgb * (right - left + 1)
                    offset = (y * self.width + left) * 3
                    self.pixels[offset:offset + len(row)] = row
        for first, second in zip(closed, closed[1:]):
            self.line(first, second, outline, width)

    def text(
        self,
        position: tuple[int, int],
        value: str,
        *,
        fill: str,
        scale: int,
        bold: bool = False,
    ) -> None:
        x, y = position
        colour = _rgb(fill)
        advance = 6 * scale
        for character in value.upper():
            rows = _FONT_5X7.get(character, _FONT_5X7["?"])
            for row_index, bits in enumerate(rows):
                for column in range(5):
                    if bits & (1 << (4 - column)):
                        left = x + column * scale
                        top = y + row_index * scale
                        for py in range(top, top + scale):
                            for px in range(left, left + scale + (1 if bold else 0)):
                                self._set(px, py, colour)
            x += advance

    def png(self) -> bytes:
        stride = self.width * 3
        raw = bytearray()
        for y in range(self.height):
            raw.append(0)
            start = y * stride
            raw.extend(self.pixels[start:start + stride])

        def chunk(name: bytes, data: bytes) -> bytes:
            checksum = binascii.crc32(name)
            checksum = binascii.crc32(data, checksum) & 0xFFFFFFFF
            return struct.pack(">I", len(data)) + name + data + struct.pack(">I", checksum)

        header = struct.pack(">IIBBBBB", self.width, self.height, 8, 2, 0, 0, 0)
        return (
            PNG_SIGNATURE
            + chunk(b"IHDR", header)
            + chunk(b"IDAT", zlib.compress(bytes(raw), level=9))
            + chunk(b"IEND", b"")
        )


def _stdlib_text_width(value: str, scale: int) -> int:
    return max(0, len(value) * 6 * scale - scale)


def _stdlib_trim(value: str, maximum_width: int, scale: int) -> str:
    maximum_chars = max(1, (maximum_width + scale) // (6 * scale))
    if len(value) <= maximum_chars:
        return value
    if maximum_chars <= 3:
        return value[:maximum_chars]
    return value[:maximum_chars - 3] + "..."


def _draw_stdlib_panel(
    raster: _StdlibRaster,
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
    panel = _StdlibRaster(frame_width, frame_height, background)
    local_frame = (0, 0, frame_width - 1, frame_height - 1)
    changed_width = 3 if len(changed) <= 50 else 2 if len(changed) <= 250 else 1
    for cell in visible:
        dguid = cell["dguid"]
        tag = changed[dguid]["to"] if proposed and dguid in changed else cell["leaf"]
        fill = _lighten(colours[tag]) if tag in colours else "#E7EBEF"
        outline = "#151B23" if dguid in changed else "#AEB7C0"
        width = changed_width if dguid in changed else 1
        for polygon in cell["polygons"]:
            outer = _screen_ring(polygon[0], view, local_frame)
            panel.polygon(outer, fill=fill, outline=outline, width=width)
            for hole in polygon[1:]:
                interior = _screen_ring(hole, view, local_frame)
                panel.polygon(interior, fill=background, outline=outline, width=1)
    raster.paste(panel, (frame[0], frame[1]))
    raster.rectangle(frame, outline="#B7C0C9", width=2)


def _render_stdlib_preview(
    *,
    changed: Mapping[str, Mapping[str, str]],
    visible: list[dict[str, Any]],
    colours: Mapping[str, str],
    involved_tags: list[str],
    pruid: str,
    view: tuple[float, float, float, float],
) -> bytes:
    raster = _StdlibRaster(IMAGE_WIDTH, IMAGE_HEIGHT, "#FFFFFF")
    raster.text((52, 34), "PROPOSED BOUNDARY CHANGE", fill="#111827", scale=6, bold=True)

    pill_text = "PREVIEW - NOT APPROVED"
    pill_scale = 3
    pill_width = _stdlib_text_width(pill_text, pill_scale) + 34
    pill_left = IMAGE_WIDTH - pill_width - 52
    raster.rectangle((pill_left, 38, IMAGE_WIDTH - 52, 82), fill="#FFF0E8", outline="#D55E00", width=2)
    raster.text((pill_left + 17, 49), pill_text, fill="#8C2D04", scale=pill_scale, bold=True)

    province = PROVINCE_NAMES.get(pruid, f"Jurisdiction {pruid}")
    count = len(changed)
    subtitle = f"{count:,} CENSUS CELL{'S' if count != 1 else ''} | {province}"
    raster.text((54, 99), _stdlib_trim(subtitle, 1490, 4), fill="#4B5563", scale=4)

    move_counts = Counter((change["from"], change["to"]) for change in changed.values())
    summary_parts = [
        f"{_tag_label(source, 18)} > {_tag_label(target, 18)}: {move_count:,}"
        for (source, target), move_count in sorted(move_counts.items())[:3]
    ]
    if len(move_counts) > 3:
        summary_parts.append(f"+{len(move_counts) - 3} MORE")
    move_summary = " | ".join(summary_parts)
    raster.text((54, 145), _stdlib_trim(move_summary, 1490, 3), fill="#374151", scale=3)

    current_frame = (42, 222, 766, 887)
    proposed_frame = (834, 222, 1558, 887)
    raster.text((48, 184), "CURRENT", fill="#4B5563", scale=4, bold=True)
    raster.text((840, 184), "PROPOSED", fill="#111827", scale=4, bold=True)
    _draw_stdlib_panel(raster, current_frame, view, visible, changed, colours, proposed=False)
    _draw_stdlib_panel(raster, proposed_frame, view, visible, changed, colours, proposed=True)

    legend_x = 54
    legend_y = 916
    for index, tag in enumerate(involved_tags[:8]):
        x = legend_x + index * 132
        raster.rectangle(
            (x, legend_y, x + 24, legend_y + 24),
            fill=_lighten(colours[tag]),
            outline=colours[tag],
            width=2,
        )
        raster.text((x + 32, legend_y + 2), _tag_label(tag, 10), fill="#29313A", scale=3)
    if len(involved_tags) > 8:
        raster.text(
            (legend_x + 8 * 132, legend_y + 2),
            f"+{len(involved_tags) - 8} REGIONS",
            fill="#4B5563",
            scale=3,
        )

    footer = "OUTLINED CELLS WOULD MOVE. GENERATED FROM CURRENT MESHCORE CANADA REGION DATA."
    raster.text((54, 959), _stdlib_trim(footer, 1490, 3), fill="#5F6B76", scale=3)
    payload = raster.png()
    if not payload.startswith(PNG_SIGNATURE):
        raise PreviewRenderError("the boundary preview encoder failed")
    return payload


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

    if Image is None:
        return _render_stdlib_preview(
            changed=changed,
            visible=visible,
            colours=colours,
            involved_tags=involved_tags,
            pruid=pruid,
            view=view,
        )

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
