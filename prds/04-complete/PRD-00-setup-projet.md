# PRD-00 — Setup Projet & Infrastructure

**Statut :** Complete
**Priorité :** P0
**Story points :** 5
**Dépendances :** Aucune (point de départ)
**Bloque :** PRD-01, PRD-02, PRD-03, PRD-04

---

## Problème

Le projet n'a pas de structure commune. Sans ça, impossible de collaborer, de versionner les prompts, d'importer les workflows n8n, ni de déployer le portail client.

## Objectif

Mettre en place l'arborescence projet, les outils locaux, et la base Airtable de démo peuplée avec des données fictives réalistes. À la fin de ce PRD, n'importe qui peut cloner le repo et tester l'ensemble du système.

## Périmètre

### In scope
- Structure de dossiers (`prds/`, `src/`, `docs/`)
- `README.md`, `.env.example`, `.gitignore`, `package.json`
- `docs/demo-script.md` — script de narration pour l'entretien (quoi montrer, dans quel ordre, questions à anticiper)
- `git init` + premier commit + push GitHub
- Schema Airtable complet (6 tables, tous les champs du PRD principal)
- Seed data (3 missions, ~40 candidats, pipeline peuplé)
- Script `npm run seed` pour peupler la base via API

### Out of scope
- Déploiement cloud
- Credentials réels (chaque dev configure son `.env`)

## Data model Airtable

Tables créées : **Missions**, **Candidates**, **Pipeline**, **Qualifications**, **Report_Log**, **Consultants**

Base ID : `appwgQqKsHf4Z1la7`

| Table | ID Airtable |
|-------|-------------|
| Missions | tbldH8xdQhJFKHAw1 |
| Candidates | tblJH0uKC0KKg1vWP |
| Pipeline | tbltBuz3BsmF2fIax |
| Qualifications | tbluuI2nZsivxJqBr |
| Report_Log | tbloE6YACb1vaXKXL |
| Consultants | tblTOrn1NAvO2Yh0O |

Champ critique :
- `Pipeline Stage` → Single Select strict (12 valeurs : Sourced, Contacted, Responded, Call Done, Qualified, Presented, E1, E2, E3, Offer, Accepted, Rejected) ✓ créé via API

## Critères d'acceptance

- [x] `npm install` passe sans erreur
- [x] `npm run seed` peuple la base Airtable avec 3 missions et ~40 candidats
- [x] `Pipeline Stage` est un Single Select strict dans Airtable (créé via API REST)
- [x] `.env.example` documente toutes les variables nécessaires
- [x] `docs/demo-script.md` rédigé avec narration 10 min et questions anticipées
- [x] `git init` fait, `.gitignore` en place, premier commit propre
- [ ] Le repo est pushé sur GitHub ← à faire manuellement (créer le repo GitHub puis `git remote add origin <url> && git push -u origin main`)

## Story points : 5

| Tâche | Points |
|-------|--------|
| Structure dossiers + fichiers config + git init | 1 |
| Schema Airtable (6 tables créées via API REST) | 1 |
| Seed data JSON + script Node.js | 1 |
| `docs/demo-script.md` | 1 |
| Push GitHub + vérification `.gitignore` | 1 |
