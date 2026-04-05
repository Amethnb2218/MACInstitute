import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";

const defaultSettings = {
  schoolName: "MAC Africa Institute",
  tagline: "Un Institut de Reference en Afrique",
  contact: {
    email: "contact@macafrica-institute.com",
    telephone: "+000 000 000 000",
    zone: "Afrique",
    horaires: "Du lundi au vendredi, 8h30 a 17h30",
    adresse: "Adresse a completer",
  },
  services: [
    {
      id: "conseil-strategique",
      title: "I. Conseil strategique",
      summary: "Accompagner les dirigeants dans les choix structurants.",
      points: ["Diagnostic", "Feuille de route", "Pilotage"],
    },
    {
      id: "expertise-management",
      title: "II. Expertise en Management",
      summary: "Renforcer l'organisation et le pilotage de la performance.",
      points: ["Processus", "Gouvernance", "Tableaux de bord"],
    },
  ],
  formations: [
    {
      id: "gestion-de-projet",
      title: "Gestion de Projet",
      summary: "Pilotage de projets avec outils operationnels.",
      points: ["Cadrage", "Execution", "Suivi"],
    },
    {
      id: "audit-interne",
      title: "Audit interne et controle interne",
      summary: "Fiabiliser les processus et reduire les risques.",
      points: ["Audit", "Controle", "Actions correctives"],
    },
  ],
};

function useSiteSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/public/settings", { cache: "no-store" });

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (active && data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // keep defaults
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return settings;
}

function Header() {
  return (
    <header className="topbar">
      <div className="container nav-wrap">
        <Link className="brand" to="/">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>MAC Africa</strong>
            <small>Institute</small>
          </span>
        </Link>

        <nav className="main-nav">
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/a-propos">A propos</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/formations">Formations</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>

        <a className="btn btn-sm" href="/admin.html">
          Dashboard Admin
        </a>
      </div>
    </header>
  );
}

function Footer({ settings }) {
  const offers = useMemo(() => {
    return [...(settings.services || []).slice(0, 2), ...(settings.formations || []).slice(0, 2)];
  }, [settings]);

  return (
    <footer className="footer">
      <div className="container footer-shell">
        <div className="footer-brand-block">
          <h3>{settings.schoolName}</h3>
          <p>{settings.tagline}</p>
        </div>

        <div className="footer-columns">
          <section>
            <h4>Navigation</h4>
            <nav className="footer-nav">
              <Link to="/">Accueil</Link>
              <Link to="/a-propos">A propos</Link>
              <Link to="/services">Services</Link>
              <Link to="/formations">Formations</Link>
              <Link to="/contact">Contact</Link>
              <a href="/admin.html">Espace Admin</a>
            </nav>
          </section>

          <section>
            <h4>Offres</h4>
            <ul className="footer-list">
              {offers.map((offer) => (
                <li key={offer.id}>{offer.title}</li>
              ))}
            </ul>
          </section>

          <section>
            <h4>Coordonnees</h4>
            <p>{settings.contact?.email}</p>
            <p>{settings.contact?.telephone}</p>
            <p>{settings.contact?.zone}</p>
          </section>
        </div>
      </div>
    </footer>
  );
}

function CardGrid({ items }) {
  return (
    <div className="feature-grid">
      {items.map((item) => (
        <article className="feature-card" key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <ul>
            {(item.points || []).map((point, idx) => (
              <li key={`${item.id}-${idx}`}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function HomePage({ settings }) {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">React Frontend</p>
        <h1>Version React moderne pour MAC Africa Institute</h1>
        <p className="section-lead">
          Cette version React consomme les memes APIs backend et les catalogues admin (services/formations)
          sont affiches dynamiquement.
        </p>

        <h2 className="catalog-title">Services</h2>
        <CardGrid items={(settings.services || []).slice(0, 3)} />

        <h2 className="catalog-title">Formations</h2>
        <CardGrid items={(settings.formations || []).slice(0, 4)} />
      </div>
    </section>
  );
}

function ServicesPage({ settings }) {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Nos Services</p>
        <h1>Catalogue dynamique des services</h1>
        <CardGrid items={settings.services || []} />
      </div>
    </section>
  );
}

function FormationsPage({ settings }) {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Nos Formations</p>
        <h1>Catalogue dynamique des formations</h1>
        <CardGrid items={settings.formations || []} />
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">A propos</p>
        <h1>Un institut engage pour la performance durable</h1>
        <p className="section-lead">
          MAC Africa Institute accompagne les organisations avec conseil, expertise en management et formations
          certifiantes adaptees au terrain africain.
        </p>
      </div>
    </section>
  );
}

function ContactPage({ settings }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const subjects = useMemo(() => {
    return [
      ...(settings.services || []).map((item) => item.title),
      ...(settings.formations || []).map((item) => item.title),
    ];
  }, [settings]);

  async function onSubmit(event) {
    event.preventDefault();
+    setStatus("");
    setLoading(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    if (!payload.typeDemande) {
      payload.typeDemande = "Demande d'information";
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Envoi impossible");
      }

      setStatus("Demande envoyee avec succes.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur d'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container two-col">
        <div>
          <p className="eyebrow">Contact</p>
          <h1>Parlons de vos priorites</h1>
          <p className="section-lead">
            Email: {settings.contact?.email}
            <br />
            Telephone: {settings.contact?.telephone}
          </p>
        </div>

        <form className="apply-form" onSubmit={onSubmit}>
          <label>
            Type de demande
            <select name="typeDemande" required>
              <option value="">Choisissez</option>
              <option>Demande de rendez-vous</option>
              <option>Demande d'information</option>
              <option>Demande de formation</option>
              <option>Demande d'inscription</option>
            </select>
          </label>
          <label>
            Nom complet
            <input type="text" name="nom" required />
          </label>
          <label>
            Organisation
            <input type="text" name="organisation" required />
          </label>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Telephone
            <input type="text" name="telephone" />
          </label>
          <label>
            Sujet
            <select name="sujet" required>
              <option value="">Choisissez</option>
              {subjects.map((subject, idx) => (
                <option key={`${subject}-${idx}`}>{subject}</option>
              ))}
            </select>
          </label>
          <label>
            Message
            <textarea name="message" required />
          </label>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer"}
          </button>
          {status ? <p className="form-status">{status}</p> : null}
        </form>
      </div>
    </section>
  );
}

export default function App() {
  const settings = useSiteSettings();

  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage settings={settings} />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage settings={settings} />} />
          <Route path="/formations" element={<FormationsPage settings={settings} />} />
          <Route path="/contact" element={<ContactPage settings={settings} />} />
          <Route path="*" element={<HomePage settings={settings} />} />
        </Routes>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
