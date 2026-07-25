import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";

/* ─── Images ─── */
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=800&q=80",
  section1: "https://images.unsplash.com/photo-1573164574511-73c773193279?w=700&q=80",
  section2: "https://images.unsplash.com/photo-1573164574397-dd250bc8a598?w=700&q=80",
  section3: "https://images.unsplash.com/photo-1550305080-4e029753abcf?w=700&q=80",
  aboutHero: "https://images.unsplash.com/photo-1573496267526-08a69e46a409?w=800&q=80",
};

/* ─── Default Settings ─── */
const defaultSettings = {
  schoolName: "MAC Africa Institute",
  tagline: "Un Institut de Référence en Afrique",
  contact: {
    email: "contact@macafrica-institute.com",
    telephone: "+221 33 000 00 00",
    zone: "Afrique de l'Ouest et Centrale",
    horaires: "Du lundi au vendredi, 8h30 - 17h30",
    adresse: "Dakar, Sénégal",
  },
  services: [
    {
      id: "conseil-strategique",
      title: "Conseil Stratégique",
      summary: "Accompagner les dirigeants dans leurs choix structurants et leur pilotage opérationnel.",
      points: ["Diagnostic organisationnel", "Feuille de route stratégique", "Pilotage de la performance"],
    },
    {
      id: "audit-controle-interne",
      title: "Audit et Contrôle Interne",
      summary: "Fiabiliser les processus, maîtriser les risques et renforcer la gouvernance.",
      points: ["Audit des processus", "Cartographie des risques", "Plans d'actions correctives"],
    },
    {
      id: "controle-de-gestion",
      title: "Contrôle de Gestion",
      summary: "Mettre en place des outils de pilotage financier et de mesure de la performance.",
      points: ["Tableaux de bord", "Reporting financier", "Analyse budgétaire"],
    },
    {
      id: "management-projets",
      title: "Management de Projets",
      summary: "Structurer et piloter les projets avec rigueur et efficacité.",
      points: ["Cadrage et planification", "Exécution et suivi", "Clôture et capitalisation"],
    },
  ],
  formations: [
    {
      id: "gestion-de-projet",
      title: "Gestion de Projet",
      summary: "Maîtriser les outils et méthodologies de pilotage de projets.",
      points: ["Cadrage", "Planification", "Suivi et évaluation"],
      duree: "5 jours",
      mode: "Présentiel / En ligne",
    },
    {
      id: "audit-interne",
      title: "Audit Interne et Contrôle Interne",
      summary: "Fiabiliser les processus et réduire les risques opérationnels.",
      points: ["Normes d'audit", "Méthodologie", "Rapports"],
      duree: "4 jours",
      mode: "Présentiel",
    },
    {
      id: "controle-gestion",
      title: "Contrôle de Gestion",
      summary: "Piloter la performance financière avec des outils adaptés.",
      points: ["Budget", "Reporting", "Analyse des écarts"],
      duree: "4 jours",
      mode: "Présentiel / En ligne",
    },
    {
      id: "management-risques",
      title: "Management des Risques",
      summary: "Identifier, évaluer et traiter les risques organisationnels.",
      points: ["Identification", "Évaluation", "Traitement"],
      duree: "3 jours",
      mode: "Présentiel",
    },
    {
      id: "planification-strategique",
      title: "Planification Stratégique",
      summary: "Élaborer et déployer une stratégie cohérente et mesurable.",
      points: ["Analyse SWOT", "Plan stratégique", "Indicateurs"],
      duree: "3 jours",
      mode: "Présentiel / En ligne",
    },
  ],
};

/* ─── Hook: useSiteSettings ─── */
function useSiteSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/public/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data && typeof data === "object") {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch {
        // keep defaults
      }
    }

    load();
    return () => { active = false; };
  }, []);

  return settings;
}

/* ─── Scroll to top on route change ─── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ─── Header ─── */
function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className={`topbar${open ? " open" : ""}`}>
      <div className="container nav-wrap">
        <Link className="brand" to="/">
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>MAC Africa</strong>
            <small>Institute</small>
          </span>
        </Link>

        <nav className="main-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? "is-active" : ""}>Accueil</NavLink>
          <NavLink to="/a-propos" className={({ isActive }) => isActive ? "is-active" : ""}>À propos</NavLink>
          <NavLink to="/services" className={({ isActive }) => isActive ? "is-active" : ""}>Services</NavLink>
          <NavLink to="/formations" className={({ isActive }) => isActive ? "is-active" : ""}>Formations</NavLink>
          <NavLink to="/contact" className={({ isActive }) => isActive ? "is-active" : ""}>Contact</NavLink>
        </nav>

        <Link className="btn btn-sm" to="/contact">Nous contacter</Link>

        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}

