const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const compression = require("compression");
const helmet = require("helmet");
const morgan = require("morgan");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const app = express();

const PORT = Number(process.env.PORT || 8080);
const FRONTEND_DIR = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.resolve(__dirname, "..", "data");

const MESSAGES_FILE = process.env.CONTACT_STORAGE_FILE
  ? path.resolve(process.env.CONTACT_STORAGE_FILE)
  : path.join(DATA_DIR, "messages.json");

const SETTINGS_FILE = process.env.SETTINGS_STORAGE_FILE
  ? path.resolve(process.env.SETTINGS_STORAGE_FILE)
  : path.join(DATA_DIR, "settings.json");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 12);
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "";

const ADMIN_STATUSES = new Set(["nouvelle", "en_cours", "traitee", "archivee"]);
const ADMIN_TOKENS = new Map();
let mailTransporter = null;
let mailReady = false;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json({ limit: "300kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 160;
const rateBuckets = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.expiresAt) {
    rateBuckets.set(ip, { count: 1, expiresAt: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

app.use((req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Trop de requêtes, réessayez plus tard." });
  }

  next();
});

function sanitizeText(value, max = 2000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getNowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizePoints(value) {
  if (Array.isArray(value)) {
    return value
      .map((point) => sanitizeText(point, 180))
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;/)
      .map((point) => sanitizeText(point, 180))
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function sanitizeCatalogItem(input, fallbackPrefix = "item") {
  const safe = input && typeof input === "object" ? input : {};
  const title = sanitizeText(safe.title, 120);
  const summary = sanitizeText(safe.summary, 340);
  const points = normalizePoints(safe.points);
  const sourceId = sanitizeText(safe.id, 100);

  return {
    id: sourceId || slugify(title) || `${fallbackPrefix}-${crypto.randomUUID().slice(0, 8)}`,
    title,
    summary,
    points,
  };
}

function ensureUniqueIds(items, prefix) {
  const used = new Set();

  return items.map((item, index) => {
    let nextId = slugify(item.id || "") || slugify(item.title || "") || `${prefix}-${index + 1}`;

    while (used.has(nextId)) {
      nextId = `${nextId}-${Math.floor(Math.random() * 9999)}`;
    }

    used.add(nextId);
    return {
      ...item,
      id: nextId,
    };
  });
}

function defaultSettings() {
  return {
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
        title: "I. Conseil stratégique",
        summary: "Accompagner les dirigeants dans les choix structurants et les priorités de transformation.",
        points: [
          "Diagnostic de maturité stratégique",
          "Clarification de la vision et des objectifs",
          "Feuille de route avec priorités trimestre",
        ],
      },
      {
        id: "expertise-management",
        title: "II. Expertise en Management",
        summary: "Renforcer l'organisation interne et les pratiques de pilotage des équipes.",
        points: [
          "Revue des processus clés",
          "Structuration des rôles et responsabilités",
          "Tableaux de bord de performance",
        ],
      },
      {
        id: "formations",
        title: "III. Formations",
        summary: "Programme diversifié de formations certifiantes, orientées application terrain.",
        points: [
          "Gestion de Projet",
          "Audit interne et contrôle interne",
          "Cartographie des risques",
          "Contrôle de Gestion",
        ],
      },
    ],
    formations: [
      {
        id: "gestion-de-projet",
        title: "Gestion de Projet",
        summary: "Planification, exécution et pilotage des projets avec des outils opérationnels.",
        points: [
          "Cadrage et gouvernance projet",
          "Gestion des délais, coûts et ressources",
          "Suivi des risques projet",
        ],
      },
      {
        id: "audit-interne-controle-interne",
        title: "Audit interne et contrôle interne",
        summary: "Renforcement des dispositifs de contrôle et fiabilisation des processus.",
        points: [
          "Techniques d'audit interne",
          "Conception de plans de contrôle",
          "Traitement des non-conformités",
        ],
      },
      {
        id: "cartographie-des-risques",
        title: "Cartographie des risques",
        summary: "Identification, hiérarchisation et pilotage des risques prioritaires.",
        points: [
          "Méthodes de cartographie",
          "Évaluation de criticité",
          "Plans d'atténuation",
        ],
      },
      {
        id: "controle-de-gestion",
        title: "Contrôle de Gestion",
        summary: "Mise en place d'outils de pilotage pour suivre la performance financière et opérationnelle.",
        points: ["Tableaux de bord de gestion", "Suivi budgétaire", "Analyse des écarts et actions correctives"],
      },
    ],
    updatedAt: getNowIso(),
  };
}

function normalizeSettings(value) {
  const defaults = defaultSettings();
  const safe = value && typeof value === "object" ? value : {};
  const contact = safe.contact && typeof safe.contact === "object" ? safe.contact : {};

  const services = ensureUniqueIds(
    (Array.isArray(safe.services) ? safe.services : [])
      .map((item) => sanitizeCatalogItem(item, "service"))
      .filter((item) => item.title),
    "service"
  );

  const formations = ensureUniqueIds(
    (Array.isArray(safe.formations) ? safe.formations : [])
      .map((item) => sanitizeCatalogItem(item, "formation"))
      .filter((item) => item.title),
    "formation"
  );

  return {
    schoolName: sanitizeText(safe.schoolName, 120) || defaults.schoolName,
    tagline: sanitizeText(safe.tagline, 180) || defaults.tagline,
    contact: {
      email: sanitizeText(contact.email, 180).toLowerCase() || defaults.contact.email,
      telephone: sanitizeText(contact.telephone, 80) || defaults.contact.telephone,
      zone: sanitizeText(contact.zone, 100) || defaults.contact.zone,
      horaires: sanitizeText(contact.horaires, 180) || defaults.contact.horaires,
      adresse: sanitizeText(contact.adresse, 220) || defaults.contact.adresse,
    },
    services: services.length ? services : defaults.services,
    formations: formations.length ? formations : defaults.formations,
    updatedAt: sanitizeText(safe.updatedAt, 80) || defaults.updatedAt,
  };
}

function normalizeMessageCollection(collection) {
  const source = Array.isArray(collection) ? collection : [];

  return source
    .map((item) => {
      const safe = item && typeof item === "object" ? item : {};
      const existingId = sanitizeText(safe.id, 100);
      const emailPayload = safe.emailNotification && typeof safe.emailNotification === "object" ? safe.emailNotification : {};

      return {
        id: existingId || crypto.randomUUID(),
        typeDemande: sanitizeText(safe.typeDemande, 80) || "Demande d'information",
        nom: sanitizeText(safe.nom, 120),
        organisation: sanitizeText(safe.organisation, 180),
        email: sanitizeText(safe.email, 180).toLowerCase(),
        telephone: sanitizeText(safe.telephone, 80),
        sujet: sanitizeText(safe.sujet, 160),
        message: sanitizeText(safe.message, 4000),
        statut: ADMIN_STATUSES.has(sanitizeText(safe.statut, 30)) ? sanitizeText(safe.statut, 30) : "nouvelle",
        adminNote: sanitizeText(safe.adminNote, 2000),
        source: sanitizeText(safe.source, 120) || "direct",
        notificationSeen: Boolean(safe.notificationSeen),
        emailNotification: {
          sent: Boolean(emailPayload.sent),
          recipient: sanitizeText(emailPayload.recipient, 180),
          at: sanitizeText(emailPayload.at, 80),
          error: sanitizeText(emailPayload.error, 220),
        },
        createdAt: sanitizeText(safe.createdAt, 80) || getNowIso(),
        updatedAt: sanitizeText(safe.updatedAt, 80) || getNowIso(),
      };
    })
    .filter((item) => item.nom && item.organisation && item.email && item.sujet && item.message);
}

async function readSettings() {
  const raw = await readJson(SETTINGS_FILE, defaultSettings());
  return normalizeSettings(raw);
}

async function writeSettings(settings) {
  const normalized = normalizeSettings(settings);
  await writeJson(SETTINGS_FILE, normalized);
  return normalized;
}

async function readMessages() {
  const raw = await readJson(MESSAGES_FILE, []);
  return normalizeMessageCollection(raw);
}

async function writeMessages(messages) {
  const normalized = normalizeMessageCollection(messages);
  await writeJson(MESSAGES_FILE, normalized);
  return normalized;
}

async function ensureJsonFile(filePath, fallbackValue) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, `${JSON.stringify(fallbackValue, null, 2)}\n`, "utf8");
  }
}

