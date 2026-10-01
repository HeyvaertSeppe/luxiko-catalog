"""
One-off extractor: reads the original LUXIKO catalog PDF and writes
seed/products.json + seed/images/<CODE>.png (+ brand assets).
After extracting, upscale the photos to seed/images/<CODE>.webp with
tools/upscale_photos.cjs (the app prefers the .webp versions).

Usage: python3 tools/extract_catalog.py LUXIKO_Product_Catalog_2027_K1.pdf
(also writes public/brand/hero.jpg and seed/brand/logo.png)
"""
import json
import os
import re
import sys

import pymupdf

SRC = sys.argv[1] if len(sys.argv) > 1 else "LUXIKO_Product_Catalog_2027_K1.pdf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, "seed")
IMG_DIR = os.path.join(SEED, "images")
BRAND_DIR = os.path.join(ROOT, "seed", "brand")
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(BRAND_DIR, exist_ok=True)

ORANGE = 0xF2AE1C
# Sections that are not sold any more and are left out of the catalog
EXCLUDED_SECTIONS = {"Controllers"}

SERIES = {"BUDGET SERIES": "B", "STANDARD SERIES": "S", "PREMIUM SERIES": "P"}
YES_NO = {"yes": True, "no": False}

# The source PDF cut long values off with an ellipsis. Expand the common
# cut-offs we can be sure about; otherwise drop the partial word and flag the
# product so it shows up as "needs review" in the admin.
EXPANSIONS = [
    (r"Master/Sl…$", "Master/Slave"),
    (r"Sound, Au…$", "Sound, Auto"),
    (r"Master/Slave, Soun…$", "Master/Slave, Sound"),
    (r"RDM, Art-…$", "RDM, Art-Net"),
    (r"linear dim…$", "linear dimming"),
    (r"linear adjus…$", "linear adjustable"),
    (r"linearly adj…$", "linearly adjustable"),
    (r"smoothly d…$", "smoothly dimming"),
    (r"fan cooling s…$", "fan cooling system"),
]


def clean_truncated(value):
    for pat, rep in EXPANSIONS:
        if re.search(pat, value):
            return re.sub(pat, rep, value), True
    head = value.split("…")[0]
    head = re.sub(r"[\s(,*]*\S*$", "", head) if " " in head else head
    return head.rstrip(" ,(*-"), False


doc = pymupdf.open(SRC)

# Brand assets: cover photo + logo
cover = doc[0]
for info in cover.get_image_info(xrefs=True):
    pix = pymupdf.Pixmap(doc, info["xref"])
    if pix.n - pix.alpha > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    if info["width"] > 1000:
        pix.save(os.path.join(ROOT, "public", "brand", "hero.jpg"), jpg_quality=85)
    else:
        pix.save(os.path.join(BRAND_DIR, "logo.png"))

