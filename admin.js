const ADMIN_TOKEN_KEY = "mac_admin_token";
const DASHBOARD_POLL_INTERVAL_MS = 30000;

const loginCard = document.querySelector("#admin-login-card");
const dashboard = document.querySelector("#admin-dashboard");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const usernameEl = document.querySelector("#admin-username");
const refreshButton = document.querySelector("#admin-refresh");
const logoutButton = document.querySelector("#admin-logout");
const filterSelect = document.querySelector("#admin-status-filter");
const requestsContainer = document.querySelector("#admin-requests");
const settingsForm = document.querySelector("#admin-settings-form");
const settingsStatus = document.querySelector("#admin-settings-status");
const notificationsContainer = document.querySelector("#admin-notifications");
const markSeenButton = document.querySelector("#admin-mark-seen");
const serviceCreateForm = document.querySelector("#admin-service-create-form");
const formationCreateForm = document.querySelector("#admin-formation-create-form");
const servicesList = document.querySelector("#admin-services-list");
const formationsList = document.querySelector("#admin-formations-list");
const catalogStatus = document.querySelector("#admin-catalog-status");
const smtpBadge = document.querySelector("#admin-smtp-badge");
const smtpDetails = document.querySelector("#admin-smtp-details");
const smtpTestForm = document.querySelector("#admin-smtp-test-form");
const smtpStatus = document.querySelector("#admin-smtp-status");

const countTotalEl = document.querySelector("#admin-count-total");
const countNouvelleEl = document.querySelector("#admin-count-nouvelle");
const countEnCoursEl = document.querySelector("#admin-count-en-cours");
const countNotifEl = document.querySelector("#admin-count-notif");

let requestsCache = [];
let settingsCache = null;
let pollTimer = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parsePoints(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((point) => point.trim())
    .filter(Boolean);
}

function pointsToTextarea(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function setLoginStatus(message, isError = false) {
  if (!loginStatus) {
    return;
  }

  loginStatus.textContent = message;
  loginStatus.className = isError ? "admin-status error" : "admin-status success";
}

function setSettingsStatus(message, isError = false) {
  if (!settingsStatus) {
    return;
  }

  settingsStatus.textContent = message;
  settingsStatus.className = isError ? "admin-status error" : "admin-status success";
}

function setCatalogStatus(message, isError = false) {
  if (!catalogStatus) {
    return;
  }

  catalogStatus.textContent = message;
  catalogStatus.className = isError ? "admin-status error" : "admin-status success";
}

function setSmtpStatus(message, isError = false) {
  if (!smtpStatus) {
    return;
  }

  smtpStatus.textContent = message;
  smtpStatus.className = isError ? "admin-status error" : "admin-status success";
}

function renderSmtpStatus(payload) {
  if (!smtpBadge || !smtpDetails) {
    return;
  }

  const active = Boolean(payload && payload.active);
  smtpBadge.textContent = active ? "SMTP actif" : "SMTP inactif";
  smtpBadge.className = active ? "admin-smtp-badge on" : "admin-smtp-badge off";

  const transport = payload && payload.host ? `${payload.host}:${payload.port || "-"}` : "Non configuré";
  const mode = payload && payload.secure ? "SSL/TLS" : "STARTTLS";
  const from = payload && payload.from ? payload.from : "-";
  const defaultRecipient = payload && payload.defaultRecipient ? payload.defaultRecipient : "-";
  const auth = payload && payload.authConfigured ? "auth configurée" : "auth non configurée";
  const reason = payload && payload.reason ? ` | ${payload.reason}` : "";

  smtpDetails.textContent = `Serveur: ${transport} | Mode: ${mode} | Expéditeur: ${from} | Destinataire: ${defaultRecipient} | ${auth}${reason}`;

  if (smtpTestForm) {
    const toField = smtpTestForm.elements.namedItem("to");

    if (toField instanceof HTMLInputElement && !toField.value.trim() && payload && payload.defaultRecipient) {
      toField.value = payload.defaultRecipient;
    }
  }
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function showDashboard(show) {
  if (!loginCard || !dashboard) {
    return;
  }

  if (show) {
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");
  } else {
    dashboard.classList.add("hidden");
    loginCard.classList.remove("hidden");
    stopPolling();
  }
}

function isAuthError(message) {
  const text = String(message || "").toLowerCase();
  return text.includes("auth") || text.includes("session");
}

function handleSessionExpired(message) {
  clearToken();
  showDashboard(false);
  setLoginStatus(message || "Session expirée, reconnectez-vous.", true);
}

async function apiRequest(url, options = {}, withAuth = false) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (withAuth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload && payload.error ? payload.error : "Erreur serveur";
    throw new Error(errorMessage);
  }

  return payload;
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "-";
  }

  try {
    return new Date(isoDate).toLocaleString("fr-FR");
  } catch {
    return isoDate;
  }
}

