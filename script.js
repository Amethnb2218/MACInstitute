const topbar = document.querySelector(".topbar");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".main-nav a");

function normalizePathname(pathname) {
  const clean = pathname.split("?")[0].split("#")[0];
  const page = clean.substring(clean.lastIndexOf("/") + 1);
  return page || "index.html";
}

const currentPage = normalizePathname(window.location.pathname);

const DEFAULT_PUBLIC_SETTINGS = {
  schoolName: "MAC Africa Institute",
  tagline: "Un Institut de Référence en Afrique",
  contact: {
    email: "contact@macafrica-institute.com",
    telephone: "+000 000 000 000",
    zone: "Afrique",
    horaires: "Du lundi au vendredi, 8h30 à 17h30",
    adresse: "Adresse à compléter",
  },
  services: [
    {
      id: "conseil-strategique",
      title: "Conseil stratégique et pilotage",
      summary: "Accompagner les directions dans les décisions structurantes, l'alignement des priorités et la conduite des transformations.",
      points: [
        "Diagnostic de maturité stratégique",
        "Clarification de la vision et des objectifs",
        "Feuille de route priorisée et séquencée",
      ],
    },
    {
      id: "expertise-management",
      title: "Management et performance opérationnelle",
      summary: "Structurer l'organisation, fluidifier les responsabilités et renforcer les routines de pilotage des équipes.",
      points: [
        "Revue des processus clés",
        "Structuration des rôles et responsabilités",
        "Tableaux de bord de performance",
      ],
    },
    {
      id: "audit-controle",
      title: "Audit, contrôle interne et risques",
      summary: "Sécuriser les processus critiques, renforcer la conformité et installer des mécanismes de contrôle adaptés au terrain.",
      points: [
        "Cartographie des risques",
        "Dispositifs de contrôle interne",
        "Plans d'amélioration et de sécurisation",
      ],
    },
  ],
  formations: [
    {
      id: "gestion-de-projet",
      title: "Gestion de Projet",
      summary: "Planification, exécution et pilotage des projets avec des outils opérationnels.",
      points: ["Cadrage et gouvernance projet", "Gestion des délais, coûts et ressources", "Suivi des risques projet"],
    },
    {
      id: "audit-interne-controle-interne",
      title: "Audit interne et contrôle interne",
      summary: "Renforcement des dispositifs de contrôle et fiabilisation des processus.",
      points: ["Techniques d'audit interne", "Conception de plans de contrôle", "Traitement des non-conformités"],
    },
    {
      id: "cartographie-des-risques",
      title: "Cartographie des risques",
      summary: "Identification, hiérarchisation et pilotage des risques prioritaires.",
      points: ["Méthodes de cartographie", "Évaluation de criticité", "Plans d'atténuation"],
    },
    {
      id: "controle-de-gestion",
      title: "Contrôle de Gestion",
      summary: "Pilotage de la performance financière et opérationnelle avec des indicateurs utiles.",
      points: ["Tableaux de bord de gestion", "Suivi budgétaire", "Analyse des écarts et actions correctives"],
    },
  ],
};

