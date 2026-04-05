# MAC Africa Institute - Site complet (Frontend + Backend)

Site institutionnel multi-pages avec:

- Frontend statique (HTML/CSS/JS) à la racine du projet
- Backend Node.js/Express dans le dossier `backend/`
- API de contact active: `POST /api/contact`
- Endpoint de santé: `GET /api/health`
- Espace Admin: gestion des demandes + mise à jour des coordonnées

## 1) Architecture du projet

```text
education site/
  index.html
  a-propos.html
  nos-services.html
  nos-formations.html
  contact.html
  admin.html
  mentions-legales.html
  politique-confidentialite.html
  404.html
  styles.css
  script.js
  admin.js
  robots.txt
  sitemap.xml
  backend/
    package.json
    .env.example
    .gitignore
    data/
      messages.json
      settings.json
    src/
      server.js
```

## 2) Prérequis

- Node.js 18+ (recommandé 20+)
- npm 9+

## 3) Lancer le site en local

Depuis le dossier `backend/`:

```bash
npm install
npm run dev
```

Puis ouvrir:

- Site: `http://localhost:8080`
- Santé API: `http://localhost:8080/api/health`

Le backend sert automatiquement toutes les pages frontend.

## 4) Configuration environnement

Copier `backend/.env.example` vers `backend/.env` puis ajuster si besoin:

```env
PORT=8080
NODE_ENV=production
SITE_BASE_URL=https://www.macafrica-institute.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=__SET_ADMIN_PASSWORD__
ADMIN_SESSION_HOURS=12
```

Optionnel:

- `CONTACT_STORAGE_FILE` pour changer l'emplacement de stockage des demandes contact.
- `SETTINGS_STORAGE_FILE` pour changer l'emplacement des paramètres publics.

## 5) API disponible

### `GET /api/health`

Réponse JSON de disponibilité du service.

### `POST /api/contact`

Body JSON attendu:

```json
{
  "typeDemande": "Demande de rendez-vous",
  "nom": "Nom complet",
  "organisation": "Nom organisation",
  "email": "contact@exemple.com",
  "telephone": "+000 000 000 000",
  "sujet": "Conseil stratégique",
  "message": "Votre besoin"
}
```

Les demandes sont stockées dans:

- `backend/data/messages.json`

### `GET /api/public/settings`

Renvoie les coordonnées publiques affichées sur la page Contact.

### `POST /api/admin/login`

Connexion administrateur, retourne un token Bearer.

### `GET /api/admin/requests`

Liste complète des demandes (admin uniquement).

### `PATCH /api/admin/requests/:id`

Mise à jour d'une demande (statut + note interne).

### `GET /api/admin/settings`

Lecture des coordonnées configurées par l'admin.

### `PUT /api/admin/settings`