async function readJson(filePath, fallbackValue) {
  await ensureJsonFile(filePath, fallbackValue);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return fallbackValue;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanupExpiredTokens() {
  const now = Date.now();

  for (const [token, data] of ADMIN_TOKENS.entries()) {
    if (data.expiresAt <= now) {
      ADMIN_TOKENS.delete(token);
    }
  }
}

function extractBearerToken(req) {
  const authorization = req.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function requireAdmin(req, res, next) {
  cleanupExpiredTokens();

  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  const session = ADMIN_TOKENS.get(token);

  if (!session) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }

  req.admin = session;
  req.adminToken = token;
  return next();
}

function sanitizeSettingsInput(input) {
  const contact = input && typeof input === "object" ? input.contact : {};

  const settings = {
    schoolName: sanitizeText(input.schoolName, 120),
    tagline: sanitizeText(input.tagline, 180),
    contact: {
      email: sanitizeText(contact.email, 180).toLowerCase(),
      telephone: sanitizeText(contact.telephone, 80),
      zone: sanitizeText(contact.zone, 100),
      horaires: sanitizeText(contact.horaires, 180),
      adresse: sanitizeText(contact.adresse, 220),
    },
  };

  return settings;
}

function getMailTransporter() {
  if (mailReady) {
    return mailTransporter;
  }

  mailReady = true;

  if (!SMTP_HOST || !SMTP_FROM) {
    mailTransporter = null;
    return mailTransporter;
  }

  const transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
  };

  if (SMTP_USER && SMTP_PASS) {
    transportOptions.auth = {
      user: SMTP_USER,
      pass: SMTP_PASS,
    };
  }

  mailTransporter = nodemailer.createTransport(transportOptions);
  return mailTransporter;
}

