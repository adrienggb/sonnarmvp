# PRD-04 — Module A : Report client hebdomadaire automatisé

**Statut :** Complete
**Priorité :** P1
**Story points :** 8
**Dépendances :** PRD-01 (KPI engine + pipeline_stage enum), PRD-03 (CR alimentent le contenu du report)
**Bloque :** Rien (livrable final)

> **Note MVP (entretien) :** Scope adapté. CLI + portail uniquement (pas n8n, pas Gmail). Le draft est affiché dans le portail client.

---

## Problème

Chaque consultant passe 6-7h/semaine à produire manuellement le report client : compter les candidats par stage, rédiger l'email, l'envoyer. Les KPIs sont self-reported (erreurs possibles), le format varie entre consultants.

## Objectif

Un script CLI qui calcule automatiquement les KPIs depuis Airtable, génère un report professionnel via Claude (Ollama local), et le stocke dans Report_Log. Le portail client affiche ce report dans un onglet dédié.

## Flux cible (MVP)

```
CLI : node src/scripts/generate-report.js --mission recXXXX
        ↓
Fetch pipeline records (client-side filter) → calcul KPIs par stage
Fetch CRs de la semaine (< 7 jours, client-side filter)
        ↓
Ollama local (qwen2.5:7b) → texte markdown structuré
        ↓
Créer record Report_Log (mission, week_label, report_content, kpi_snapshot)
        ↓
Portail client : onglet "Report" affiche le dernier Report_Log
```

## Périmètre

### In scope

- `report-system.md` + `report-user.md` : prompts Sonnar (sobre, factuel, professionnel)
- `generate-report.js` : CLI script (fetch KPIs + CRs + Ollama + POST Report_Log)
- Onglet "Report" portail : affiche week_label, KPI badges, report markdown

### Out of scope
- Envoi Gmail (choix délibéré MVP)
- n8n workflow
- Cron trigger automatique
- Delta KPI vs semaine précédente

## Edge cases critiques

| Cas | Comportement attendu |
|-----|----------------------|
| Aucune activité cette semaine | Report généré avec mention explicite + KPIs à zéro |
| Aucun CR cette semaine | Section "Candidats rencontrés" = "Aucun entretien cette semaine" |
| Mission sans pipeline records | Report généré mais mention "aucun candidat actif" |
| Ollama absent | Fallback OpenRouter puis Anthropic |
| Newlines littéraux dans JSON | parseJson() fallback avec remplacement \\n |

## Critères d'acceptance

- [x] `node src/scripts/generate-report.js --mission recXXXX` génère un report en < 60s
- [x] Les KPIs sont auto-calculés depuis Airtable (count par stage)
- [x] Le report est stocké dans Report_Log avec kpi_snapshot JSON
- [x] Le contenu du report est professionnel et cohérent avec les données
- [x] L'onglet "Report" du portail affiche le dernier Report_Log de la mission
- [x] Les KPIs sont affichés sous forme de badges dans le portail
- [x] Testé sur la mission VP Sales Fintech (rec6RAvzkYERdNS2w) — 7 candidats actifs, 1 entretien semaine, report créé dans Airtable

## Notes d'implémentation

- Filtres Airtable ne fonctionnent pas sur les champs linked record → fetch all + filter client-side
- qwen2.5:7b génère parfois des newlines littéraux dans les JSON strings → parseJson() gère ce cas
- Le portail affiche les données démo avec DEMO_REPORT quand pas de paramètres URL
- `npm run generate:report -- --mission recXXXX` fonctionne aussi

## Story points : 8

| Tâche | Points |
|-------|--------|
| Rédaction + calibrage prompt report | 2 |
| Script generate-report.js (fetch KPIs + CRs + Ollama) | 3 |
| Onglet "Report" dans le portail Next.js | 2 |
| Tests end-to-end | 1 |