function statusLabel(value) {
  if (value === "nouvelle") {
    return "Nouvelle";
  }

  if (value === "en_cours") {
    return "En cours";
  }

  if (value === "traitee") {
    return "Traitée";
  }

  if (value === "archivee") {
    return "Archivée";
  }

  return value;
}

function renderRequests() {
  if (!requestsContainer) {
    return;
  }

  const filter = filterSelect ? filterSelect.value : "all";

  const filtered = requestsCache.filter((request) => {
    if (filter === "all") {
      return true;
    }

    return request.statut === filter;
  });

  if (!filtered.length) {
    requestsContainer.innerHTML = "<p class=\"note\">Aucune demande pour ce filtre.</p>";
    return;
  }

  requestsContainer.innerHTML = filtered
    .map((request) => {
      const demandeType = escapeHtml(request.typeDemande || "Demande d'information");
      const nom = escapeHtml(request.nom || "-");
      const organisation = escapeHtml(request.organisation || "-");
      const email = escapeHtml(request.email || "-");
      const telephone = escapeHtml(request.telephone || "-");
      const sujet = escapeHtml(request.sujet || "-");
      const message = escapeHtml(request.message || "-");
      const note = escapeHtml(request.adminNote || "");
      const statut = escapeHtml(request.statut || "nouvelle");
      const id = escapeHtml(request.id || "");
      const emailInfo = request.emailNotification && typeof request.emailNotification === "object" ? request.emailNotification : {};
      const emailBadge = emailInfo.sent ? "Envoyé" : "Non envoyé";
      const emailError = escapeHtml(emailInfo.error || "");
      const emailInfoLine = emailError
        ? `${escapeHtml(emailBadge)} (${emailError})`
        : `${escapeHtml(emailBadge)}`;

      return `
        <article class="admin-request-card" data-id="${id}">
          <div class="admin-request-head">
            <h3>${demandeType}</h3>
            <span class="admin-badge badge-${statut}">${statusLabel(statut)}</span>
          </div>
          <p class="admin-request-meta">Reçue le ${formatDate(request.createdAt)}</p>
          <div class="admin-request-details">
            <p><strong>Nom:</strong> ${nom}</p>
            <p><strong>Organisation:</strong> ${organisation}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Téléphone:</strong> ${telephone}</p>
            <p><strong>Sujet:</strong> ${sujet}</p>
          </div>
          <p><strong>Message:</strong> ${message}</p>
          <p class="admin-email-line"><strong>Notification email admin:</strong> ${emailInfoLine}</p>

          <form class="admin-request-form">
            <label>
              Statut
              <select name="statut">
                <option value="nouvelle" ${statut === "nouvelle" ? "selected" : ""}>Nouvelle</option>
                <option value="en_cours" ${statut === "en_cours" ? "selected" : ""}>En cours</option>
                <option value="traitee" ${statut === "traitee" ? "selected" : ""}>Traitée</option>
                <option value="archivee" ${statut === "archivee" ? "selected" : ""}>Archivée</option>
              </select>
            </label>
            <label>
              Note interne
              <textarea name="adminNote">${note}</textarea>
            </label>
            <button type="submit" class="btn btn-outline">Mettre à jour</button>
            <p class="admin-inline-status" aria-live="polite"></p>
          </form>
        </article>
      `;
    })
    .join("");
}

