from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.services.processing import (  # noqa: E402
    _extract_pdf_with_ocr,
    _extract_pdf_with_pymupdf,
    _extract_pdf_with_pypdf,
    ocr_is_available,
)


def main() -> None:
    if len(sys.argv) < 2:
        print("Uso: python scripts/ocr_debug.py <caminho-do-pdf>")
        raise SystemExit(1)

    load_dotenv()

    path = Path(sys.argv[1])
    if not path.exists():
        print("Arquivo não encontrado:", path)
        raise SystemExit(1)

    data = path.read_bytes()
    print("OCR disponível:", ocr_is_available())

    text_pypdf = _extract_pdf_with_pypdf(data)
    print("PyPDF len:", len(text_pypdf))

    text_pymupdf = _extract_pdf_with_pymupdf(data)
    print("PyMuPDF len:", len(text_pymupdf))

    text_ocr = _extract_pdf_with_ocr(data)
    print("OCR len:", len(text_ocr))
    print("OCR preview:", text_ocr[:300].replace("\n", " "))


if __name__ == "__main__":
    main()
