import json
import re
import statistics
import sys

import pdfplumber
from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar, LTFigure, LTImage


def clamp(value, low, high):
    return max(low, min(high, value))


def slugify(text):
    cleaned = re.sub(r"[^a-z0-9]+", "-", str(text or "").strip().lower())
    cleaned = cleaned.strip("-")
    return cleaned or "region"


def normalize_font_weight(fontname):
    lowered = str(fontname or "").lower()
    if any(token in lowered for token in ("black", "bold", "heavy", "semibold", "demibold")):
        return 700
    return 400


def infer_text_align(lines, page_width):
    if not lines:
        return "left"

    if len(lines) == 1:
        line = lines[0]
        margin_left = line["x0"]
        margin_right = page_width - line["x1"]
        if abs(margin_left - margin_right) <= max(18, page_width * 0.03):
            return "center"
        return "left"

    lefts = [line["x0"] for line in lines]
    rights = [page_width - line["x1"] for line in lines]
    centers = [((line["x0"] + line["x1"]) / 2.0) for line in lines]

    if max(centers) - min(centers) <= max(24, page_width * 0.035) and max(lefts) - min(lefts) > max(16, page_width * 0.02):
        return "center"

    if max(rights) - min(rights) <= max(24, page_width * 0.035) and max(lefts) - min(lefts) > max(16, page_width * 0.02):
        return "right"

    return "left"


def make_text_label(text, fallback):
    cleaned = re.sub(r"\s+", " ", str(text or "")).strip()
    if not cleaned:
        return fallback

    words = cleaned.split(" ")
    if len(words) <= 4:
        return " ".join(words)

    return " ".join(words[:4])


def bucket_words_into_lines(words):
    rows = []

    for word in sorted(words, key=lambda item: (item["top"], item["x0"])):
        placed = False

        for row in rows:
            tolerance = max(3.0, min(row["size"], word["size"]) * 0.4)
            if abs(word["top"] - row["top"]) <= tolerance:
                row["words"].append(word)
                row["tops"].append(word["top"])
                row["size"] = statistics.median([item["size"] for item in row["words"]])
                row["top"] = statistics.median(row["tops"])
                placed = True
                break

        if not placed:
            rows.append({
                "top": word["top"],
                "tops": [word["top"]],
                "size": word["size"],
                "words": [word]
            })

    line_segments = []

    for row in rows:
        sorted_words = sorted(row["words"], key=lambda item: item["x0"])
        current = [sorted_words[0]]

        for word in sorted_words[1:]:
            previous = current[-1]
            gap = word["x0"] - previous["x1"]
            size = statistics.median([item["size"] for item in current] + [word["size"]])
            threshold = max(18.0, size * 1.35)

            if gap > threshold:
                line_segments.append(current)
                current = [word]
            else:
                current.append(word)

        line_segments.append(current)

    lines = []

    for segment in line_segments:
        font_sizes = [item["size"] for item in segment]
        lines.append({
            "text": " ".join(item["text"] for item in segment),
            "x0": min(item["x0"] for item in segment),
            "x1": max(item["x1"] for item in segment),
            "top": min(item["top"] for item in segment),
            "bottom": max(item["bottom"] for item in segment),
            "size": statistics.median(font_sizes),
            "fontname": segment[0]["fontname"],
            "fontweight": normalize_font_weight(segment[0]["fontname"])
        })

    return sorted(lines, key=lambda item: (item["top"], item["x0"]))