function renderNotifications(payload) {
  const stats = payload && payload.stats && typeof payload.stats === "object" ? payload.stats : {};
  const notifications = payload && Array.isArray(payload.notifications) ? payload.notifications : [];

  if (countTotalEl) {
    countTotalEl.textContent = String(stats.total || 0);
  }

  if (countNouvelleEl) {
    countNouvelleEl.textContent = String(stats.nouvelle || 0);
  }

  if (countEnCoursEl) {
    countEnCoursEl.textContent = String(stats.en_cours || 0);
  }

  if (countNotifEl) {
    countNotifEl.textContent = String(stats.notificationsNonLues || 0);
  }

  if (!notificationsContainer) {
    return;
  }

  if (!notifications.length) {
    notificationsContainer.innerHTML = "<p class=\"note\">Aucune notification pour le moment.</p>";
    return;
  }

  notificationsContainer.innerHTML = notifications
    .map((item) => {
      const isNew = !item.notificationSeen;
      const className = isNew ? "admin-notification-item is-new" : "admin-notification-item";

      return `
        <article class="${className}">
          <div>
            <h3>${escapeHtml(item.typeDemande || "Demande")}</h3>
            <p><strong>${escapeHtml(item.nom || "-")}</strong> - ${escapeHtml(item.sujet || "-")}</p>
            <p class="admin-request-meta">${formatDate(item.createdAt)}</p>
          </div>
          <span class="admin-badge badge-${escapeHtml(item.statut || "nouvelle")}">${statusLabel(item.statut || "nouvelle")}</span>
        </article>
      `;
    })
    .join("");
}

function renderCatalogList(kind, items) {
  const container = kind === "service" ? servicesList : formationsList;

  if (!container) {
    return;
  }

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = '<p class="note">Aucun élément pour le moment.</p>';
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const id = escapeHtml(item.id || "");
      const title = escapeHtml(item.title || "");
      const summary = escapeHtml(item.summary || "");
      const points = escapeHtml(pointsToTextarea(item.points));
      const titlePlaceholder = kind === "service" ? "Nom du service" : "Nom de la formation";
      const summaryPlaceholder = kind === "service" ? "Description du service" : "Description de la formation";

      return `
        <article class="admin-catalog-item">
          <form class="admin-catalog-item-form" data-kind="${kind}" data-id="${id}">
            <div class="admin-catalog-fields">
              <label class="admin-field">
                Titre
                <input type="text" name="title" value="${title}" placeholder="${titlePlaceholder}" required />
              </label>
              <label class="admin-field admin-field-wide">
                Description
                <textarea name="summary" placeholder="${summaryPlaceholder}" required>${summary}</textarea>
              </label>
              <label class="admin-field admin-field-wide">
                Points clés (une ligne = un point)
                <textarea name="points" placeholder="Point 1&#10;Point 2&#10;Point 3">${points}</textarea>
              </label>
            </div>
            <div class="admin-catalog-actions">
              <button type="submit" class="btn btn-outline">Mettre à jour</button>
              <button type="button" class="btn admin-delete-item" data-kind="${kind}" data-id="${id}">Supprimer</button>
            </div>
            <p class="admin-inline-status" aria-live="polite"></p>
          </form>
        </article>
      `;
    })
    .join("");
}

function applySettingsToForm(settings) {
  if (!settingsForm) {
    return;
  }

  settingsForm.schoolName.value = settings.schoolName || "";
  settingsForm.tagline.value = settings.tagline || "";
  settingsForm.email.value = settings.contact?.email || "";
  settingsForm.telephone.value = settings.contact?.telephone || "";
  settingsForm.zone.value = settings.contact?.zone || "";
  settingsForm.horaires.value = settings.contact?.horaires || "";
  settingsForm.adresse.value = settings.contact?.adresse || "";
}

async function loadRequests() {
  const payload = await apiRequest("/api/admin/requests", {}, true);
  requestsCache = Array.isArray(payload.requests) ? payload.requests : [];
  renderRequests();
}

async function loadSettings() {
  const settings = await apiRequest("/api/admin/settings", {}, true);
  settingsCache = settings;

  applySettingsToForm(settings);
  renderCatalogList("service", Array.isArray(settings.services) ? settings.services : []);
  renderCatalogList("formation", Array.isArray(settings.formations) ? settings.formations : []);
}

async function loadNotifications() {
  const payload = await apiRequest("/api/admin/notifications", {}, true);
  renderNotifications(payload);
}

async function loadSmtpStatus() {
  const payload = await apiRequest("/api/admin/smtp/status", {}, true);
  renderSmtpStatus(payload);
}

async function loadDashboard() {
  await Promise.all([loadRequests(), loadSettings(), loadNotifications(), loadSmtpStatus()]);
}

