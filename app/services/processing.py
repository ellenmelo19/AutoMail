from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Iterable

from pypdf import PdfReader


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


@dataclass
class EmailAnalysis:
    source: str
    raw_text: str
    cleaned_text: str
    word_count: int
    classification: str
    response: str


def extract_text_from_upload(filename: str, data: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)

    return decode_text_bytes(data)


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


def classify_email(text: str) -> str:
    lowered = text.lower()
    productive_score = count_matches(lowered, PRODUCTIVE_KEYWORDS)
    improductive_score = count_matches(lowered, IMPRODUCTIVE_KEYWORDS)

    if productive_score == 0 and improductive_score == 0:
        return "Produtivo"
    if productive_score >= improductive_score:
        return "Produtivo"
    return "Improdutivo"


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
    words = cleaned.split() if cleaned else []
    classification = classify_email(cleaned)
    response = suggest_response(classification)

    return EmailAnalysis(
        source=source,
        raw_text=raw_text,
        cleaned_text=cleaned,
        word_count=len(words),
        classification=classification,
        response=response,
    )