async function notifyAdminByEmail(entry, settings) {
  const recipient = sanitizeText(ADMIN_NOTIFICATION_EMAIL, 180) || settings.contact.email;

  if (!recipient || !isValidEmail(recipient)) {
    return { sent: false, recipient: "", at: "", error: "Destinataire email invalide." };
  }

  const transporter = getMailTransporter();

  if (!transporter) {
    return {
      sent: false,
      recipient,
      at: "",
      error: "SMTP non configuré. Configurez SMTP_HOST et SMTP_FROM pour activer les emails.",
    };
  }

  const mailSubject = `[MAC Africa] ${entry.typeDemande} - ${entry.sujet}`;
  const textBody = [
    `Nouvelle demande reçue`,
    `Type: ${entry.typeDemande}`,
    `Nom: ${entry.nom}`,
    `Organisation: ${entry.organisation}`,
    `Email: ${entry.email}`,
    `Téléphone: ${entry.telephone || "-"}`,
    `Sujet: ${entry.sujet}`,
    `Message: ${entry.message}`,
    `Date: ${entry.createdAt}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject: mailSubject,
      text: textBody,
    });

    return {
      sent: true,
      recipient,
      at: getNowIso(),
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error ? sanitizeText(error.message, 220) : "Erreur SMTP";
    return {
      sent: false,
      recipient,
      at: "",
      error: message,
    };
  }
}

function computeRequestStats(collection) {
  const stats = {
    total: collection.length,
    nouvelle: 0,
    en_cours: 0,
    traitee: 0,
    archivee: 0,
    notificationsNonLues: 0,
  };

  collection.forEach((item) => {
    if (ADMIN_STATUSES.has(item.statut)) {
      stats[item.statut] += 1;
    }

    if (!item.notificationSeen) {
      stats.notificationsNonLues += 1;
    }
  });

  return stats;
}

function getSmtpStatusPayload(settings) {
  const defaultRecipient = sanitizeText(ADMIN_NOTIFICATION_EMAIL, 180) || settings.contact.email || "";
  const active = Boolean(SMTP_HOST && SMTP_FROM);
  const authConfigured = Boolean(SMTP_USER && SMTP_PASS);

  let reason = "";

  if (!active) {
    reason = "SMTP_HOST et SMTP_FROM sont requis.";
  } else if (!authConfigured) {
    reason = "SMTP_USER et SMTP_PASS sont requis pour la plupart des fournisseurs.";
  }

  return {
    active,
    host: SMTP_HOST || "",
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    from: SMTP_FROM || "",
    authConfigured,
    defaultRecipient,
    reason,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "mac-africa-institute-backend",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: getNowIso(),
  });
});

app.get("/api/public/settings", async (_req, res) => {
  const settings = await readSettings();
  res.json(settings);
});

app.get("/api/public/content", async (_req, res) => {
  const settings = await readSettings();
  return res.json({
    services: settings.services,
    formations: settings.formations,
    updatedAt: settings.updatedAt,
  });
});

app.post("/api/contact", async (req, res) => {
  try {
    const typeDemande = sanitizeText(req.body.typeDemande, 80);
    const nom = sanitizeText(req.body.nom, 120);
    const organisation = sanitizeText(req.body.organisation, 180);
    const email = sanitizeText(req.body.email, 180).toLowerCase();
    const telephone = sanitizeText(req.body.telephone, 80);
    const sujet = sanitizeText(req.body.sujet, 160);
    const message = sanitizeText(req.body.message, 4000);

    if (!nom || !organisation || !email || !sujet || !message) {
      return res.status(400).json({ error: "Tous les champs obligatoires doivent être complétés." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Adresse email invalide." });
    }

    const settings = await readSettings();
    const entry = {
      id: crypto.randomUUID(),
      typeDemande: typeDemande || "Demande d'information",
      nom,
      organisation,
      email,
      telephone,
      sujet,
      message,
      statut: "nouvelle",
      adminNote: "",
      source: req.get("origin") || "direct",
      notificationSeen: false,
      emailNotification: {
        sent: false,
        recipient: "",
        at: "",
        error: "",
      },
      createdAt: getNowIso(),
      updatedAt: getNowIso(),
    };

    entry.emailNotification = await notifyAdminByEmail(entry, settings);

    const nextMessages = await readMessages();
    nextMessages.push(entry);
    await writeMessages(nextMessages);

    return res.status(201).json({
      success: true,
      message: "Votre demande a été enregistrée.",
      id: entry.id,
    });
  } catch (error) {
    console.error("Erreur API /api/contact:", error);
    return res.status(500).json({ error: "Erreur serveur, merci de réessayer." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const username = sanitizeText(req.body.username, 120);
  const password = sanitizeText(req.body.password, 200);

  if (!username || !password) {
    return res.status(400).json({ error: "Identifiants incomplets." });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }

  cleanupExpiredTokens();

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000;

  ADMIN_TOKENS.set(token, {
    username,
    createdAt: getNowIso(),
    expiresAt,
  });

  return res.json({
    success: true,
    token,
    expiresAt,
    username,
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  ADMIN_TOKENS.delete(req.adminToken);
  return res.json({ success: true });
});

app.get("/api/admin/me", requireAdmin, (req, res) => {
  return res.json({
    username: req.admin.username,
    expiresAt: req.admin.expiresAt,
  });
});

app.get("/api/admin/smtp/status", requireAdmin, async (_req, res) => {
  const settings = await readSettings();
  return res.json(getSmtpStatusPayload(settings));
});

app.post("/api/admin/smtp/test", requireAdmin, async (req, res) => {
  const settings = await readSettings();
  const smtpStatus = getSmtpStatusPayload(settings);
  const to = sanitizeText(req.body.to, 180) || smtpStatus.defaultRecipient;

  if (!to || !isValidEmail(to)) {
    return res.status(400).json({ error: "Adresse email de test invalide." });
  }

  if (!smtpStatus.active) {
    return res.status(400).json({
      error: "SMTP non configuré. Renseignez SMTP_HOST et SMTP_FROM dans backend/.env.",
    });
  }

  const transporter = getMailTransporter();

  if (!transporter) {
    return res.status(400).json({
      error: "Transport SMTP indisponible. Vérifiez votre configuration SMTP.",
    });
  }

  const sentAt = getNowIso();
  const subject = "[MAC Africa] Test SMTP Dashboard";
  const text = [
    "Email de test SMTP envoyé depuis l'espace admin.",
    `Date: ${sentAt}`,
    `Serveur: ${SMTP_HOST}:${SMTP_PORT}`,
    `Sécurisé: ${SMTP_SECURE ? "oui" : "non"}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
    });

    return res.json({
      success: true,
      to,
      sentAt,
    });
  } catch (error) {
    const message = error instanceof Error ? sanitizeText(error.message, 220) : "Erreur SMTP";
    return res.status(500).json({ error: `Envoi test SMTP échoué: ${message}` });
  }
});