/* ─── Footer ─── */
function Footer({ settings }) {
  const offers = useMemo(() => {
    return [...(settings.services || []).slice(0, 2), ...(settings.formations || []).slice(0, 2)];
  }, [settings]);

  return (
    <footer className="footer">
      <div className="container footer-wrap">
        <div className="footer-simple">
          <div className="footer-simple-main">
            <div className="footer-brand-block">
              <Link to="/" className="footer-brand-link brand">
                <span className="brand-mark">M</span>
                <span className="brand-copy">
                  <strong style={{ color: "#fff" }}>MAC Africa</strong>
                  <small style={{ color: "rgba(255,255,255,0.5)" }}>Institute</small>
                </span>
              </Link>
              <p>{settings.tagline}</p>
            </div>
          </div>
          <div className="footer-contact-list">
            <p><strong>Adresse</strong><span>{settings.contact?.adresse}</span></p>
            <p><strong>Email</strong><a href={`mailto:${settings.contact?.email}`}>{settings.contact?.email}</a></p>
            <p><strong>Téléphone</strong><a href={`tel:${settings.contact?.telephone}`}>{settings.contact?.telephone}</a></p>
          </div>
        </div>

        <div className="footer-columns">
          <section>
            <h3>Navigation</h3>
            <nav className="footer-nav">
              <Link to="/">Accueil</Link>
              <Link to="/a-propos">À propos</Link>
              <Link to="/services">Services</Link>
              <Link to="/formations">Formations</Link>
              <Link to="/contact">Contact</Link>
            </nav>
          </section>
          <section>
            <h3>Offres</h3>
            <ul className="footer-list">
              {offers.map((offer) => (
                <li key={offer.id}>{offer.title}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Horaires</h3>
            <p>{settings.contact?.horaires}</p>
          </section>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 MAC Africa Institute. Tous droits réservés.</p>
          <p>Dakar, Sénégal</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── CardGrid ─── */
function CardGrid({ items, showIndex }) {
  return (
    <div className="feature-grid">
      {items.map((item, idx) => (
        <article className="feature-card feature-card-pro" key={item.id}>
          {showIndex && (
            <div className="catalog-card-meta">
              <span className="catalog-card-type">{item.duree || "Formation"}</span>
              <span className="catalog-card-index">{String(idx + 1).padStart(2, "0")}</span>
            </div>
          )}
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          {item.points && item.points.length > 0 && (
            <ul>
              {item.points.map((point, i) => (
                <li key={`${item.id}-${i}`}>{point}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

/* ─── Stats Bar ─── */
function Stats() {
  return (
    <div className="stats">
      <div className="stat">
        <h3>+20</h3>
        <p>Années d'expérience</p>
      </div>
      <div className="stat">
        <h3>500+</h3>
        <p>Professionnels formés</p>
      </div>
      <div className="stat">
        <h3>15+</h3>
        <p>Pays d'intervention</p>
      </div>
      <div className="stat">
        <h3>98%</h3>
        <p>Taux de satisfaction</p>
      </div>
    </div>
  );
}

/* ─── CTA Band ─── */
function CTABand({ title, text, buttonText, buttonLink }) {
  return (
    <div className="cta-band">
      <span className="eyebrow">Passez à l'action</span>
      <h2>{title || "Prêt à transformer votre organisation ?"}</h2>
      <p>{text || "Contactez-nous pour discuter de vos besoins en formation, audit ou conseil stratégique."}</p>
      <div className="hero-actions">
        <Link className="btn" to={buttonLink || "/contact"}>{buttonText || "Nous contacter"}</Link>
        <Link className="btn btn-ghost" to="/formations">Voir nos formations</Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── HOME PAGE ─── */
/* ═══════════════════════════════════════════ */
function HomePage({ settings }) {
  return (
    <>
      {/* Hero Fullscreen */}
      <section className="hero-fullscreen">
        <div className="hero-fullscreen-bg" style={{ backgroundImage: `url(${IMAGES.hero})` }}></div>
        <div className="hero-fullscreen-overlay"></div>
        <div className="hero-fullscreen-content">
          <h1 className="hero-fullscreen-title">MAC Africa Institute</h1>
          <p className="hero-fullscreen-subtitle">Votre partenaire d'excellence en management</p>
          <div className="hero-actions" style={{ justifyContent: "center", marginTop: "2rem" }}>
            <Link className="btn hero-btn-light" to="/formations">Découvrir nos formations</Link>
            <Link className="btn btn-ghost hero-btn-outline" to="/contact">Réserver un entretien</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Stats />
        </div>
      </section>

      {/* Pillars */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nos domaines d'excellence</span>
            <h2>Trois piliers pour la performance durable</h2>
            <p className="section-lead">Des solutions intégrées qui répondent aux défis réels des organisations africaines.</p>
          </div>
          <div className="insight-grid">
            <article className="insight-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
              </div>
              <h3>Formation Professionnelle</h3>
              <p>Des programmes certifiants conçus pour renforcer les compétences des cadres et dirigeants africains.</p>
            </article>
            <article className="insight-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3>Audit et Contrôle</h3>
              <p>Fiabiliser vos processus, maîtriser les risques et garantir la conformité de votre organisation.</p>
            </article>
            <article className="insight-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <h3>Conseil Stratégique</h3>
              <p>Accompagner les dirigeants dans les choix structurants pour une croissance maîtrisée.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Image + Text section */}
      <section className="section">
        <div className="container two-col align-center">
          <img className="section-img" src={IMAGES.section1} alt="Formation professionnelle en Afrique" />
          <div>
            <span className="eyebrow">Notre approche</span>
            <h2>Une expertise ancrée dans les réalités africaines</h2>
            <p className="section-lead">Nous combinons rigueur académique et connaissance approfondie du terrain pour proposer des solutions concrètes et opérationnelles.</p>
            <ul className="list-check">
              <li>Formateurs expérimentés avec +20 ans de pratique</li>
              <li>Méthodologies adaptées au contexte africain</li>
              <li>Accompagnement personnalisé post-formation</li>
              <li>Réseau de professionnels dans 15+ pays</li>
            </ul>
            <Link className="text-link" to="/a-propos">Découvrir notre institut</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section stories">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Témoignages</span>
            <h2>Ils nous font confiance</h2>
          </div>
          <div className="story-grid">
            <article className="story-card">
              <p>La formation en gestion de projet a transformé notre approche. Nous livrons désormais nos projets dans les délais et budgets prévus.</p>
              <h3>Directeur de projet - Ministère de l'Économie</h3>
            </article>
            <article className="story-card">
              <p>L'audit organisationnel réalisé par MAC Africa Institute nous a permis d'identifier des gains d'efficacité majeurs.</p>
              <h3>DG - Groupe industriel, Dakar</h3>
            </article>
            <article className="story-card">
              <p>Un accompagnement de qualité qui allie théorie et pratique. Les outils fournis sont directement applicables au quotidien.</p>
              <h3>Responsable Audit - Institution financière</h3>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <CTABand />
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── ABOUT PAGE ─── */
/* ═══════════════════════════════════════════ */
function AboutPage({ settings }) {
  return (
    <>
      {/* Hero */}
      <section className="hero section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow-strong">À propos</span>
              <h1>Un institut engagé pour la performance durable en Afrique</h1>
              <p>MAC Africa Institute accompagne les organisations africaines avec conseil, expertise en management et formations certifiantes adaptées au terrain.</p>
              <div className="hero-actions">
                <Link className="btn" to="/contact">Échanger avec nous</Link>
              </div>
            </div>
            <div className="hero-visual">
              <img src={IMAGES.aboutHero} alt="Équipe de professionnels africains" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Nos valeurs</span>
            <h2>Les principes qui guident notre action</h2>
          </div>
          <div className="feature-grid">
            <article className="value-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <h3>Excellence</h3>
              <p>Nous visons l'excellence dans chaque intervention, formation et conseil que nous délivrons.</p>
            </article>
            <article className="value-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <h3>Proximité</h3>
              <p>Un accompagnement humain et personnalisé, ancré dans les réalités de nos clients.</p>
            </article>
            <article className="value-card">
              <div className="icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
              </div>
              <h3>Impact</h3>
              <p>Des résultats mesurables et durables pour chaque organisation que nous accompagnons.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Vision + checklist */}
      <section className="section">
        <div className="container two-col align-center">
          <div>
            <span className="eyebrow">Notre vision</span>
            <h2>Devenir la référence du conseil et de la formation en Afrique</h2>
            <p className="section-lead">Nous croyons que le développement durable de l'Afrique passe par le renforcement des compétences de ses cadres et dirigeants.</p>
            <ul className="list-check">
              <li>Former les leaders africains de demain</li>
              <li>Adapter les meilleures pratiques internationales au contexte local</li>
              <li>Contribuer à la gouvernance et la transparence des organisations</li>
              <li>Créer un réseau d'excellence panafricain</li>
              <li>Promouvoir l'innovation managériale responsable</li>
            </ul>
          </div>
          <img className="section-img" src={IMAGES.section2} alt="Vision MAC Africa Institute" />
        </div>
      </section>

      {/* Founder */}
      <section className="section programs">
        <div className="container two-col align-center">
          <img className="section-img" src={IMAGES.section3} alt="El Hadj Sall, fondateur de MAC Africa Institute" />
          <div>
            <span className="eyebrow">Le Fondateur</span>
            <h2>El Hadj Sall</h2>
            <p className="section-lead">Économiste-environnementaliste, titulaire d'un Doctorat en Sciences de Gestion, El Hadj Sall cumule plus de 20 années d'expérience dans le conseil et la formation en Afrique.</p>
            <ul className="list-check">
              <li>Spécialiste en planification stratégique</li>
              <li>Expert en management et gouvernance</li>
              <li>Praticien de l'audit et du contrôle interne</li>
              <li>Spécialiste en gestion des risques</li>
              <li>Intervenant dans 15+ pays africains</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Methodology Timeline */}
      <section className="section">
        <div className="container path-grid">
          <div>
            <span className="eyebrow">Notre méthodologie</span>
            <h2>Une approche structurée et éprouvée</h2>
            <p className="section-lead">Chaque intervention suit un processus rigoureux pour garantir des résultats concrets et durables.</p>
          </div>
          <ul className="timeline">
            <li>
              <h3>1. Diagnostic</h3>
              <p>Analyse approfondie de la situation et identification des besoins spécifiques.</p>
            </li>
            <li>
              <h3>2. Conception</h3>
              <p>Élaboration d'une solution sur mesure adaptée au contexte et aux objectifs.</p>
            </li>
            <li>
              <h3>3. Mise en oeuvre</h3>
              <p>Déploiement de l'intervention avec un suivi rapproché et des ajustements continus.</p>
            </li>
            <li>
              <h3>4. Évaluation</h3>
              <p>Mesure des résultats, capitalisation des acquis et recommandations pour la suite.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* Engagements */}
      <section className="section">
        <div className="container">
          <CTABand
            title="Engagés pour l'excellence africaine"
            text="Rejoignez les centaines de professionnels et organisations qui font confiance à MAC Africa Institute."
            buttonText="Contactez-nous"
            buttonLink="/contact"
          />
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── SERVICES PAGE ─── */
/* ═══════════════════════════════════════════ */
function ServicesPage({ settings }) {
  return (
    <>
      {/* Hero */}
      <section className="hero section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow-strong">Nos Services</span>
              <h1>Des solutions sur mesure pour votre organisation</h1>
              <p>Conseil stratégique, audit, contrôle interne et accompagnement opérationnel pour les entreprises et institutions africaines.</p>
              <div className="hero-actions">
                <Link className="btn" to="/contact">Demander un devis</Link>
              </div>
            </div>
            <div className="hero-visual">
              <img src={IMAGES.section1} alt="Services de conseil en Afrique" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Catalogue</span>
            <h2>Nos services de conseil et d'accompagnement</h2>
            <p className="section-lead">Des interventions ciblées pour renforcer la performance et la gouvernance de votre organisation.</p>
          </div>
          <CardGrid items={settings.services || []} />
        </div>
      </section>

      {/* Sectors */}
      <section className="section">
        <div className="container two-col align-center">
          <div>
            <span className="eyebrow">Secteurs d'intervention</span>
            <h2>Des expertises multisectorielles</h2>
            <p className="section-lead">Notre expérience couvre un large éventail de secteurs d'activité en Afrique.</p>
            <ul className="list-check">
              <li>Secteur public et administrations</li>
              <li>Institutions financières et banques</li>
              <li>Organisations internationales et ONG</li>
              <li>Entreprises industrielles et commerciales</li>
              <li>Secteur de l'énergie et des mines</li>
              <li>Télécommunications et technologie</li>
              <li>Santé et éducation</li>
            </ul>
          </div>
          <img className="section-img" src={IMAGES.section2} alt="Secteurs d'intervention MAC Africa" />
        </div>
      </section>

      {/* Process */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Notre processus</span>
            <h2>Comment nous intervenons</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-card-pro">
              <h3>01. Écoute et Diagnostic</h3>
              <p>Nous analysons votre contexte, vos enjeux et vos contraintes pour comprendre précisément vos besoins.</p>
            </article>
            <article className="feature-card feature-card-pro">
              <h3>02. Proposition et Cadrage</h3>
              <p>Nous élaborons une offre technique et financière détaillée avec un calendrier d'intervention clair.</p>
            </article>
            <article className="feature-card feature-card-pro">
              <h3>03. Intervention et Livrables</h3>
              <p>Nous déployons notre expertise avec des livrables concrets et un transfert de compétences effectif.</p>
            </article>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <CTABand
            title="Un besoin spécifique ?"
            text="Parlons de vos enjeux et construisons ensemble la solution adaptée à votre organisation."
            buttonText="Prendre rendez-vous"
            buttonLink="/contact"
          />
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── FORMATIONS PAGE ─── */
/* ═══════════════════════════════════════════ */
function FormationsPage({ settings }) {
  return (
    <>
      {/* Hero */}
      <section className="hero section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-eyebrow-strong">Nos Formations</span>
              <h1>Développez les compétences de vos équipes</h1>
              <p>Des programmes certifiants en gestion de projet, audit, contrôle de gestion et management des risques.</p>
              <div className="hero-actions">
                <Link className="btn" to="/contact">S'inscrire</Link>
                <Link className="btn btn-outline" to="/contact">Demander le catalogue</Link>
              </div>
            </div>
            <div className="hero-visual">
              <img src={IMAGES.section3} alt="Formation professionnelle en Afrique" />
            </div>
          </div>
        </div>
      </section>

      {/* Formations Grid */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Catalogue</span>
            <h2>Nos programmes de formation</h2>
            <p className="section-lead">Des formations conçues par des experts pour des professionnels exigeants.</p>
          </div>
          <CardGrid items={settings.formations || []} showIndex />
        </div>
      </section>

      {/* Pedagogy */}
      <section className="section">
        <div className="container two-col align-center">
          <img className="section-img" src={IMAGES.section1} alt="Pédagogie MAC Africa Institute" />
          <div>
            <span className="eyebrow">Pédagogie</span>
            <h2>Une approche centrée sur la pratique</h2>
            <p className="section-lead">Nos formations privilégient les mises en situation, les études de cas réels et les outils directement applicables.</p>
            <ul className="list-check">
              <li>Cas pratiques issus du contexte africain</li>
              <li>Formateurs praticiens avec expérience terrain</li>
              <li>Groupes restreints pour un suivi personnalisé</li>
              <li>Supports et outils fournis aux participants</li>
              <li>Attestation de formation délivrée</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Calendar Table */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Calendrier</span>
            <h2>Prochaines sessions</h2>
          </div>
          <div className="table-block">
            <div className="table-row head">
              <div>Formation</div>
              <div>Durée</div>
              <div>Mode</div>
            </div>
            {(settings.formations || []).map((f) => (
              <div className="table-row" key={f.id}>
                <div data-label="Formation">{f.title}</div>
                <div data-label="Durée">{f.duree || "À définir"}</div>
                <div data-label="Mode">{f.mode || "Présentiel"}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Timeline */}
      <section className="section">
        <div className="container path-grid">
          <div>
            <span className="eyebrow">Méthodologie</span>
            <h2>Le parcours de formation</h2>
            <p className="section-lead">Un processus structuré de l'inscription à la certification.</p>
          </div>
          <ul className="timeline">
            <li>
              <h3>1. Inscription et positionnement</h3>
              <p>Évaluation des prérequis et définition des objectifs individuels.</p>
            </li>
            <li>
              <h3>2. Formation intensive</h3>
              <p>Sessions animées par des experts avec alternance théorie et pratique.</p>
            </li>
            <li>
              <h3>3. Évaluation et certification</h3>
              <p>Validation des acquis et délivrance de l'attestation de formation.</p>
            </li>
            <li>
              <h3>4. Suivi post-formation</h3>
              <p>Accompagnement dans la mise en application des compétences acquises.</p>
            </li>
          </ul>
        </div>
      </section>

      {/* Results KPIs */}
      <section className="section programs">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Résultats</span>
            <h2>L'impact de nos formations</h2>
          </div>
          <div className="kpi-strip">
            <div className="kpi-card">
              <h3>98%</h3>
              <p>Taux de satisfaction</p>
            </div>
            <div className="kpi-card">
              <h3>500+</h3>
              <p>Professionnels formés</p>
            </div>
            <div className="kpi-card">
              <h3>92%</h3>
              <p>Application en poste</p>
            </div>
            <div className="kpi-card">
              <h3>15+</h3>
              <p>Pays représentés</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <CTABand
            title="Inscrivez-vous à nos prochaines sessions"
            text="Places limitées. Contactez-nous pour réserver votre place ou organiser une formation intra-entreprise."
            buttonText="S'inscrire maintenant"
            buttonLink="/contact"
          />
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── CONTACT PAGE ─── */
/* ═══════════════════════════════════════════ */
function ContactPage({ settings }) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setStatus("");
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

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erreur d'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Hero text only */}
      <section className="hero section">
        <div className="container">
          <div className="hero-copy" style={{ maxWidth: "680px" }}>
            <span className="hero-eyebrow-strong">Contact</span>
            <h1>Parlons de vos priorités</h1>
            <p>Que vous souhaitiez une formation, un audit ou un accompagnement stratégique, notre équipe est à votre écoute.</p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="contact-cards">
            <article className="contact-card contact-card-primary">
              <h3>Adresse</h3>
              <p>Dakar, Sénégal</p>
              <p>{settings.contact?.adresse}</p>
            </article>
            <article className="contact-card">
              <h3>Email</h3>
              <p><a href={`mailto:${settings.contact?.email}`}>{settings.contact?.email}</a></p>
            </article>
            <article className="contact-card">
              <h3>Téléphone</h3>
              <p><a href={`tel:${settings.contact?.telephone}`}>{settings.contact?.telephone}</a></p>
            </article>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="apply">
        <div className="container">
          <div className="apply-box">
            <div>
              <span className="eyebrow">Formulaire</span>
              <h2>Envoyez-nous votre demande</h2>
              <p>Remplissez le formulaire ci-contre et notre équipe vous répondra sous 24 à 48 heures ouvrées.</p>
              <p className="note">Tous les champs marqués sont obligatoires. Vos données sont traitées de manière confidentielle.</p>
            </div>
            <form className="apply-form" onSubmit={onSubmit}>
              <label>
                Nom complet
                <input type="text" name="nom" placeholder="Votre nom et prénom" required />
              </label>
              <label>
                Email
                <input type="email" name="email" placeholder="votre@email.com" required />
              </label>
              <label>
                Téléphone
                <input type="tel" name="telephone" placeholder="+221 77 000 00 00" />
              </label>
              <label>
                Type de demande
                <select name="typeDemande" required>
                  <option value="">Choisissez</option>
                  <option>Demande d'information</option>
                  <option>Demande de formation</option>
                  <option>Demande d'inscription</option>
                  <option>Demande de rendez-vous</option>
                  <option>Demande de devis</option>
                </select>
              </label>
              <label className="field-span-full">
                Message
                <textarea name="message" placeholder="Décrivez votre besoin..." required></textarea>
              </label>
              <button className="btn btn-full" type="submit" disabled={loading}>
                {loading ? "Envoi en cours..." : "Envoyer ma demande"}
              </button>
              {status === "success" && (
                <p className="form-status success">Votre demande a été envoyée avec succès. Nous vous répondrons rapidement.</p>
              )}
              {status && status !== "success" && (
                <p className="form-status error">{status}</p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Zone d'intervention */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Zone d'intervention</span>
            <h2>Présents à travers l'Afrique</h2>
          </div>
          <div className="map-frame">
            <div className="territory-card">
              <h3>Afrique de l'Ouest et Centrale</h3>
              <p>Nos interventions couvrent l'ensemble de la sous-région, en présentiel et à distance.</p>
              <div className="territory-modes">
                <span>Sénégal</span>
                <span>Côte d'Ivoire</span>
                <span>Mali</span>
                <span>Cameroun</span>
                <span>Guinée</span>
                <span>Burkina Faso</span>
                <span>En ligne</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════ */
/* ─── APP ROOT ─── */
/* ═══════════════════════════════════════════ */
export default function App() {
  const settings = useSiteSettings();

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage settings={settings} />} />
          <Route path="/a-propos" element={<AboutPage settings={settings} />} />
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