# Line-art icon used on the Moving Heads divider page (navy on white -> transparent)
for pno, page in enumerate(doc):
    if "F I X T U R E S" not in page.get_text():
        continue
    for info in page.get_image_info(xrefs=True):
        if info["width"] == 486:  # logo
            continue
        pix = pymupdf.Pixmap(doc, info["xref"])
        samples = pix.samples
        w, h = pix.width, pix.height
        alpha = bytearray(max(0, min(255, (255 - samples[i * pix.n]) * 255 // (255 - 32))) for i in range(w * h))
        rgb = bytes([32, 42, 75]) * (w * h)
        icon = pymupdf.Pixmap(pymupdf.csRGB, w, h, rgb, False)
        icon = pymupdf.Pixmap(icon, pymupdf.Pixmap(pymupdf.csGRAY, w, h, bytes(alpha), False))
        name = page.get_text().split("\n")[0].lower().replace(" ", "-")
        os.makedirs(os.path.join(ROOT, "public", "brand", "icons"), exist_ok=True)
        icon.save(os.path.join(ROOT, "public", "brand", "icons", f"{name}.png"))

products = []
sections = []
order = 0

for pno, page in enumerate(doc):
    spans = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            for s in line["spans"]:
                if s["text"].strip():
                    spans.append(s)
    # Section header: 45pt title, orange 33pt IP label
    title_parts = [s["text"].strip() for s in spans if abs(s["size"] - 45) < 1]
    ip_parts = [s["text"].strip() for s in spans if abs(s["size"] - 33) < 1 and s["color"] == ORANGE]
    series_parts = [s["text"].strip() for s in spans if s["text"].strip() in SERIES]
    codes = [s for s in spans if abs(s["size"] - 19.5) < 0.3 and s["color"] == 0x111111]
    if not codes or not title_parts:
        continue
    section = " ".join(title_parts)
    if section in EXCLUDED_SECTIONS:
        continue
    ip = ip_parts[0] if ip_parts else "IP N/A"
    series = SERIES[series_parts[0]] if series_parts else None
    if section not in sections:
        sections.append(section)

    images = [i for i in page.get_image_info(xrefs=True) if i["bbox"][0] < 200 and i["bbox"][1] > 100]
    codes.sort(key=lambda s: s["bbox"][1])
    for idx, cs in enumerate(codes):
        y0 = cs["bbox"][1]
        y1 = codes[idx + 1]["bbox"][1] if idx + 1 < len(codes) else 800
        block = [s for s in spans if y0 <= s["bbox"][1] < y1 - 1 and s is not cs]
        name = next((s["text"].strip() for s in block if s["color"] == ORANGE and s["bbox"][1] < y0 + 40), "")
        dmx = next((s["text"].strip() for s in block
                    if 380 < s["bbox"][0] < 420 and s["bbox"][1] < y0 + 40), "-")
        # Specs sit in two columns starting at x=166 and x=336. Fragments that
        # start elsewhere on the same line belong to the spec on their left.
        spec_spans = [s for s in block if abs(s["size"] - 11.2) < 0.5 and s["bbox"][1] > y0 + 35]
        entries = []
        for s in sorted(spec_spans, key=lambda s: (s["bbox"][1], s["bbox"][0])):
            x = s["bbox"][0]
            col = 0 if x < 330 else 1
            text = s["text"].replace("\x00", " ")
            if abs(x - 166) < 3 or abs(x - 336) < 3:
                entries.append({"col": col, "y": s["bbox"][1], "text": text})
            elif entries:
                same = [e for e in entries if e["col"] == col and abs(e["y"] - s["bbox"][1]) < 2]
                (same[-1] if same else entries[-1])["text"] += " " + text
        entries.sort(key=lambda e: (e["col"], e["y"]))
        specs, caps = [], []
        review = False
        for e in entries:
            text = re.sub(r"\s+", " ", e["text"]).strip()
            m = re.match(r"^([^:]{1,24}):\s*(.*)$", text)
            if not m:
                continue
            label, value = m.group(1).strip(), m.group(2).strip()
            label = {"Gobo's": "Gobos", "Op. Temp": "Operating Temp"}.get(label, label)
            if "…" in value:
                value, fixed = clean_truncated(value)
                review = review or not fixed
            if value.lower() in YES_NO:
                caps.append({"label": label, "enabled": YES_NO[value.lower()]})
            elif value and value not in ("-", "kg", "Hz"):
                specs.append({"label": label, "value": value})
        img = None
        best = None
        for i in images:
            d = abs(i["bbox"][1] - (y0 + 23))
            if d < 30 and (best is None or d < best):
                best, img = d, i
        code = cs["text"].strip()
        image_file = None
        if img:
            pix = pymupdf.Pixmap(doc, img["xref"])
            if pix.n - pix.alpha > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            image_file = f"{code}.png"
            pix.save(os.path.join(IMG_DIR, image_file))

        dmx_modes = [] if dmx.strip() == "-" else [
            (m.strip() + " more" if m.strip().startswith("+") else m.strip())
            for m in dmx.split("/") if m.strip()]
        order += 1
        products.append({
            "code": code,
            "name": name,
            "section": section,
            "series": series,
            "ip": ip,
            "dmxModes": dmx_modes,
            "capabilities": caps,
            "specs": specs,
            "image": image_file,
            "sortOrder": order,
            "needsReview": review,
            "sourcePage": pno + 1,
        })

codes = [p["code"] for p in products]
dups = {c for c in codes if codes.count(c) > 1}
if dups:
    print("DUPLICATE CODES:", dups)

with open(os.path.join(SEED, "products.json"), "w") as f:
    json.dump({"sections": sections, "products": products}, f, indent=2, ensure_ascii=False)
print(len(products), "products,", len(sections), "sections,",
      sum(1 for p in products if p["image"]), "with image")