app.get("/api/admin/requests", requireAdmin, async (_req, res) => {
  const collection = await readMessages();

  collection.sort((a, b) => {
    const ad = new Date(a.createdAt || 0).getTime();
    const bd = new Date(b.createdAt || 0).getTime();
    return bd - ad;
  });

  return res.json({ requests: collection });
});

app.patch("/api/admin/requests/:id", requireAdmin, async (req, res) => {
  const requestId = sanitizeText(req.params.id, 80);
  const statut = sanitizeText(req.body.statut, 30);
  const adminNote = sanitizeText(req.body.adminNote, 2000);

  const collection = await readMessages();
  const index = collection.findIndex((item) => item.id === requestId);

  if (index === -1) {
    return res.status(404).json({ error: "Demande introuvable." });
  }

  if (statut && !ADMIN_STATUSES.has(statut)) {
    return res.status(400).json({ error: "Statut invalide." });
  }

  if (statut) {
    collection[index].statut = statut;
  }

  collection[index].adminNote = adminNote;
  collection[index].notificationSeen = true;
  collection[index].updatedAt = getNowIso();

  await writeMessages(collection);
  return res.json({ success: true, request: collection[index] });
});

app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
  const collection = await readMessages();

  collection.sort((a, b) => {
    const ad = new Date(a.createdAt || 0).getTime();
    const bd = new Date(b.createdAt || 0).getTime();
    return bd - ad;
  });

  const stats = computeRequestStats(collection);
  const notifications = collection.slice(0, 10).map((item) => ({
    id: item.id,
    typeDemande: item.typeDemande,
    sujet: item.sujet,
    nom: item.nom,
    statut: item.statut,
    notificationSeen: item.notificationSeen,
    createdAt: item.createdAt,
  }));

  return res.json({
    stats,
    notifications,
  });
});

