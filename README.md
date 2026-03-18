# AutoMail

Aplicação web para classificar emails e sugerir respostas automáticas.

## Requisitos

- Python 3.11+

## Como rodar localmente

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Acesse: `http://127.0.0.1:8000`

## Como funciona (MVP)

- Upload de `.txt` e `.pdf` ou colagem de texto.
- Extração do conteúdo do email.
- Classificação inicial por palavras-chave (placeholder até a integração com Gemini).
- Resposta automática baseada na categoria.

## Roadmap curto

- Integração com Gemini para classificação e resposta.
- NLP para limpeza e normalização aprimorada.
- Deploy no Render.
