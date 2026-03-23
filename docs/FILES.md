# Mapa de arquivos

- `app/main.py`  
  Entrypoint da API FastAPI, rotas HTML/JSON e validação básica de upload.

- `app/services/processing.py`  
  Orquestra o processamento do texto, fallback local e chamada ao Gemini.

- `app/services/nlp.py`  
  Stopwords PT-BR, tokenização e stemming.

- `app/services/gemini_client.py`  
  Integração com o Gemini e parsing de resposta JSON.

- `app/templates/index.html`  
  Interface principal (inbox, upload, histórico, resultados).

- `app/static/app.js`  
  Interações da UI, chamadas à API, histórico local, temas e efeitos.

- `data/samples.csv`  
  Dataset de exemplo para o treino baseline.

- `scripts/train_baseline.py`  
  Treino TF‑IDF + Regressão Logística com validação cruzada.

- `requirements.txt`  
  Dependências do projeto.

- `.env.example`  
  Exemplo de variáveis de ambiente.
