const inboxList = document.getElementById("inbox-list");
const historyList = document.getElementById("history-list");
const historyPrev = document.getElementById("history-prev");
const historyNext = document.getElementById("history-next");
const historyPageLabel = document.getElementById("history-page");
const newEmailBtn = document.getElementById("new-email-btn");
const selectedTitle = document.getElementById("selected-title");
const form = document.getElementById("email-form");
const fromInput = document.getElementById("email-from");
const subjectInput = document.getElementById("email-subject");
const bodyInput = document.getElementById("email-body");
const fileInput = document.getElementById("email-file");
const analyzeBtn = document.getElementById("analyze-btn");
const analyzeBtnText = document.getElementById("analyze-btn-text");
const analyzeSpinner = document.getElementById("analyze-spinner");

const resultClassification = document.getElementById("result-classification");
const resultMeta = document.getElementById("result-meta");
const resultResponse = document.getElementById("result-response");
const resultPreview = document.getElementById("result-preview");

const sampleEmails = [
  {
    id: "e1",
    from: "cliente@empresa.com",
    subject: "Erro ao acessar o portal",
    body: "Olá, estou tentando acessar o portal do cliente, mas aparece um erro de autenticação. Poderiam verificar?",
  },
  {
    id: "e2",
    from: "financeiro@parceiro.com",
    subject: "Status de fatura em aberto",
    body: "Bom dia! Poderiam atualizar o status da fatura 2025-119? Está em aberto há alguns dias.",
  },
  {
    id: "e3",
    from: "relacionamento@cliente.com",
    subject: "Obrigado pelo atendimento",
    body: "Muito obrigado pelo suporte rápido na última semana. Vocês foram incríveis!",
  },
];

let inbox = [...sampleEmails];
let history = [];
let currentId = inbox[0]?.id || null;
let historyPage = 1;
const historyPageSize = 5;

const classificationStyles = {
  Produtivo: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  Improdutivo: "bg-amber-500/15 text-amber-200 border-amber-500/30",
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTime = (date) =>
  date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const getHistoryPageCount = () => Math.max(1, Math.ceil(history.length / historyPageSize));

const getCurrentEmail = () => inbox.find((item) => item.id === currentId);

const setLoading = (loading) => {
  analyzeBtn.disabled = loading;
  analyzeSpinner.classList.toggle("hidden", !loading);
  analyzeBtnText.textContent = loading ? "Analisando..." : "Analisar email";
};

const setResultLoading = () => {
  resultClassification.textContent = "Analisando...";
  resultMeta.textContent = "Lendo conteúdo e gerando resposta";
  resultResponse.textContent = "Aguarde alguns segundos.";
  resultPreview.textContent = "Prévia será exibida ao concluir a análise.";
};

const renderInbox = () => {
  inboxList.innerHTML = "";

  inbox.forEach((email) => {
    const safeFrom = escapeHtml(email.from || "");
    const safeSubject = escapeHtml(email.subject || "Sem assunto");
    const safeBody = escapeHtml(email.body || "");

    const card = document.createElement("div");
    card.className =
      "relative w-full cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-cyan-400/40";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    if (email.id === currentId) {
      card.classList.add("border-cyan-400/40", "bg-cyan-400/10");
    }

    const badge = email.classification
      ? `<span class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          classificationStyles[email.classification] || "bg-slate-800 text-slate-200 border-slate-700"
        }">${email.classification}</span>`
      : "";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2 pr-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 truncate">${safeFrom}</p>
        ${badge}
      </div>
      <p class="mt-2 text-sm font-semibold text-slate-100 clamp-2 break-words">${safeSubject}</p>
      <p class="mt-1 text-xs text-slate-400 clamp-2 break-words">${safeBody}</p>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className =
      "absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 text-xs text-slate-300 transition hover:border-rose-400/50 hover:text-rose-200";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteEmail(email.id);
    });

    card.appendChild(deleteBtn);

    card.addEventListener("click", () => selectEmail(email.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectEmail(email.id);
      }
    });

    inboxList.appendChild(card);
  });
};