function startPolling() {
  stopPolling();

  pollTimer = window.setInterval(async () => {
    try {
      await Promise.all([loadNotifications(), loadRequests()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Session expirée";

      if (isAuthError(message)) {
        handleSessionExpired("Session expirée, reconnectez-vous.");
      }
    }
  }, DASHBOARD_POLL_INTERVAL_MS);
}

function getCollectionKey(kind) {
  return kind === "service" ? "services" : "formations";
}

function getEndpoint(kind) {
  return kind === "service" ? "/api/admin/services" : "/api/admin/formations";
}

async function checkSession() {
  const token = getToken();

  if (!token) {
    showDashboard(false);
    return;
  }

  try {
    const me = await apiRequest("/api/admin/me", {}, true);

    if (usernameEl) {
      usernameEl.textContent = me.username || "admin";
    }

    showDashboard(true);
    await loadDashboard();
    startPolling();
  } catch {
    clearToken();
    showDashboard(false);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setLoginStatus("");

    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    try {
      const payload = await apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setToken(payload.token || "");

      if (usernameEl) {
        usernameEl.textContent = payload.username || username;
      }

      setLoginStatus("Connexion réussie.");
      loginForm.reset();
      showDashboard(true);
      await loadDashboard();
      startPolling();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connexion impossible.";
      setLoginStatus(message, true);
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      await apiRequest("/api/admin/logout", { method: "POST" }, true);
    } catch {
      // Ignore logout API errors and clear session locally.
    }

    clearToken();
    requestsCache = [];
    settingsCache = null;
    renderRequests();
    renderCatalogList("service", []);
    renderCatalogList("formation", []);
    renderNotifications({ stats: {}, notifications: [] });
    showDashboard(false);
    setSettingsStatus("");
    setCatalogStatus("");
    setSmtpStatus("");

    if (smtpBadge) {
      smtpBadge.textContent = "SMTP inactif";
      smtpBadge.className = "admin-smtp-badge off";
    }

    if (smtpDetails) {
      smtpDetails.textContent = "Connectez-vous pour vérifier l'état SMTP.";
    }

    setLoginStatus("Session fermée.");
  });
}

if (refreshButton) {
  refreshButton.addEventListener("click", async () => {
    try {
      await loadDashboard();
      setSettingsStatus("Données actualisées.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Actualisation impossible.";

      if (isAuthError(message)) {
        handleSessionExpired("Session expirée, reconnectez-vous.");
        return;
      }

      setSettingsStatus(message, true);
    }
  });
}

if (smtpTestForm) {
  smtpTestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSmtpStatus("");

    const formData = new FormData(smtpTestForm);
    const to = String(formData.get("to") || "").trim();

    try {
      const payload = await apiRequest(
        "/api/admin/smtp/test",
        {
          method: "POST",
          body: JSON.stringify({ to }),
        },
        true
      );

      setSmtpStatus(`Email de test envoyé à ${payload.to}.`);
      await loadSmtpStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Envoi du test SMTP impossible.";

      if (isAuthError(message)) {
        handleSessionExpired("Session expirée, reconnectez-vous.");
        return;
      }

      setSmtpStatus(message, true);
    }
  });
}

if (filterSelect) {
  filterSelect.addEventListener("change", renderRequests);
}