def merge_lines_into_blocks(lines, page_width):
    blocks = []

    for line in lines:
        if not blocks:
            blocks.append({
                "lines": [line],
                "x0": line["x0"],
                "x1": line["x1"],
                "top": line["top"],
                "bottom": line["bottom"],
                "size": line["size"],
                "fontname": line["fontname"],
                "fontweight": line["fontweight"]
            })
            continue

        previous = blocks[-1]
        vertical_gap = line["top"] - previous["bottom"]
        overlap = max(0.0, min(line["x1"], previous["x1"]) - max(line["x0"], previous["x0"]))
        previous_width = max(1.0, previous["x1"] - previous["x0"])
        current_width = max(1.0, line["x1"] - line["x0"])
        overlap_ratio = overlap / min(previous_width, current_width)
        left_close = abs(line["x0"] - previous["x0"]) <= max(26.0, page_width * 0.02)
        center_close = abs(((line["x0"] + line["x1"]) / 2.0) - ((previous["x0"] + previous["x1"]) / 2.0)) <= max(32.0, page_width * 0.04)
        size_ratio = max(line["size"], previous["size"]) / max(1.0, min(line["size"], previous["size"]))
        current_family = line["fontname"].split("+")[-1].split("-")[0]
        previous_family = previous["fontname"].split("+")[-1].split("-")[0]

        should_merge = (
            vertical_gap <= max(10.0, min(line["size"], previous["size"]) * 1.45) and
            size_ratio <= 1.3 and
            current_family == previous_family and
            (left_close or center_close or overlap_ratio >= 0.45)
        )

        if should_merge:
            previous["lines"].append(line)
            previous["x0"] = min(previous["x0"], line["x0"])
            previous["x1"] = max(previous["x1"], line["x1"])
            previous["top"] = min(previous["top"], line["top"])
            previous["bottom"] = max(previous["bottom"], line["bottom"])
            previous["size"] = statistics.median([item["size"] for item in previous["lines"]])
            previous["fontweight"] = max(previous["fontweight"], line["fontweight"])
            continue

        blocks.append({
            "lines": [line],
            "x0": line["x0"],
            "x1": line["x1"],
            "top": line["top"],
            "bottom": line["bottom"],
            "size": line["size"],
            "fontname": line["fontname"],
            "fontweight": line["fontweight"]
        })

    return blocks


def extract_text_regions(page, page_name, region_start_index):
    words = [
        word for word in (page.extract_words(extra_attrs=["fontname", "size"]) or [])
        if str(word.get("text", "")).strip()
    ]
    if not words:
        return [], region_start_index

    lines = bucket_words_into_lines(words)
    blocks = merge_lines_into_blocks(lines, page.width)
    regions = []
    counter = region_start_index

    for block in blocks:
        width = block["x1"] - block["x0"]
        height = block["bottom"] - block["top"]
        text = "\n".join(item["text"] for item in block["lines"]).strip()

        if width < max(28.0, page.width * 0.03):
            continue
        if height < 10.0:
            continue
        if len(re.sub(r"\s+", "", text)) < 2:
            continue

        label = make_text_label(text, f"Text Area {counter}")
        region_id = slugify(f"{page_name}-{counter}-{label}")
        align = infer_text_align(block["lines"], page.width)
        median_size = statistics.median([item["size"] for item in block["lines"]])

        regions.append({
            "id": region_id,
            "page": page_name,
            "type": "text",
            "label": label,
            "x": round(clamp(block["x0"], 0.0, page.width - width)),
            "y": round(clamp(block["top"], 0.0, page.height - height)),
            "width": round(width),
            "height": round(height),
            "background": "transparent",
            "textColor": "#111111",
            "content": text,
            "originalContent": text,
            "fontSize": round(median_size),
            "fontWeight": block["fontweight"],
            "textAlign": align,
            "radius": 8,
            "borderColor": "rgba(181,46,51,0.46)"
        })
        counter += 1

    return regions, counter


def bbox_intersection(box_a, box_b):
    x0 = max(box_a[0], box_b[0])
    y0 = max(box_a[1], box_b[1])
    x1 = min(box_a[2], box_b[2])
    y1 = min(box_a[3], box_b[3])
    if x1 <= x0 or y1 <= y0:
        return None
    return (x0, y0, x1, y1)


def area(box):
    return max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])


def is_inside_page(box, page_width, page_height, epsilon=2.0):
    return (
        box[0] >= -epsilon and
        box[1] >= -epsilon and
        box[2] <= page_width + epsilon and
        box[3] <= page_height + epsilon
    )