const renderHistory = () => {
  historyList.innerHTML = "";

  const totalPages = getHistoryPageCount();
  if (historyPage > totalPages) {
    historyPage = totalPages;
  }

  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-sm text-slate-400";
    empty.textContent = "Nenhuma análise registrada ainda.";
    historyList.appendChild(empty);
  } else {
    const start = (historyPage - 1) * historyPageSize;
    const pageItems = history.slice(start, start + historyPageSize);

    pageItems.forEach((item) => {
      const safeSubject = escapeHtml(item.subject || "Sem assunto");
      const wrapper = document.createElement("div");
      wrapper.className = "rounded-2xl border border-slate-800 bg-slate-950/60 p-4";

      const badgeClass =
        classificationStyles[item.classification] || "bg-slate-800 text-slate-200 border-slate-700";

      wrapper.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-slate-500">${item.time}</p>
            <p class="mt-1 text-sm font-semibold text-slate-100 clamp-2 break-words">${safeSubject}</p>
            <p class="mt-1 text-xs text-slate-400">Motor: ${item.engine}</p>
          </div>
          <span class="rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}">${item.classification}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>Editar classificação:</span>
          <select class="history-select rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200" data-id="${item.id}">
            <option value="Produtivo" ${item.classification === "Produtivo" ? "selected" : ""}>Produtivo</option>
            <option value="Improdutivo" ${item.classification === "Improdutivo" ? "selected" : ""}>Improdutivo</option>
          </select>
        </div>
      `;

      historyList.appendChild(wrapper);
    });
  }

  historyPageLabel.textContent = `${historyPage}/${getHistoryPageCount()}`;
  historyPrev.disabled = historyPage <= 1;
  historyNext.disabled = historyPage >= getHistoryPageCount();
  historyPrev.classList.toggle("opacity-40", historyPrev.disabled);
  historyNext.classList.toggle("opacity-40", historyNext.disabled);

  historyList.querySelectorAll(".history-select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const target = event.target;
      const itemId = target.dataset.id;
      const newValue = target.value;
      const item = history.find((entry) => entry.id === itemId);
      if (!item) return;

      const confirmed = window.confirm(
        "Tem certeza que deseja alterar manualmente a classificação?"
      );
      if (!confirmed) {
        target.value = item.classification;
        return;
      }

      item.classification = newValue;
      const inboxItem = inbox.find((entry) => entry.id === item.emailId);
      if (inboxItem) {
        inboxItem.classification = newValue;
      }
      renderInbox();
      renderHistory();
    });
  });
};

const selectEmail = (id) => {
  currentId = id;
  const email = getCurrentEmail();
  if (!email) return;

  fromInput.value = email.from;
  subjectInput.value = email.subject;
  bodyInput.value = email.body;
  selectedTitle.textContent = email.subject || "Novo email";

  renderInbox();
};

const updateCurrentEmail = () => {
  const email = getCurrentEmail();
  if (!email) return;

  email.from = fromInput.value.trim();
  email.subject = subjectInput.value.trim();
  email.body = bodyInput.value.trim();

  selectedTitle.textContent = email.subject || "Novo email";
  renderInbox();
};

const addNewEmail = () => {
  const newEmail = {
    id: `new-${Date.now()}`,
    from: "",
    subject: "",
    body: "",
  };
  inbox = [newEmail, ...inbox];
  currentId = newEmail.id;
  selectEmail(newEmail.id);
};

const deleteEmail = (id) => {
  const confirmed = window.confirm("Deseja excluir este email?");
  if (!confirmed) return;

  inbox = inbox.filter((item) => item.id !== id);

  if (inbox.length === 0) {
    addNewEmail();
    return;
  }

  if (currentId === id) {
    currentId = inbox[0].id;
    selectEmail(currentId);
  } else {
    renderInbox();
  }
};

const updateResults = (data) => {
  resultClassification.textContent = data.classification;
  resultMeta.textContent = `Fonte: ${data.source} · ${data.word_count} palavras · Motor: ${data.engine}`;
  resultResponse.textContent = data.response;
  resultPreview.textContent = data.cleaned_text.slice(0, 420) + (data.cleaned_text.length > 420 ? "..." : "");
};

form.addEventListener("submit", async (event) => {
  setLoading(true);

  if (fileInput.files && fileInput.files.length > 0) {
    updateCurrentEmail();
    return;
  }

  event.preventDefault();
  updateCurrentEmail();

  const email = getCurrentEmail();
  if (!email || !email.body) {
    setLoading(false);
    window.alert("Digite o conteúdo do email antes de analisar.");
    return;
  }

  setResultLoading();

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: email.body,
        source: email.subject || "texto",
      }),
    });

    if (!response.ok) {
      window.alert("Falha ao analisar o email. Tente novamente.");
      return;
    }

    const data = await response.json();
    updateResults(data);

    const historyItem = {
      id: `hist-${Date.now()}`,
      emailId: email.id,
      subject: email.subject || "Sem assunto",
      classification: data.classification,
      engine: data.engine,
      time: formatTime(new Date()),
    };

    email.classification = data.classification;
    history = [historyItem, ...history];
    historyPage = 1;

    renderInbox();
    renderHistory();
  } catch (error) {
    window.alert("Erro inesperado ao chamar a API.");
  } finally {
    setLoading(false);
  }
});

fromInput.addEventListener("input", updateCurrentEmail);
subjectInput.addEventListener("input", updateCurrentEmail);
bodyInput.addEventListener("input", updateCurrentEmail);
newEmailBtn.addEventListener("click", addNewEmail);

historyPrev.addEventListener("click", () => {
  if (historyPage > 1) {
    historyPage -= 1;
    renderHistory();
  }
});

historyNext.addEventListener("click", () => {
  if (historyPage < getHistoryPageCount()) {
    historyPage += 1;
    renderHistory();
  }
});

renderInbox();
renderHistory();
selectEmail(currentId);
