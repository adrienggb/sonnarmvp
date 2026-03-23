# Sonnar — Automated Mission Reporting

> Éliminer les 10h/semaine de reporting manuel par consultant.
> Stack : Airtable · Ollama (local) · Claude API · Next.js · GitHub Pages

---

## Le problème

Chaque consultant Sonnar passe **10h/semaine** à produire manuellement des reports clients hebdo et des CR d'entretien. Sur 12 consultants, c'est **~100h/semaine** de travail à faible valeur ajoutée.

## La solution — 2 modules

**Module B — CR d'entretien structuré**
Le consultant colle la transcription → CLI → Ollama/Claude génère le CR structuré → champs extraits injectés dans Airtable. Passage de **3-4h à 15 min** par entretien.

**Module A — Report hebdo automatisé**
Une commande → KPIs auto-calculés depuis Airtable → Ollama/Claude génère le report → stocké dans Report_Log → visible dans le portail client. Passage de **6-7h à < 5 min** par semaine.

## Démo rapide

```bash
npm install
cp .env.example .env   # remplir AIRTABLE_PAT, AIRTABLE_BASE_ID, ANTHROPIC_API_KEY

# Module B — CR d'entretien (end-to-end avec candidat fictif)
npm run demo
npm run demo:cleanup

# Module A — Report hebdo
node src/scripts/generate-report.js --mission rec6RAvzkYERdNS2w

# Portail client (local)
cd src/portal && npm run dev   # → http://localhost:3000
```

Portail déployé : https://adrienggb.github.io/SonnarMVP/?missionId=rec6RAvzkYERdNS2w

## Stack & coût

| Composant | Outil | Coût |
|-----------|-------|------|
| Base de données | Airtable | Existant |
| IA (dev/démo) | Ollama local (qwen2.5:7b) | 0€ |
| IA (production) | Claude API (Sonnet) | ~50-80€/mois |
| Portail client | Next.js + GitHub Pages | 0€ |
| **Total prod** | | **~50-80€/mois** |

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run seed` | Peupler la base Airtable de démo |
| `npm run demo` | Démo end-to-end Module B (candidat fictif → CR IA) |
| `npm run demo:cleanup` | Nettoyer les enregistrements créés par la démo |
| `npm run generate:cr -- --id recXXXX` | Générer un CR pour une qualification existante |
| `npm run generate:report -- --mission recXXXX` | Générer le report hebdo d'une mission |

## Structure

```
prds/               PRDs par statut (01-draft → 04-complete)
src/
  prompts/          Prompts Claude (cr-system.md, cr-user.md, report-*.md)
  airtable/         Schema, seed data, script de setup
  scripts/          CLI : generate-cr.js, generate-report.js, demo-e2e.js
  portal/           Portail client Next.js (static export → GitHub Pages)
entretien.md        Guide de démo complet pour l'entretien
```

## Liens

- [Backlog & livrables](prds/01-draft/BACKLOG.md)
- [Guide de démo entretien](entretien.md)
