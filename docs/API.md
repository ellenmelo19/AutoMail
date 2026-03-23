# API

## Rotas HTML

- `GET /`  
  Retorna a interface web.

- `POST /process`  
  Processa formulário HTML (texto ou arquivo) e retorna a página com o resultado.

## Rotas JSON

- `POST /api/analyze`  
  Body JSON:
  ```json
  {
    "text": "conteúdo do email",
    "source": "assunto ou origem"
  }
  ```
  Response:
  ```json
  {
    "classification": "Produtivo|Improdutivo",
    "response": "texto sugerido",
    "word_count": 42,
    "engine": "gemini:MODEL|fallback-local",
    "source": "origem",
    "cleaned_text": "texto normalizado"
  }
  ```

- `POST /api/analyze-file`  
  Envie arquivo `.txt` ou `.pdf` como `multipart/form-data` com campo `file`.
  Response segue o mesmo padrão do `/api/analyze`, ou retorna `{"error": "..."}`.

## Healthcheck

- `GET /health`  
  Retorna `{"status": "ok"}`.
