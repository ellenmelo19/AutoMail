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

## Roadmap curto

- Integração com Gemini para classificação e resposta.
- Upload de `.txt` e `.pdf`.
- Deploy no Render.