if (markSeenButton) {
  markSeenButton.addEventListener("click", async () => {
    try {
      await apiRequest("/api/admin/notifications/seen", { method: "POST" }, true);
      await Promise.all([loadNotifications(), loadRequests()]);
      setSettingsStatus("Notifications marquées comme lues.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action impossible.";
      setSettingsStatus(message, true);
    }
  });
}

if (requestsContainer) {
  requestsContainer.addEventListener("submit", async (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement) || !form.classList.contains("admin-request-form")) {
      return;
    }

    event.preventDefault();

    const card = form.closest(".admin-request-card");
    const inlineStatus = form.querySelector(".admin-inline-status");

    if (!card) {
      return;
    }

    const requestId = card.getAttribute("data-id") || "";
    const formData = new FormData(form);
    const statut = String(formData.get("statut") || "");
    const adminNote = String(formData.get("adminNote") || "").trim();

    if (inlineStatus) {
      inlineStatus.textContent = "Mise à jour...";
      inlineStatus.className = "admin-inline-status";
    }

    try {
      const payload = await apiRequest(
        `/api/admin/requests/${requestId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ statut, adminNote }),
        },
        true
      );

      requestsCache = requestsCache.map((item) => {
        if (item.id === requestId) {
          return payload.request;
        }

        return item;
      });

      renderRequests();
      await loadNotifications();
    } catch (error) {
      if (inlineStatus) {
        const message = error instanceof Error ? error.message : "Erreur de mise à jour.";
        inlineStatus.textContent = message;
        inlineStatus.className = "admin-inline-status error";
      }
    }
  });
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setSettingsStatus("");

    const formData = new FormData(settingsForm);
    const body = {
      schoolName: String(formData.get("schoolName") || "").trim(),
      tagline: String(formData.get("tagline") || "").trim(),
      contact: {
        email: String(formData.get("email") || "").trim(),
        telephone: String(formData.get("telephone") || "").trim(),
        zone: String(formData.get("zone") || "").trim(),
        horaires: String(formData.get("horaires") || "").trim(),
        adresse: String(formData.get("adresse") || "").trim(),
      },
    };

    try {
      const payload = await apiRequest(
        "/api/admin/settings",
        {
          method: "PUT",
          body: JSON.stringify(body),
        },
        true
      );

      settingsCache = payload.settings || settingsCache;
      setSettingsStatus("Coordonnées enregistrées avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enregistrement impossible.";
      setSettingsStatus(message, true);
    }
  });
}

async function createCatalogItem(kind, form) {
  const data = new FormData(form);
  const body = {
    title: String(data.get("title") || "").trim(),
    summary: String(data.get("summary") || "").trim(),
    points: parsePoints(data.get("points")),
  };

  const endpoint = getEndpoint(kind);
  const payload = await apiRequest(
    endpoint,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );

  const key = getCollectionKey(kind);

  if (!settingsCache) {
    settingsCache = {};
  }

  settingsCache[key] = Array.isArray(payload[key]) ? payload[key] : [];
  renderCatalogList(kind, settingsCache[key]);
}

if (serviceCreateForm) {
  serviceCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setCatalogStatus("");

    try {
      await createCatalogItem("service", serviceCreateForm);
      serviceCreateForm.reset();
      setCatalogStatus("Service ajouté avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ajout du service impossible.";
      setCatalogStatus(message, true);
    }
  });
}

if (formationCreateForm) {
  formationCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setCatalogStatus("");

    try {
      await createCatalogItem("formation", formationCreateForm);
      formationCreateForm.reset();
      setCatalogStatus("Formation ajoutée avec succès.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ajout de la formation impossible.";
      setCatalogStatus(message, true);
    }
  });
}

function bindCatalogListEvents(container, kind) {
  if (!container) {
    return;
  }

  container.addEventListener("submit", async (event) => {
    const form = event.target;

    if (!(form instanceof HTMLFormElement) || !form.classList.contains("admin-catalog-item-form")) {
      return;
    }

    event.preventDefault();
    setCatalogStatus("");

    const itemId = form.getAttribute("data-id") || "";
    const inline = form.querySelector(".admin-inline-status");
    const data = new FormData(form);
    const body = {
      title: String(data.get("title") || "").trim(),
      summary: String(data.get("summary") || "").trim(),
      points: parsePoints(data.get("points")),
    };

    if (inline) {
      inline.textContent = "Mise à jour...";
      inline.className = "admin-inline-status";
    }

    try {
      const payload = await apiRequest(
        `${getEndpoint(kind)}/${encodeURIComponent(itemId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
        true
      );

      const key = getCollectionKey(kind);

      if (!settingsCache) {
        settingsCache = {};
      }

      settingsCache[key] = Array.isArray(payload[key]) ? payload[key] : settingsCache[key] || [];
      renderCatalogList(kind, settingsCache[key]);
      setCatalogStatus(`${kind === "service" ? "Service" : "Formation"} mis à jour.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mise à jour impossible.";

      if (inline) {
        inline.textContent = message;
        inline.className = "admin-inline-status error";
      }

      setCatalogStatus(message, true);
    }
  });

  container.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const deleteButton = target.closest(".admin-delete-item");

    if (!(deleteButton instanceof HTMLButtonElement)) {
      return;
    }

    const itemId = deleteButton.getAttribute("data-id") || "";

    if (!itemId) {
      return;
    }

    const confirmMessage = kind === "service" ? "Supprimer ce service ?" : "Supprimer cette formation ?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setCatalogStatus("");

    try {
      const payload = await apiRequest(`${getEndpoint(kind)}/${encodeURIComponent(itemId)}`, { method: "DELETE" }, true);
      const key = getCollectionKey(kind);

      if (!settingsCache) {
        settingsCache = {};
      }

      settingsCache[key] = Array.isArray(payload[key]) ? payload[key] : [];
      renderCatalogList(kind, settingsCache[key]);
      setCatalogStatus(`${kind === "service" ? "Service" : "Formation"} supprimé.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Suppression impossible.";
      setCatalogStatus(message, true);
    }
  });
}

bindCatalogListEvents(servicesList, "service");
bindCatalogListEvents(formationsList, "formation");

checkSession();
