# Arquitetura

## Visão geral

O AutoMail é uma aplicação FastAPI com UI renderizada por Jinja2 e uma camada de serviços
para processamento de texto, NLP e integração com o Gemini.

Fluxo principal:
1. Usuário envia texto ou arquivo pela interface.
2. Backend extrai o conteúdo.
3. NLP pré-processa (stopwords + stemming) para o fallback local.
4. Se existir `GEMINI_API_KEY`, o Gemini classifica e sugere resposta.
5. Sem chave, o fallback local aplica heurísticas por palavras-chave.
6. Resultado volta para a UI e para o histórico no front.

## Componentes

- **Frontend:** `app/templates/index.html` + `app/static/app.js`
- **Backend:** `app/main.py`
- **NLP & regras locais:** `app/services/nlp.py` e `app/services/processing.py`
- **Integração Gemini:** `app/services/gemini_client.py`
- **Dataset e treino:** `data/samples.csv` + `scripts/train_baseline.py`