app.post("/api/admin/notifications/seen", requireAdmin, async (_req, res) => {
  const collection = await readMessages();

  const next = collection.map((item) => {
    if (item.notificationSeen) {
      return item;
    }

    return {
      ...item,
      notificationSeen: true,
      updatedAt: getNowIso(),
    };
  });

  await writeMessages(next);
  return res.json({ success: true });
});

app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
  const settings = await readSettings();
  return res.json(settings);
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const payload = sanitizeSettingsInput(req.body || {});

  if (!payload.schoolName || !payload.tagline || !payload.contact.email || !payload.contact.telephone) {
    return res.status(400).json({ error: "Paramètres incomplets." });
  }

  if (!isValidEmail(payload.contact.email)) {
    return res.status(400).json({ error: "Adresse email invalide." });
  }

  const previousSettings = await readSettings();
  const nextSettings = {
    ...previousSettings,
    ...payload,
    updatedAt: getNowIso(),
  };

  await writeSettings(nextSettings);
  return res.json({ success: true, settings: nextSettings });
});

app.post("/api/admin/services", requireAdmin, async (req, res) => {
  const item = sanitizeCatalogItem(req.body, "service");

  if (!item.title || !item.summary) {
    return res.status(400).json({ error: "Titre et description du service obligatoires." });
  }

  const settings = await readSettings();
  const dedup = new Set(settings.services.map((service) => service.id));

  while (dedup.has(item.id)) {
    item.id = `${item.id}-${Math.floor(Math.random() * 9999)}`;
  }

  settings.services.push(item);
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.status(201).json({ success: true, item, services: written.services });
});

