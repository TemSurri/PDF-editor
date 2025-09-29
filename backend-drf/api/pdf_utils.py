import fitz  # this the pyMuPDF
import io
import base64
import io, json
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from typing import List, Dict
import math

def merge_pdf_with_edits(pdf_file, edits):
    """
    Overlays images of edits with PDF
    """
    pdf_doc = fitz.open(stream=pdf_file.read(), filetype="pdf")

    for edit in edits:
        page_index = edit["index"]
        png_data = edit.get("png")
        if not png_data:
            continue

        if png_data.startswith("data:image/png;base64,"):
            png_data = png_data.split(",")[1]

        image_bytes = base64.b64decode(png_data)
        page = pdf_doc[page_index]
        rect = page.rect 
        page.insert_image(rect, stream=image_bytes)

    output_pdf = io.BytesIO()
    pdf_doc.save(output_pdf)
    pdf_doc.close()
    output_pdf.seek(0)
    return output_pdf

def sanitize_filename(name: str) -> str:
    allowed_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_. "
    return "".join(c if c in allowed_chars else "_" for c in name)

def segment_intersects_eraser(segment: List[float], eraser_lines: List[Dict], tolerance: float = 2.0) -> bool:
    x1, y1, x2, y2 = segment
    for eraser in eraser_lines:
        points = eraser.get("points", [])
        for i in range(0, len(points) - 2, 2):
            ex1, ey1, ex2, ey2 = points[i], points[i+1], points[i+2], points[i+3]
            if (max(x1, x2) + tolerance < min(ex1, ex2) or
                min(x1, x2) - tolerance > max(ex1, ex2) or
                max(y1, y2) + tolerance < min(ey1, ey2) or
                min(y1, y2) - tolerance > max(ey1, ey2)):
                continue
            return True
    return False

def interpolate_line_points(points: List[float], max_dist: float = 2.0) -> List[float]:
    """Im Split all tha long line segments into shorter ones for smootherand more accurate drawing."""
    if len(points) < 4:
        return points[:]
    
    new_points = [points[0], points[1]]
    for i in range(2, len(points), 2):
        x1, y1 = new_points[-2], new_points[-1]
        x2, y2 = points[i], points[i+1]
        dist = math.hypot(x2 - x1, y2 - y1)
        if dist <= max_dist:
            new_points += [x2, y2]
            continue
        steps = int(math.ceil(dist / max_dist))
        for step in range(1, steps + 1):
            nx = x1 + (x2 - x1) * step / steps
            ny = y1 + (y2 - y1) * step / steps
            new_points += [nx, ny]
    return new_points

def split_line_by_eraser(points: List[float], eraser_lines: List[Dict]) -> List[List[float]]:

    if len(points) < 4:
        return []

    segments = []
    current = points[:2]

    for i in range(2, len(points), 2):
        seg = [current[-2], current[-1], points[i], points[i+1]]
        if segment_intersects_eraser(seg, eraser_lines):
            if len(current) > 2:
                segments.append(current)
            current = points[i:i+2]
        else:
            current += points[i:i+2]

    if len(current) > 2:
        segments.append(current)

    return segments

def apply_edits_to_pdf(pdf_bytes: bytes, edits_json: str) -> bytes:
    """
    Apply pen lines, eraser lines, and text edits to a PDF.
    Lines are interpolated and split to match the original strokes.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    edits: List[Dict] = json.loads(edits_json)

    for page_index, page in enumerate(reader.pages):
        try:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            page_edits = next((e for e in edits if e.get("page") == page_index + 1), None)

            if page_edits:
                pen_lines = [l for l in page_edits.get("lines", []) if l.get("tool") != "eraser"]
                eraser_lines = [l for l in page_edits.get("lines", []) if l.get("tool") == "eraser"]

                if pen_lines or page_edits.get("texts"):
                    packet = io.BytesIO()
                    c = canvas.Canvas(packet, pagesize=(width, height))

                    for line in pen_lines:
                        points = interpolate_line_points(line.get("points", []))
                        sublines = split_line_by_eraser(points, eraser_lines)
                        c.setLineWidth(line.get("strokeWidth", 2))
                        hexcolor = line.get("strokeColor", "#000000")
                        c.setStrokeColorRGB(
                            int(hexcolor[1:3], 16)/255.0,
                            int(hexcolor[3:5], 16)/255.0,
                            int(hexcolor[5:7], 16)/255.0
                        )

                        for sub in sublines:
                            for i in range(0, len(sub)-2, 2):
                                c.line(sub[i], height - sub[i+1], sub[i+2], height - sub[i+3])

                    for t in page_edits.get("texts", []):
                        font_size = t.get("fontSize", 12)
                        c.setFont("Helvetica", font_size)
                        c.drawString(t.get("x", 0), height - t.get("y", 0) - font_size, t.get("text", ""))

                    c.save()
                    packet.seek(0)
                    overlay_pdf = PdfReader(packet)
                    page.merge_page(overlay_pdf.pages[0])

            writer.add_page(page)
        except Exception as e:
            print(f"Error processing page {page_index + 1}: {e}")
            writer.add_page(page)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    output_stream.seek(0)
    return output_stream.read()
