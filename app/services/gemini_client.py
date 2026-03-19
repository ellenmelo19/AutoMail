from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Optional

from google import genai

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

PROMPT_TEMPLATE = """\
Você é um assistente para uma equipe de suporte de uma empresa financeira.

Tarefa:
1) Classificar o email como "Produtivo" ou "Improdutivo".
2) Sugerir uma resposta profissional, curta e objetiva (1 a 3 frases).

Regras:
- Responda somente com JSON válido.
- Formato exato: {"classification": "Produtivo|Improdutivo", "response": "..."}
- Se estiver em dúvida, classifique como "Produtivo".

Email:
"""


@dataclass
class GeminiResult:
    classification: str
    response: str
    model: str


def _extract_json(text: str) -> Optional[dict]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    candidate = text[start : end + 1].strip()
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return None


def _normalize_classification(value: str) -> Optional[str]:
    if not value:
        return None
    lowered = value.strip().lower()
    if "improdutivo" in lowered:
        return "Improdutivo"
    if "produtivo" in lowered:
        return "Produtivo"
    return None


def classify_with_gemini(text: str) -> Optional[GeminiResult]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=DEFAULT_MODEL,
        contents=f"{PROMPT_TEMPLATE}{text}\n",
    )
    raw_text = response.text or ""

    data = _extract_json(raw_text)
    if not data:
        return None

    classification = _normalize_classification(str(data.get("classification", "")))
    response_text = str(data.get("response", "")).strip()

    if not classification or not response_text:
        return None

    return GeminiResult(
        classification=classification,
        response=response_text,
        model=DEFAULT_MODEL,
    )