app.patch("/api/admin/services/:id", requireAdmin, async (req, res) => {
  const serviceId = sanitizeText(req.params.id, 100);
  const patch = sanitizeCatalogItem({ ...req.body, id: serviceId }, "service");

  if (!patch.title || !patch.summary) {
    return res.status(400).json({ error: "Titre et description du service obligatoires." });
  }

  const settings = await readSettings();
  const index = settings.services.findIndex((item) => item.id === serviceId);

  if (index === -1) {
    return res.status(404).json({ error: "Service introuvable." });
  }

  settings.services[index] = {
    ...settings.services[index],
    ...patch,
    id: serviceId,
  };
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.json({ success: true, item: written.services[index], services: written.services });
});

app.delete("/api/admin/services/:id", requireAdmin, async (req, res) => {
  const serviceId = sanitizeText(req.params.id, 100);
  const settings = await readSettings();
  const next = settings.services.filter((item) => item.id !== serviceId);

  if (next.length === settings.services.length) {
    return res.status(404).json({ error: "Service introuvable." });
  }

  settings.services = next;
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.json({ success: true, services: written.services });
});

app.post("/api/admin/formations", requireAdmin, async (req, res) => {
  const item = sanitizeCatalogItem(req.body, "formation");

  if (!item.title || !item.summary) {
    return res.status(400).json({ error: "Titre et description de la formation obligatoires." });
  }

  const settings = await readSettings();
  const dedup = new Set(settings.formations.map((formation) => formation.id));

  while (dedup.has(item.id)) {
    item.id = `${item.id}-${Math.floor(Math.random() * 9999)}`;
  }

  settings.formations.push(item);
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.status(201).json({ success: true, item, formations: written.formations });
});

app.patch("/api/admin/formations/:id", requireAdmin, async (req, res) => {
  const formationId = sanitizeText(req.params.id, 100);
  const patch = sanitizeCatalogItem({ ...req.body, id: formationId }, "formation");

  if (!patch.title || !patch.summary) {
    return res.status(400).json({ error: "Titre et description de la formation obligatoires." });
  }

  const settings = await readSettings();
  const index = settings.formations.findIndex((item) => item.id === formationId);

  if (index === -1) {
    return res.status(404).json({ error: "Formation introuvable." });
  }

  settings.formations[index] = {
    ...settings.formations[index],
    ...patch,
    id: formationId,
  };
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.json({ success: true, item: written.formations[index], formations: written.formations });
});

app.delete("/api/admin/formations/:id", requireAdmin, async (req, res) => {
  const formationId = sanitizeText(req.params.id, 100);
  const settings = await readSettings();
  const next = settings.formations.filter((item) => item.id !== formationId);

  if (next.length === settings.formations.length) {
    return res.status(404).json({ error: "Formation introuvable." });
  }

  settings.formations = next;
  settings.updatedAt = getNowIso();

  const written = await writeSettings(settings);
  return res.json({ success: true, formations: written.formations });
});

app.use("/backend", (_req, res) => {
  res.status(404).send("Not found");
});

app.use(
  express.static(FRONTEND_DIR, {
    extensions: ["html"],
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      } else {
        res.setHeader("Cache-Control", "public, max-age=604800");
      }
    },
  })
);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Route API introuvable." });
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(FRONTEND_DIR, "404.html"));
});

async function boot() {
  await ensureJsonFile(MESSAGES_FILE, []);
  await ensureJsonFile(SETTINGS_FILE, defaultSettings());

  const settings = await readSettings();
  await readMessages();

  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
    console.log(`Fichiers statiques: ${FRONTEND_DIR}`);
    console.log(`Stockage des demandes: ${MESSAGES_FILE}`);
    console.log(`Stockage des paramètres: ${SETTINGS_FILE}`);
    if (!SMTP_HOST || !SMTP_FROM) {
      console.log("Notification email: inactive (configurez SMTP_HOST/SMTP_FROM pour activer l'envoi)");
    } else {
      console.log(`Notification email: active vers ${ADMIN_NOTIFICATION_EMAIL || settings.contact.email}`);
    }
  });
}

boot().catch((error) => {
  console.error("Impossible de démarrer le serveur:", error);
  process.exit(1);
});
