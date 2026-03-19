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
const fileMeta = document.getElementById("file-meta");
const fileName = document.getElementById("file-name");
const fileClear = document.getElementById("file-clear");
const analyzeBtn = document.getElementById("analyze-btn");
const analyzeBtnText = document.getElementById("analyze-btn-text");
const analyzeSpinner = document.getElementById("analyze-spinner");
const toastContainer = document.getElementById("toast-container");
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.getElementById("theme-label");
const confirmModal = document.getElementById("confirm-modal");
const confirmTitle = document.getElementById("confirm-title");
const confirmMessage = document.getElementById("confirm-message");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmAccept = document.getElementById("confirm-accept");

const resultClassification = document.getElementById("result-classification");
const resultMeta = document.getElementById("result-meta");
const resultResponse = document.getElementById("result-response");
const resultPreview = document.getElementById("result-preview");

const STORAGE_KEY = "automail_state_v1";
const THEME_KEY = "automail_theme";

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

let inbox = [];
let history = [];
let currentId = null;
let historyPage = 1;
const historyPageSize = 5;

const classificationStyles = {
  Produtivo: "badge-productive",
  Improdutivo: "badge-improductive",
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (date) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);

const getHistoryPageCount = () => Math.max(1, Math.ceil(history.length / historyPageSize));

const getCurrentEmail = () => inbox.find((item) => item.id === currentId);

const persistState = () => {
  const payload = {
    inbox,
    history,
    currentId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      inbox = [...sampleEmails];
      currentId = inbox[0]?.id || null;
      return;
    }
    const data = JSON.parse(raw);
    inbox = Array.isArray(data.inbox) ? data.inbox : [...sampleEmails];
    history = Array.isArray(data.history) ? data.history : [];
    currentId = data.currentId || inbox[0]?.id || null;
  } catch (error) {
    inbox = [...sampleEmails];
    currentId = inbox[0]?.id || null;
  }
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeLabel) {
    themeLabel.textContent = theme === "dark" ? "Escuro" : "Claro";
  }
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_KEY, theme);
};

const initTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    setTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
};

const toggleTheme = () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
};

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

