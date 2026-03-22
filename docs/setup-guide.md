# Setup Guide — Sonnar Automated Reporting

## Prérequis

- Node.js 18+ (`node --version`)
- Un compte Airtable avec la base `appwgQqKsHf4Z1la7` (base de démo)
- Une PAT Airtable avec scope `data.records:read` et `schema.bases:read`

---

## 1. Installation

```bash
git clone https://github.com/AdrienGGB/SonnarMVP.git
cd SonnarMVP
npm install
```

## 2. Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs :

```bash
cp .env.example .env
```

Variables requises :

| Variable | Description |
|----------|-------------|
| `AIRTABLE_PAT` | Personal Access Token Airtable (lecture + écriture) |
| `AIRTABLE_BASE_ID` | ID de la base Airtable (`appwgQqKsHf4Z1la7` pour démo) |
| `ANTHROPIC_API_KEY` | Clé Claude API (pour modules IA) |

## 3. Seed Airtable (base de démo)

```bash
npm run seed
```

Peuple la base avec : 4 consultants, 5 missions, 25 candidats, 25 entrées pipeline (tous les stages couverts), 6 qualifications avec CRs IA, 2 report logs.

## 4. Portail client (local)

```bash
cd src/portal
npm install
npm run build   # génère le dossier out/
npx serve out   # accessible sur http://localhost:3000
```

**Mode démo** : ouvrir http://localhost:3000 sans paramètres — le portail affiche les données fictives de la base de démo.

**Avec une vraie mission** : `http://localhost:3000?mission=recXXXX&key=patXXXX&base=appXXXX`

## 5. Tester les prompts IA

```bash
npm run test:prompt-cr      # teste le prompt CR d'entretien
npm run test:prompt-report  # teste le prompt report hebdo
```

## 6. Lancer n8n (workflows)

```bash
npx n8n
```

Ouvre http://localhost:5678. Importer les workflows depuis `src/n8n/`.

---

## Déploiement GitHub Pages

1. `cd src/portal && npm run build` — génère `src/portal/out/`
2. Activer GitHub Pages sur le repo, pointer vers le dossier `out/`
3. Ou utiliser une GitHub Action pour automatiser à chaque push

---

## Structure des dossiers

```
src/
├── portal/         ← portail client Next.js (npm run build → out/)
├── prompts/        ← prompts Claude en .md
├── n8n/            ← workflows exportés en .json
└── airtable/       ← schema, seed data, setup script
```
