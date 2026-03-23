# Evolução do projeto

## v0.4

- Inbox clicável com emails de exemplo (edite e analise).
- Botão para criar um email do zero.
- Histórico de análises com badge de classificação.
- Edição manual da classificação.
- API JSON `POST /api/analyze` para análise sem recarregar a página.
- X para excluir cada email no card.
- Loading ao analisar.
- Correção de overflow nos cards.

## v0.5

- LocalStorage para persistir inbox, histórico e seleção atual.
- Endpoint JSON `POST /api/analyze-file` para upload de arquivo.
- Front intercepta o envio e evita recarregar a página.
- Redesign do visual.
- Tema claro/escuro e ajustes visuais.

## v0.6

- NLP com stopwords e stemming.
- Dataset ampliado e script de treino com validação cruzada.
- Validação de arquivo no backend.
- README reestruturado e documentação técnica.