Mise à jour des coordonnées publiques (nom de l'école, email, téléphone, zone, horaires, adresse).

### `GET /api/admin/smtp/status`

Retourne l'état SMTP courant (actif/inactif, serveur, expéditeur, destinataire par défaut).

### `POST /api/admin/smtp/test`

Envoie un email de test SMTP depuis le dashboard admin.

## 6) Espace Admin

URL:

- `/admin.html`

Fonctionnalités:

- Connexion sécurisée par identifiant/mot de passe
- Visualisation des demandes de rendez-vous / informations / formations
- Changement de statut des demandes (`nouvelle`, `en_cours`, `traitee`, `archivee`)
- Notes internes par demande
- Gestion des coordonnées publiques du site

Important:

- Changez impérativement `ADMIN_USERNAME` et `ADMIN_PASSWORD` avant la mise en production.

### Test rapide de l'admin

1. Démarrer le serveur:

- Dans `backend/`: `npm start`

2. Ouvrir:

- `http://localhost:8080/admin.html`

3. Se connecter (par défaut):

- Identifiant: `admin`
- Mot de passe: valeur définie dans `ADMIN_PASSWORD`

4. Vérifier:

- Nouvelle demande via `contact.html`
- Apparition dans le dashboard (Notifications + Demandes)
- Mise à jour du statut et de la note
- Ajout/modification/suppression Services et Formations
- Mise à jour des coordonnées (répercutées sur la page Contact)

### Notifications email admin

Pour recevoir un email à chaque nouvelle demande, configurez dans `backend/.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_NOTIFICATION_EMAIL` (optionnel, sinon email de contact des paramètres)

#### Config rapide prête à copier

Gmail (mot de passe d'application):

- SMTP_HOST=smtp.gmail.com
- SMTP_PORT=587
- SMTP_SECURE=false
- SMTP_USER=votre_adresse_gmail@gmail.com
- SMTP_PASS=mot_de_passe_application_16_caracteres
- SMTP_FROM=MAC Africa Institute <votre_adresse_gmail@gmail.com>
- ADMIN_NOTIFICATION_EMAIL=admin@votre-domaine.com

Outlook / Microsoft 365:

- SMTP_HOST=smtp.office365.com
- SMTP_PORT=587
- SMTP_SECURE=false
- SMTP_USER=votre_compte@outlook.com
- SMTP_PASS=votre_mot_de_passe_ou_app_password
- SMTP_FROM=MAC Africa Institute <votre_compte@outlook.com>
- ADMIN_NOTIFICATION_EMAIL=admin@votre-domaine.com

Zoho Mail:

- SMTP_HOST=smtp.zoho.com
- SMTP_PORT=587
- SMTP_SECURE=false
- SMTP_USER=votre_compte@votre-domaine.com
- SMTP_PASS=votre_app_password_zoho
- SMTP_FROM=MAC Africa Institute <votre_compte@votre-domaine.com>
- ADMIN_NOTIFICATION_EMAIL=admin@votre-domaine.com

Brevo (recommandé pour production):

- SMTP_HOST=smtp-relay.brevo.com
- SMTP_PORT=587
- SMTP_SECURE=false
- SMTP_USER=votre_login_smtp_brevo
- SMTP_PASS=votre_cle_smtp_brevo
- SMTP_FROM=MAC Africa Institute <no-reply@votre-domaine.com>
- ADMIN_NOTIFICATION_EMAIL=admin@votre-domaine.com

#### Vérification immédiate dans le dashboard

1. Redémarrer le backend après modification de `backend/.env`.
2. Ouvrir `http://localhost:8080/admin.html`.
3. Se connecter en admin.
4. Vérifier la carte `Notifications Email (SMTP)`:

- Badge `SMTP actif`
- Détails du serveur, expéditeur et destinataire

5. Saisir un email de test puis cliquer sur `Envoyer un email de test`.
6. Vérifier la réception du message et l'absence d'erreur dans le dashboard.

## 7) Déploiement (site actif et utilisable)

### Option A - Render (simple et rapide)

1. Pousser le projet sur GitHub.
2. Créer un nouveau `Web Service` sur Render.
3. Paramètres:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`
4. Variables d'environnement:
   - `NODE_ENV=production`
   - `SITE_BASE_URL=https://votre-domaine.com`
5. Ajouter votre domaine personnalisé et activer HTTPS.

### Option B - Railway

1. Importer le repo GitHub.
2. Sélectionner le dossier `backend` comme service.
3. Commandes:
   - Install: `npm install`
   - Start: `npm start`
4. Définir les variables d'environnement.
5. Connecter le domaine final.

### Option C - VPS Ubuntu + Nginx + PM2

1. Installer Node.js LTS, Nginx et PM2.
2. Cloner le projet sur le serveur.
3. Dans `backend/`: `npm install`.
4. Créer `backend/.env`.
5. Lancer: `pm2 start src/server.js --name mac-africa-site`.
6. Configurer Nginx en reverse proxy vers `http://127.0.0.1:8080`.
7. Activer SSL (Let's Encrypt).

Exemple de bloc Nginx:

```nginx
server {
  listen 80;
  server_name votre-domaine.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## 8) Checklist avant mise en production

- Remplacer les coordonnées temporaires (email/téléphone/adresse)
- Compléter les mentions légales
- Vérifier la politique de confidentialité
- Changer les identifiants admin par défaut
- Mettre à jour l'URL finale dans:
  - balises `canonical`
  - `robots.txt`
  - `sitemap.xml`
- Tester le formulaire contact en condition réelle
- Tester l'accès à `admin.html` et la mise à jour des coordonnées

## 9) Maintenance

- Vérifier régulièrement `backend/data/messages.json`
- Mettre à jour les dépendances (`npm outdated`)
- Sauvegarder les données contact si conservation requise
