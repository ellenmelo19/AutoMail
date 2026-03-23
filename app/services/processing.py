from __future__ import annotations

import io
import os
import re
import shutil
from dataclasses import dataclass
from typing import Iterable

from pypdf import PdfReader

from app.services.gemini_client import classify_with_gemini
from app.services.nlp import preprocess_text, stem_words, tokenize


PRODUCTIVE_KEYWORDS = {
    "suporte",
    "erro",
    "problema",
    "bug",
    "incidente",
    "chamado",
    "ticket",
    "status",
    "atualização",
    "prazo",
    "fatura",
    "cobrança",
    "anexo",
    "documento",
    "acesso",
    "senha",
    "redefinir",
    "login",
    "reclamação",
    "contestação",
    "protocolo",
    "cancelamento",
    "solicitação",
}

IMPRODUCTIVE_KEYWORDS = {
    "olá",
    "ola",
    "oi",
    "obrigado",
    "obrigada",
    "parabéns",
    "feliz",
    "felicitações",
    "agradeço",
    "agradecimento",
    "boas festas",
    "natal",
    "ano novo",
    "bom dia",
    "boa tarde",
    "boa noite",
}

GREETING_KEYWORDS = {
    "olá",
    "ola",
    "oi",
    "bom dia",
    "boa tarde",
    "boa noite",
}

def _stem_keyword_set(keywords: Iterable[str]) -> set[str]:
    tokens: list[str] = []
    for keyword in keywords:
        parts = tokenize(keyword)
        if len(parts) == 1:
            tokens.append(parts[0])
    return set(stem_words(tokens))


PRODUCTIVE_STEMS = _stem_keyword_set(PRODUCTIVE_KEYWORDS)
IMPRODUCTIVE_STEMS = _stem_keyword_set(IMPRODUCTIVE_KEYWORDS)


@dataclass
class EmailAnalysis:
    source: str
    raw_text: str
    cleaned_text: str
    word_count: int
    classification: str
    response: str
    engine: str


def extract_text_from_upload(filename: str, data: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        text = _extract_pdf_with_pypdf(data)
        if text.strip():
            return text
        text = _extract_pdf_with_pymupdf(data)
        if text.strip():
            return text
        return _extract_pdf_with_ocr(data)

    return decode_text_bytes(data)


def _extract_pdf_with_pypdf(data: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    except Exception:
        return ""


def _extract_pdf_with_pymupdf(data: bytes) -> str:
    try:
        import fitz
    except Exception:
        return ""

    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            return "\n".join(page.get_text("text") for page in doc)
    except Exception:
        return ""


def _extract_pdf_with_ocr(data: bytes) -> str:
    try:
        import fitz
    except Exception:
        return ""

    try:
        import pytesseract
        from PIL import Image
    except Exception:
        return ""

    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    _ensure_tessdata_prefix(tesseract_cmd)

    lang = os.getenv("OCR_LANG", "por")
    config = os.getenv("OCR_CONFIG", "--psm 6")
    texts: list[str] = []

    try:
        with fitz.open(stream=data, filetype="pdf") as doc:
            for page in doc:
                pix = page.get_pixmap(dpi=300, alpha=False)
                image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                gray = image.convert("L")
                text = pytesseract.image_to_string(gray, lang=lang, config=config)
                if text:
                    texts.append(text)
    except Exception:
        return ""

    return "\n".join(texts)


def ocr_is_available() -> bool:
    try:
        import fitz  # noqa: F401
        import pytesseract
        from PIL import Image  # noqa: F401
    except Exception:
        return False

    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        if not os.path.exists(tesseract_cmd):
            return False
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    if not _ensure_tessdata_prefix(tesseract_cmd):
        if not shutil.which("tesseract"):
            return False

    try:
        pytesseract.get_tesseract_version()
    except Exception:
        return False

    return True


def _ensure_tessdata_prefix(tesseract_cmd: str | None) -> str | None:
    tessdata_prefix = os.getenv("TESSDATA_PREFIX")
    if tessdata_prefix and os.path.exists(tessdata_prefix):
        os.environ["TESSDATA_PREFIX"] = tessdata_prefix
        return tessdata_prefix

    cmd = tesseract_cmd or shutil.which("tesseract")
    if not cmd:
        return None

    candidate = os.path.join(os.path.dirname(cmd), "tessdata")
    if os.path.exists(candidate):
        os.environ["TESSDATA_PREFIX"] = candidate
        return candidate

    return None


def decode_text_bytes(data: bytes) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore")


def normalize_text(text: str) -> str:
    cleaned = text.replace("\u00a0", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def count_matches(text: str, keywords: Iterable[str]) -> int:
    return sum(1 for keyword in keywords if keyword in text)


def count_token_matches(tokens: Iterable[str], stems: set[str]) -> int:
    return sum(1 for token in tokens if token in stems)


def classify_email(text: str) -> str:
    lowered = text.lower()
    tokens = preprocess_text(lowered)
    productive_score = count_matches(lowered, PRODUCTIVE_KEYWORDS) + count_token_matches(
        tokens, PRODUCTIVE_STEMS
    )
    improductive_score = count_matches(lowered, IMPRODUCTIVE_KEYWORDS) + count_token_matches(
        tokens, IMPRODUCTIVE_STEMS
    )

    if productive_score == 0 and improductive_score == 0:
        return "Produtivo"
    if productive_score >= improductive_score:
        return "Produtivo"
    return "Improdutivo"


def is_short_greeting(text: str, word_count: int) -> bool:
    if word_count > 4:
        return False
    lowered = text.lower()
    if count_matches(lowered, PRODUCTIVE_KEYWORDS) > 0:
        return False
    return any(keyword in lowered for keyword in GREETING_KEYWORDS)


def suggest_response(classification: str) -> str:
    if classification == "Produtivo":
        return (
            "Olá! Recebemos sua solicitação e já estamos analisando. "
            "Caso exista um prazo específico, retornaremos com atualização em breve. "
            "Se precisar complementar algo, é só responder este email."
        )
    return (
        "Muito obrigado pela mensagem! Ficamos felizes com o contato. "
        "Se surgir alguma necessidade ou dúvida, conte com a gente."
    )


def analyze_email(source: str, raw_text: str) -> EmailAnalysis:
    cleaned = normalize_text(raw_text)
    trimmed = cleaned[:6000]
    words = cleaned.split() if cleaned else []
    classification = classify_email(cleaned)
    response = suggest_response(classification)
    engine = "fallback-local"

    try:
        gemini_result = classify_with_gemini(trimmed)
    except Exception:
        gemini_result = None

    if gemini_result:
        classification = gemini_result.classification
        response = gemini_result.response
        engine = f"gemini:{gemini_result.model}"

    if is_short_greeting(cleaned, len(words)):
        classification = "Improdutivo"
        response = suggest_response("Improdutivo")
        engine = f"{engine}+heuristic"

    return EmailAnalysis(
        source=source,
        raw_text=raw_text,
        cleaned_text=cleaned,
        word_count=len(words),
        classification=classification,
        response=response,
        engine=engine,
    )