const showToast = (message, type = "error") => {
  if (!message) return;

  const toast = document.createElement("div");
  const baseClass = "toast rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur";
  const typeClass = type === "success" ? "toast-success" : "toast-error";

  toast.className = `${baseClass} ${typeClass}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hide");
  }, 3600);

  setTimeout(() => {
    toast.remove();
  }, 4000);
};

const openConfirm = ({
  title = "Confirmar ação",
  message = "Tem certeza que deseja continuar?",
  onConfirm,
}) => {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmModal.classList.remove("hidden");
  confirmModal.classList.add("flex");
  confirmModal.dataset.open = "true";
  confirmModal.dataset.confirm = "";

  const handleConfirm = () => {
    if (confirmModal.dataset.confirm === "true") {
      return;
    }
    confirmModal.dataset.confirm = "true";
    closeConfirm();
    if (typeof onConfirm === "function") {
      onConfirm();
    }
  };

  const handleCancel = () => {
    closeConfirm();
  };

  confirmAccept.onclick = handleConfirm;
  confirmCancel.onclick = handleCancel;

  const handleBackdrop = (event) => {
    if (event.target === confirmModal) {
      handleCancel();
    }
  };

  confirmModal.addEventListener("click", handleBackdrop, { once: true });
};

const closeConfirm = () => {
  confirmModal.classList.add("hidden");
  confirmModal.classList.remove("flex");
  confirmModal.dataset.open = "false";
};

const renderInbox = () => {
  inboxList.innerHTML = "";

  inbox.forEach((email) => {
    const safeFrom = escapeHtml(email.from || "");
    const safeSubject = escapeHtml(email.subject || "Sem assunto");
    const safeBody = escapeHtml(email.body || "");

    const card = document.createElement("div");
    card.className =
      "relative w-full cursor-pointer rounded-2xl border border-app bg-surface p-4 text-left transition hover:border-accent hover:bg-accent-soft";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    if (email.id === currentId) {
      card.classList.add("border-accent", "bg-accent-soft");
    }

    const badge = email.classification
      ? `<button type="button" class="rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
          classificationStyles[email.classification] || "bg-surface-strong text-muted border-app"
        }">${email.classification}</button>`
      : "";

    card.innerHTML = `
      <div class="flex items-start justify-between gap-2 pr-6">
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted truncate">${safeFrom}</p>
        ${badge}
      </div>
      <p class="mt-2 text-sm font-semibold clamp-2 break-words">${safeSubject}</p>
      <p class="mt-1 text-xs text-muted clamp-2 break-words">${safeBody}</p>
    `;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className =
      "absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-app text-xs text-muted transition hover:border-rose-300 hover:text-rose-500";
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openConfirm({
        title: "Excluir email",
        message: "Deseja remover este email da caixa de entrada?",
        onConfirm: () => deleteEmail(email.id),
      });
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
    empty.className = "text-sm text-muted";
    empty.textContent = "Nenhuma análise registrada ainda.";
    historyList.appendChild(empty);
  } else {
    const start = (historyPage - 1) * historyPageSize;
    const pageItems = history.slice(start, start + historyPageSize);

    pageItems.forEach((item) => {
      const safeSubject = escapeHtml(item.subject || "Sem assunto");
      const wrapper = document.createElement("div");
      wrapper.className = "rounded-2xl border border-app bg-surface-strong p-4";

      const badgeClass =
        classificationStyles[item.classification] || "bg-surface-strong text-muted border-app";

      wrapper.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-[0.2em] text-muted">${item.time}</p>
            <p class="mt-1 text-sm font-semibold clamp-2 break-words">${safeSubject}</p>
            <p class="mt-1 text-xs text-muted">Motor: ${item.engine}</p>
          </div>
          <button
            type="button"
            class="history-badge rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}"
            data-id="${item.id}"
          >
            ${item.classification}
          </button>
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

  historyList.querySelectorAll(".history-badge").forEach((badge) => {
    badge.addEventListener("click", (event) => {
      event.stopPropagation();
      const itemId = badge.dataset.id;
      const item = history.find((entry) => entry.id === itemId);
      if (!item) return;

      const nextValue = item.classification === "Produtivo" ? "Improdutivo" : "Produtivo";
      openConfirm({
        title: "Alterar classificação",
        message: `Confirmar alteração para "${nextValue}"?`,
        onConfirm: () => {
          item.classification = nextValue;
          const inboxItem = inbox.find((entry) => entry.id === item.emailId);
          if (inboxItem) {
            inboxItem.classification = nextValue;
          }
          persistState();
          renderInbox();
          renderHistory();
        },
      });
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
  resetFileInput();

  persistState();
  renderInbox();
};

const updateCurrentEmail = () => {
  const email = getCurrentEmail();
  if (!email) return;

  email.from = fromInput.value.trim();
  email.subject = subjectInput.value.trim();
  email.body = bodyInput.value.trim();

  selectedTitle.textContent = email.subject || "Novo email";
  persistState();
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
  persistState();
  selectEmail(newEmail.id);
};

const deleteEmail = (id) => {
  inbox = inbox.filter((item) => item.id !== id);

  if (inbox.length === 0) {
    addNewEmail();
    return;
  }

  if (currentId === id) {
    currentId = inbox[0].id;
    persistState();
    selectEmail(currentId);
  } else {
    persistState();
    renderInbox();
  }
};

const updateResults = (data) => {
  resultClassification.textContent = data.classification;
  resultMeta.textContent = `Fonte: ${data.source} · ${data.word_count} palavras · Motor: ${data.engine}`;
  resultResponse.textContent = data.response;
  resultPreview.textContent = data.cleaned_text.slice(0, 420) + (data.cleaned_text.length > 420 ? "..." : "");
};

const analyzeText = async (email) => {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: email.body,
      source: email.subject || "texto",
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao analisar o email.");
  }

  return response.json();
};

const analyzeFile = async (file, email) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze-file", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Falha ao analisar o arquivo.");
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  email.subject = email.subject || file.name;
  email.body = data.cleaned_text;
  bodyInput.value = data.cleaned_text;
  return data;
};

const resetFileInput = () => {
  fileInput.value = "";
  fileMeta.classList.add("hidden");
};

const updateFileMeta = () => {
  if (fileInput.files && fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
    fileMeta.classList.remove("hidden");
  } else {
    fileMeta.classList.add("hidden");
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(true);
  updateCurrentEmail();

  const email = getCurrentEmail();
  if (!email) {
    setLoading(false);
    return;
  }

  const hasFile = fileInput.files && fileInput.files.length > 0;
  if (!hasFile && !email.body) {
    setLoading(false);
    showToast("Digite o conteúdo do email antes de analisar.");
    return;
  }

  setResultLoading();

  try {
    const data = hasFile
      ? await analyzeFile(fileInput.files[0], email)
      : await analyzeText(email);

    updateResults(data);

    const historyItem = {
      id: `hist-${Date.now()}`,
      emailId: email.id,
      subject: email.subject || "Sem assunto",
      classification: data.classification,
      engine: data.engine,
      time: formatDateTime(new Date()),
    };

    email.classification = data.classification;
    history = [historyItem, ...history].slice(0, 30);
    historyPage = 1;

    persistState();
    renderInbox();
    renderHistory();
    showToast("Análise concluída.", "success");
  } catch (error) {
    showToast(error.message || "Erro inesperado ao chamar a API.");
  } finally {
    setLoading(false);
  }
});

fromInput.addEventListener("input", updateCurrentEmail);
subjectInput.addEventListener("input", updateCurrentEmail);
bodyInput.addEventListener("input", updateCurrentEmail);
newEmailBtn.addEventListener("click", addNewEmail);

fileInput.addEventListener("change", updateFileMeta);
fileClear.addEventListener("click", () => {
  resetFileInput();
});

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

if (themeToggle) {
  themeToggle.addEventListener("click", toggleTheme);
}

loadState();
initTheme();
renderInbox();
renderHistory();
if (currentId) {
  selectEmail(currentId);
}

const serverError = document.body.dataset.error;
if (serverError) {
  showToast(serverError);
}
