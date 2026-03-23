# AutoMail

Aplicação web para classificar emails e sugerir respostas automáticas.

## Links rápidos

- Deploy: https://automail-81sl.onrender.com/
- Vídeo: 

## Documentação detalhada

- Arquitetura: `docs/ARCHITECTURE.md`
- API: `docs/API.md`
- Mapa de arquivos: `docs/FILES.md`
- Evolução do projeto: `docs/CHANGELOG.md`
- Template Notion: `docs/NOTION_TEMPLATE.md`

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
- Classificação com Gemini (quando configurado) e fallback local.
- Pré-processamento NLP com remoção de stopwords e stemming para apoiar a classificação local.
- Interface estilo inbox com histórico e edição manual da classificação.
- Inbox com criação e exclusão de emails, histórico paginado e loading de análise.
- Estado salvo em `localStorage` para manter inbox e histórico após recarregar.
- Alternância entre tema claro e escuro.
- Paginação responsiva na inbox e no histórico com timestamps completos.
- Paginação na inbox e datas completas nos cards.

## Fluxo de IA (classificação e resposta)

1) Recebe texto ou arquivo.
2) Extrai e normaliza o conteúdo.
3) Aplica pré-processamento NLP (stopwords + stemming).
4) Se há chave do Gemini, usa o modelo para classificar e gerar resposta.
5) Se não há chave, aplica heurística local por palavras‑chave.
6) Retorna categoria e resposta sugerida para a interface.

## Teste rápido (UI)

- Na tela principal, use o botão **Preencher exemplo** para carregar um email pronto.
- Clique em **Analisar email** e veja a classificação e a resposta sugerida.

## Exemplos rápidos (entrada e saída esperada)

- **Exemplo Produtivo:** Entrada "Olá, preciso de atualização do meu chamado e previsão de prazo."  
Saída esperada: classificação `Produtivo` + resposta de acompanhamento.
- **Exemplo Improdutivo:** Entrada "Boa tarde! Só passando para agradecer o suporte."  
Saída esperada: classificação `Improdutivo` + resposta cordial.

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

## Sem chave do Gemini

- A aplicação continua funcionando via fallback local.
- O resultado ainda entrega classificação e resposta sugerida, mas sem IA generativa.

## OCR para PDFs escaneados

Se o PDF for imagem (ex.: “Print to PDF”), a extração de texto precisa de OCR.
A aplicação tenta OCR automaticamente, mas requer o Tesseract instalado no sistema.

Configuração sugerida:

- Windows: instale o Tesseract e, se necessário, defina `TESSERACT_CMD` no `.env` com o caminho do executável.
- Windows: defina também `TESSDATA_PREFIX` apontando para a pasta `tessdata` (ex.: `C:\Program Files\Tesseract-OCR\tessdata`).
- Linux/macOS: instale o pacote `tesseract-ocr` via gerenciador de pacotes.
- Opcional: definir `OCR_LANG=por` (padrão) para português.
- Opcional: definir `OCR_CONFIG=--psm 6` para melhorar leitura de blocos de texto.

## Pipeline de NLP (pré-processamento)

- Tokenização simples (acentos preservados).
- Remoção de stopwords em PT-BR.
- Stemming (Snowball PT) antes da classificação local.

Esse pipeline está em `app/services/nlp.py` e é usado pelo fallback local em `app/services/processing.py`.

## Treinamento rápido (baseline)

Para demonstrar um ajuste/treinamento simples, há um dataset em `data/samples.csv`
e um script que treina um classificador TF‑IDF + Regressão Logística.

```bash
python scripts/train_baseline.py
```

O script imprime acurácia média em validação cruzada (5‑fold), relatório de classificação
e matriz de confusão. Como o dataset é pequeno, as métricas variam bastante; a ideia
é demonstrar o pipeline de treino e deixar claro o impacto do volume de dados.

Exemplo de execução (dataset atual):

```text
Acurácia (5-fold): 0.93 ± 0.03
              precision    recall  f1-score   support

 Improdutivo       1.00      0.87      0.93        30
   Produtivo       0.88      1.00      0.94        30

    accuracy                           0.93        60
   macro avg       0.94      0.93      0.93        60
weighted avg       0.94      0.93      0.93        60

Matriz de confusão:
[[26  4]
 [ 0 30]]
```

## Limitações conhecidas

- PDFs escaneados (imagem) não têm OCR embutido e podem não extrair texto.
- O dataset de treino é pequeno e serve apenas para demonstrar o pipeline.

## Deploy (Render)

- Adicione `GEMINI_API_KEY` e opcionalmente `GEMINI_MODEL` nas variáveis de ambiente do serviço.
- Configure o Start Command como:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Roadmap curto

- Refinar prompts e validação de saída do Gemini.
- OCR para PDF escaneado.
- Exportação do histórico em CSV.