def walk_layout(node, depth, figures):
    children = list(getattr(node, "_objs", []) or [])
    has_image = isinstance(node, LTImage)
    has_text = isinstance(node, LTChar)

    for child in children:
        child_has_image, child_has_text = walk_layout(child, depth + 1, figures)
        has_image = has_image or child_has_image
        has_text = has_text or child_has_text

    if isinstance(node, LTFigure):
        figures.append({
            "name": getattr(node, "name", None),
            "bbox": tuple(node.bbox),
            "depth": depth,
            "has_image": has_image,
            "has_text": has_text
        })

    return has_image, has_text


def dedupe_image_candidates(candidates):
    kept = []

    for candidate in sorted(candidates, key=lambda item: (area(item["bbox"]), item["depth"])):
        candidate_area = area(candidate["bbox"])
        if candidate_area <= 0:
            continue

        duplicate = False
        for kept_item in kept:
            intersection = bbox_intersection(candidate["bbox"], kept_item["bbox"])
            if not intersection:
                continue

            overlap_ratio = area(intersection) / candidate_area
            if overlap_ratio >= 0.72:
                duplicate = True
                break

        if not duplicate:
            kept.append(candidate)

    return kept


def extract_image_regions(pdf_path, page_limit):
    image_regions_by_page = {}

    for page_index, layout in enumerate(extract_pages(pdf_path), start=1):
        if page_index > page_limit:
            break

        figures = []
        walk_layout(layout, 0, figures)
        page_width = float(layout.width)
        page_height = float(layout.height)
        page_area = page_width * page_height
        page_bbox = (0.0, 0.0, page_width, page_height)

        inside_candidates = []
        clipped_candidates = []

        for figure in figures:
            if not figure["has_image"]:
                continue

            clipped_bbox = bbox_intersection(page_bbox, figure["bbox"])
            if not clipped_bbox:
                continue

            width = clipped_bbox[2] - clipped_bbox[0]
            height = clipped_bbox[3] - clipped_bbox[1]
            fraction = (width * height) / page_area

            if width < page_width * 0.1 or height < page_height * 0.1:
                continue
            if fraction < 0.025 or fraction > 0.72:
                continue

            payload = {
                **figure,
                "bbox": clipped_bbox
            }

            if is_inside_page(figure["bbox"], page_width, page_height):
                inside_candidates.append(payload)
            else:
                clipped_candidates.append(payload)

        candidates = inside_candidates if inside_candidates else clipped_candidates
        image_regions_by_page[page_index] = dedupe_image_candidates(candidates)

    return image_regions_by_page


def build_image_region(page_height, page_name, bbox, index):
    x0, y0, x1, y1 = bbox
    width = x1 - x0
    height = y1 - y0
    top = page_height - y1
    label = f"Image Area {index}"
    region_id = slugify(f"{page_name}-{label}")

    return {
        "id": region_id,
        "page": page_name,
        "type": "image",
        "label": label,
        "x": round(x0),
        "y": round(top),
        "width": round(width),
        "height": round(height),
        "background": "transparent",
        "objectFit": "cover",
        "radius": 8,
        "borderColor": "rgba(181,46,51,0.46)"
    }


def extract_regions(pdf_path, max_pages):
    results = {
        "pageSize": None,
        "editableRegions": []
    }

    image_regions_by_page = extract_image_regions(pdf_path, max_pages)

    with pdfplumber.open(pdf_path) as pdf:
        region_index = 1

        for page_number, page in enumerate(pdf.pages[:max_pages], start=1):
            page_name = f"page{page_number}"

            if results["pageSize"] is None:
                results["pageSize"] = {
                    "width": float(page.width),
                    "height": float(page.height)
                }

            text_regions, region_index = extract_text_regions(page, page_name, region_index)
            results["editableRegions"].extend(text_regions)

            page_image_regions = image_regions_by_page.get(page_number, [])
            ordered_images = sorted(
                page_image_regions,
                key=lambda item: (page.height - item["bbox"][3], item["bbox"][0])
            )

            for image_index, region in enumerate(ordered_images, start=1):
                results["editableRegions"].append(
                    build_image_region(page.height, page_name, region["bbox"], image_index)
                )

    return results


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: extract_pdf_regions.py <pdf_path> [max_pages]")

    pdf_path = sys.argv[1]
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    payload = extract_regions(pdf_path, max_pages)
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
