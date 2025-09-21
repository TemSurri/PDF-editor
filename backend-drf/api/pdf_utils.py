import fitz  # this is just PyMuPDF
import io
import base64

def merge_pdf_with_edits(pdf_file, edits):
   
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
