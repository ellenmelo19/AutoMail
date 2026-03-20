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
- Classificação com Gemini (quando configurado).
- Fallback local por palavras‑chave se o Gemini não estiver disponível.
- Pré-processamento NLP com remoção de stopwords e stemming para apoiar a classificação local.
- Interface estilo inbox com histórico e edição manual da classificação.
- Inbox com criação e exclusão de emails, histórico paginado e loading de análise.
- Estado salvo em `localStorage` para manter inbox e histórico após recarregar.
- Alternância entre tema claro e escuro.
- Paginação responsiva na inbox e no histórico com timestamps completos.
- Paginação na inbox e datas completas nos cards.

## Configurar Gemini (passo a passo)

1) Crie uma chave no Google AI Studio.
2) Copie `.env.example` para `.env` e preencha a chave.

```bash
copy .env.example .env
```

No arquivo `.env`:

```
GEMINI_API_KEY=coloque_sua_chave_aqui
GEMINI_MODEL=gemini-3-flash-preview
```

3) Reinicie o servidor local (`uvicorn`) após configurar o `.env`.

> Importante: nunca comite sua chave. O `.env` já está no `.gitignore`.

## Pipeline de NLP (pré-processamento)

- Tokenização simples (acentos preservados).
- Remoção de stopwords em PT-BR.
- Stemming (Snowball PT) antes da classificação local.

Esse pipeline está em `app/services/nlp.py` e é usado pelo fallback local em `app/services/processing.py`.

## Treinamento rápido (baseline)

Para demonstrar um ajuste/treinamento simples, há um dataset pequeno em `data/samples.csv`
e um script que treina um classificador TF‑IDF + Regressão Logística.

```bash
python scripts/train_baseline.py
```

O script imprime acurácia e relatório de classificação no terminal.

## Deploy (Render)

- Adicione `GEMINI_API_KEY` e opcionalmente `GEMINI_MODEL` nas variáveis de ambiente do serviço.
- Configure o Start Command como:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Roadmap curto

- Refinar prompts e validação de saída do Gemini.
- NLP para limpeza e normalização aprimorada.
- Ajustes finais de UI e experiência.