function createCatalogCard(item, index, options) {
  const safeOptions = options && typeof options === "object" ? options : {};
  const typeLabel = String(safeOptions.typeLabel || "").trim();
  const actionLabel = String(safeOptions.actionLabel || "Découvrir").trim();
  const actionHref = String(safeOptions.actionHref || "contact.html").trim();
  const indexLabel = String(index + 1).padStart(2, "0");
  const points = item.points.length
    ? `<ul>${item.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
    : "";

  return `
    <article class="feature-card feature-card-pro catalog-card reveal">
      <div class="catalog-card-meta">
        <span class="catalog-card-type">${escapeHtml(typeLabel)}</span>
        <span class="catalog-card-index">${indexLabel}</span>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      ${points}
      <div class="catalog-card-footer">
        <a class="text-link" href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)}</a>
      </div>
    </article>
  `;
}

function renderCatalogGrid(selector, items, options) {
  document.querySelectorAll(selector).forEach((grid) => {
    const limit = Number(grid.getAttribute(options.limitAttribute) || items.length);
    const list = Number.isFinite(limit) && limit > 0 ? items.slice(0, limit) : items;

    if (!list.length) {
      grid.innerHTML = `<p class="note">${escapeHtml(options.emptyMessage)}</p>`;
      return;
    }

    grid.innerHTML = list.map((item, index) => createCatalogCard(item, index, options)).join("");
  });
}

function normalizeCatalogItem(item, fallbackTitle) {
  const safe = item && typeof item === "object" ? item : {};
  const title = String(safe.title || fallbackTitle || "").trim();
  const summary = String(safe.summary || "").trim();
  const points = Array.isArray(safe.points)
    ? safe.points.map((point) => String(point || "").trim()).filter(Boolean)
    : [];

  return {
    id: String(safe.id || title).trim(),
    title,
    summary,
    points,
  };
}

function normalizeSettings(settings) {
  const safe = settings && typeof settings === "object" ? settings : {};
  const contact = safe.contact && typeof safe.contact === "object" ? safe.contact : {};

  const normalized = {
    schoolName: String(safe.schoolName || DEFAULT_PUBLIC_SETTINGS.schoolName).trim(),
    tagline: String(safe.tagline || DEFAULT_PUBLIC_SETTINGS.tagline).trim(),
    contact: {
      email: String(contact.email || DEFAULT_PUBLIC_SETTINGS.contact.email).trim(),
      telephone: String(contact.telephone || DEFAULT_PUBLIC_SETTINGS.contact.telephone).trim(),
      zone: String(contact.zone || DEFAULT_PUBLIC_SETTINGS.contact.zone).trim(),
      horaires: String(contact.horaires || DEFAULT_PUBLIC_SETTINGS.contact.horaires).trim(),
      adresse: String(contact.adresse || DEFAULT_PUBLIC_SETTINGS.contact.adresse).trim(),
    },
    services: Array.isArray(safe.services)
      ? safe.services.map((item, index) => normalizeCatalogItem(item, `Service ${index + 1}`)).filter((item) => item.title)
      : DEFAULT_PUBLIC_SETTINGS.services,
    formations: Array.isArray(safe.formations)
      ? safe.formations
          .map((item, index) => normalizeCatalogItem(item, `Formation ${index + 1}`))
          .filter((item) => item.title)
      : DEFAULT_PUBLIC_SETTINGS.formations,
  };

  if (!normalized.services.length) {
    normalized.services = DEFAULT_PUBLIC_SETTINGS.services;
  }

  if (!normalized.formations.length) {
    normalized.formations = DEFAULT_PUBLIC_SETTINGS.formations;
  }

  return normalized;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePhoneForHref(phone) {
  return phone.replace(/[^\d+]/g, "");
}

function renderServicesGrid(settings) {
  const services = settings.services || [];
  renderCatalogGrid("[data-services-grid]", services, {
    typeLabel: "Service",
    actionLabel: "Demander un cadrage",
    actionHref: "contact.html#formulaire",
    emptyMessage: "Notre offre de services est en cours d'actualisation. Contactez-nous pour recevoir le détail complet.",
    limitAttribute: "data-services-limit",
  });
}

function renderFormationsGrid(settings) {
  const formations = settings.formations || [];
  renderCatalogGrid("[data-formations-grid]", formations, {
    typeLabel: "Formation",
    actionLabel: "Recevoir une proposition",
    actionHref: "contact.html#formulaire",
    emptyMessage: "Le catalogue de formation est en cours d'actualisation. Nous pouvons vous transmettre une proposition sur demande.",
    limitAttribute: "data-formations-limit",
  });
}

function renderFormationsTable(settings) {
  const formations = settings.formations || [];
  const durationSlots = ["2 jours", "3 jours", "4 jours", "Sur mesure"];
  const formatSlots = ["Présentiel", "Présentiel / hybride", "Hybride", "Distanciel / hybride"];

  document.querySelectorAll("[data-formations-table]").forEach((table) => {
    if (!formations.length) {
      table.innerHTML = '<p class="note">Aucune session planifiée pour le moment.</p>';
      return;
    }

    const rows = formations
      .map((formation, index) => {
        return `
          <div class="table-row">
            <div data-label="Programme">${escapeHtml(formation.title)}</div>
            <div data-label="Durée">${durationSlots[index % durationSlots.length]}</div>
            <div data-label="Format">${formatSlots[index % formatSlots.length]}</div>
          </div>
        `;
      })
      .join("");

    table.innerHTML = `
      <div class="table-row head">
        <div>Programme</div>
        <div>Durée</div>
        <div>Format</div>
      </div>
      ${rows}
    `;
  });
}

function renderContactSubjects(settings) {
  const titles = [...settings.services.map((item) => item.title), ...settings.formations.map((item) => item.title)];
  const uniqueTitles = Array.from(new Set(titles.filter(Boolean)));

  document.querySelectorAll("[data-contact-subject-select]").forEach((select) => {
    const options = uniqueTitles.map((title) => `<option>${escapeHtml(title)}</option>`).join("");
    select.innerHTML = `<option value="">Choisissez une option</option>${options}`;
  });
}

function renderFooter(settings) {
  const year = new Date().getFullYear();

  document.querySelectorAll(".footer").forEach((footer) => {
    footer.innerHTML = `
      <div class="container footer-shell footer-shell-simple">
        <div class="footer-simple">
          <div class="footer-simple-main">
            <h3 class="footer-heading">${escapeHtml(settings.schoolName)}</h3>
            <p data-setting="adresse">${escapeHtml(settings.contact.adresse)}</p>
          </div>

          <div class="footer-contact-list">
            <p>
              <strong>Email</strong>
              <a data-setting-link="email" href="mailto:${escapeHtml(settings.contact.email)}">${escapeHtml(settings.contact.email)}</a>
            </p>
            <p>
              <strong>Téléphone</strong>
              <a data-setting-link="telephone" href="tel:${escapeHtml(normalizePhoneForHref(settings.contact.telephone))}">${escapeHtml(settings.contact.telephone)}</a>
            </p>
            <p>
              <strong>Zone</strong>
              <span data-setting="zone">${escapeHtml(settings.contact.zone)}</span>
            </p>
          </div>
        </div>

        <div class="footer-bottom">
          <p>${escapeHtml(settings.schoolName)} (c) ${year}. Tous droits réservés.</p>
          <a href="#top">Retour en haut</a>
        </div>
      </div>
    `;
  });
}

let revealObserver = null;
let revealIndex = 0;

function registerRevealItems(elements) {
  Array.from(elements).forEach((item) => {
    if (!(item instanceof HTMLElement) || item.dataset.revealReady === "true") {
      return;
    }

    item.dataset.revealReady = "true";
    item.style.transitionDelay = `${Math.min(revealIndex * 0.05, 0.35)}s`;
    revealIndex += 1;

    if (revealObserver) {
      revealObserver.observe(item);
    } else {
      item.classList.add("in-view");
    }
  });
}

function applyPublicSettings(settings) {
  const safeSettings = normalizeSettings(settings);
  const values = {
    schoolName: safeSettings.schoolName,
    tagline: safeSettings.tagline,
    email: safeSettings.contact.email,
    telephone: safeSettings.contact.telephone,
    zone: safeSettings.contact.zone,
    horaires: safeSettings.contact.horaires,
    adresse: safeSettings.contact.adresse,
  };

  renderServicesGrid(safeSettings);
  renderFormationsGrid(safeSettings);
  renderFormationsTable(safeSettings);
  renderContactSubjects(safeSettings);
  renderFooter(safeSettings);
  registerRevealItems(document.querySelectorAll(".reveal"));

  document.querySelectorAll("[data-setting]").forEach((element) => {
    const key = element.getAttribute("data-setting");

    if (!key || !(key in values)) {
      return;
    }

    element.textContent = values[key];
  });

  document.querySelectorAll("[data-setting-link='email']").forEach((element) => {
    if (!(element instanceof HTMLAnchorElement)) {
      return;
    }

    element.textContent = values.email;
    element.href = `mailto:${values.email}`;
  });

  document.querySelectorAll("[data-setting-link='telephone']").forEach((element) => {
    if (!(element instanceof HTMLAnchorElement)) {
      return;
    }

    element.textContent = values.telephone;
    element.href = `tel:${normalizePhoneForHref(values.telephone)}`;
  });
}

async function loadPublicSettings() {
  try {
    const response = await fetch("/api/public/settings", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const settings = await response.json();
    applyPublicSettings(settings);
  } catch {
    // Keep defaults if API is not reachable.
  }
}

navLinks.forEach((link) => {
  const href = link.getAttribute("href");

  if (!href || href.startsWith("#")) {
    return;
  }

  if (normalizePathname(href) === currentPage) {
    link.classList.add("is-active");
    link.setAttribute("aria-current", "page");
  }
});

if (navToggle && topbar) {
  const closeMenu = () => {
    topbar.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (topbar.classList.contains("open")) {
        closeMenu();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (!topbar.classList.contains("open")) {
      return;
    }

    if (!event.target.closest(".nav-wrap")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && topbar.classList.contains("open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860 && topbar.classList.contains("open")) {
      closeMenu();
    }
  });
}

if ("IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -40px 0px",
    }
  );
}

registerRevealItems(document.querySelectorAll(".reveal"));

const statsSection = document.querySelector("#impact");
let countersStarted = false;

function animateCounter(element, target) {
  const duration = 1100;
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.floor(eased * target).toLocaleString("fr-FR");

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = Number(target).toLocaleString("fr-FR");
    }
  }

  requestAnimationFrame(tick);
}

if (statsSection && "IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || countersStarted) {
          return;
        }

        countersStarted = true;

        statsSection.querySelectorAll(".stat").forEach((stat) => {
          const counterElement = stat.querySelector(".counter");
          const target = Number(stat.dataset.counter || 0);

          if (counterElement) {
            animateCounter(counterElement, target);
          }
        });

        observer.unobserve(statsSection);
      });
    },
    { threshold: 0.3 }
  );

  counterObserver.observe(statsSection);
}

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  if (!question || !answer) {
    return;
  }

  question.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");

    faqItems.forEach((otherItem) => {
      const otherQuestion = otherItem.querySelector(".faq-question");
      const otherAnswer = otherItem.querySelector(".faq-answer");

      otherItem.classList.remove("open");

      if (otherQuestion) {
        otherQuestion.setAttribute("aria-expanded", "false");
      }

      if (otherAnswer) {
        otherAnswer.style.maxHeight = "";
      }
    });

    if (!isOpen) {
      item.classList.add("open");
      question.setAttribute("aria-expanded", "true");
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

function ensureStatusElement(form) {
  let status = form.querySelector(".form-status");

  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("aria-live", "polite");
    form.append(status);
  }

  return status;
}

async function sendContactForm(payload) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Échec de l'envoi";

    try {
      const data = await response.json();
      if (data && typeof data.error === "string" && data.error.trim()) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parse failure and use default message.
    }

    throw new Error(message);
  }

  return response.json();
}

const applyForms = document.querySelectorAll(".apply-form");

applyForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector("button[type='submit']");
    const status = ensureStatusElement(form);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.typeDemande) {
      payload.typeDemande = "Demande d'information";
    }

    status.textContent = "";
    status.className = "form-status";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";
    }

    try {
      await sendContactForm(payload);
      status.textContent = "Votre demande a été envoyée avec succès.";
      status.classList.add("success");
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Le formulaire n'a pas pu être envoyé.";
      status.textContent = `${errorMessage}. Vérifiez le backend puis réessayez.`;
      status.classList.add("error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Envoyer la demande";
      }
    }
  });
});

applyPublicSettings(DEFAULT_PUBLIC_SETTINGS);
loadPublicSettings();
