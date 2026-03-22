# Sonnar — Automated Mission Reporting

> Eliminer les 10h/semaine de reporting manuel par consultant.
> Stack : Airtable · n8n · Claude API · GitHub Pages · Gmail

---

## Le problème

Chaque consultant Sonnar passe **10h/semaine** à produire manuellement des reports clients hebdo et des CR d'entretien. Sur 12 consultants, c'est **~100h/semaine** de travail à faible valeur ajoutée.

## La solution — 2 modules

**Module B — CR d'entretien structuré**
Consultant colle la transcription → n8n → Claude → CR + champs extraits injectés dans Airtable → validation en 5 min.

**Module A — Client Report hebdo automatisé**
n8n chaque lundi → KPIs auto-calculés depuis Airtable → Claude génère l'email → draft Gmail → consultant relit et envoie en 1 clic.

## Stack & coût

| Composant | Outil | Coût |
|-----------|-------|------|
| Base de données | Airtable | Existant |
| Orchestration | n8n (self-hosted) | ~20€/mois |
| Intelligence | Claude API (Sonnet) | ~50-80€/mois |
| Portail client | GitHub Pages | 0€ |
| Email | Gmail API | 0€ |
| **Total** | | **~70-100€/mois** |

## Démarrage rapide

```bash
npm install
cp .env.example .env   # remplir AIRTABLE_API_KEY, AIRTABLE_BASE_ID, CLAUDE_API_KEY
npm run seed           # peupler la base Airtable de démo
npx n8n                # lancer n8n en local → http://localhost:5678
```

## Structure

```
prds/               PRDs par statut (01-draft → 04-complete)
src/
  prompts/          Prompts Claude (Module A + B)
  n8n/              Workflows exportés en JSON
  airtable/         Schema, seed data, script de setup
  portal/           Portail client statique (GitHub Pages)
docs/               Architecture, setup guide, script de démo
```

## Liens

- [PRD principal](prds/03-in-progress/prd-automated-reporting.html)
- [Backlog](prds/01-draft/BACKLOG.md)
- [Guide de setup](docs/setup-guide.md)
- [Script de démo](docs/demo-script.md)
