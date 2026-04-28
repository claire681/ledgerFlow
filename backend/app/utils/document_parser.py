import io
import csv
from pathlib import Path
from fastapi import UploadFile


async def extract_text(file: UploadFile) -> tuple[str, str]:
    """
    Returns (raw_text, file_extension).
    Reads the file bytes and extracts readable text based on type.
    """
    content = await file.read()
    ext = Path(file.filename).suffix.lower().lstrip(".")

    if ext == "pdf":
        text = _parse_pdf(content)
    elif ext == "csv":
        text = _parse_csv(content)
    elif ext in ("png", "jpg", "jpeg", "tiff", "bmp"):
        text = _parse_image_ocr(content)
    elif ext in ("txt", "text"):
        text = content.decode("utf-8", errors="ignore")
    else:
        text = content.decode("utf-8", errors="ignore")

    return text, ext


def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        return "\n".join(pages)
    except Exception as e:
        return f"[PDF parse error: {e}]"


def _parse_csv(content: bytes) -> str:
    """Convert CSV bytes to readable text."""
    try:
        decoded = content.decode("utf-8", errors="ignore")
        reader  = csv.reader(io.StringIO(decoded))
        lines   = []
        for row in reader:
            lines.append(", ".join(row))
        return "\n".join(lines)
    except Exception as e:
        return f"[CSV parse error: {e}]"


def _parse_image_ocr(content: bytes) -> str:
    """OCR an image using Tesseract."""
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(img)
    except ImportError:
        return "[OCR unavailable — install pytesseract and tesseract-ocr]"
    except Exception as e:
        return f"[OCR error: {e}]"