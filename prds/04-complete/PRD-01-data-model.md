# PRD-01 — Data Model & Normalisation Airtable

**Statut :** Complete
**Priorité :** P0
**Story points :** 5
**Dépendances :** PRD-00 (repo + base Airtable créée)
**Bloque :** PRD-03 (KPI engine), PRD-04 (report hebdo)

---

## Problème

Les KPIs du funnel sont aujourd'hui self-reported par les consultants : ils comptent manuellement les candidats à chaque stage et les saisissent dans l'email. C'est la source principale d'erreurs et d'inconsistances.

Pour automatiser les reports, les KPIs doivent être **dérivés automatiquement du système**, pas saisis. Cela nécessite que `pipeline_stage` soit un enum strict et que chaque changement soit horodaté.

## Objectif

Mettre en place le data model Airtable complet permettant l'auto-calcul des KPIs et l'injection automatique des CR. Zéro saisie manuelle de métriques.

## Périmètre

### In scope

**Tables créées avec le bon schéma dès l'origine (via API REST lors de PRD-00) :**

- **Missions** — `name`, `client_name`, `client_email`, `client_portal_url`, `report_frequency`, `last_report_sent_at`, `consultant` (linked), `status`, `persona_target`, `salary_range`, `location`
- **Candidates** — `name`, `linkedin_url`, `current_title`, `current_company`, `nb_direct_reports`, `availability_date`, `salary_current`, `salary_target`, `location`, `ai_extracted_fields_log`
- **Pipeline** — `mission` (linked), `candidate` (linked), `pipeline_stage` (Single Select strict 12 valeurs), `notes`
- **Qualifications** — `pipeline` (linked), `interview_date`, `raw_transcript`, `ai_generated_cr`, `ai_suggested_score`, `consultant_final_score`, `cr_source`, `consultant_edited`
- **Report_Log** — `mission` (linked), `sent_at`, `week_label`, `report_content`, `kpi_snapshot`, `consultant_edited`
- **Consultants** — `name`, `email`, `slack_user_id`

**Seed data :**
- 5 missions (4 actives, 1 en pause), assignées à 4 consultants
- 25 candidats répartis sur toutes les missions
- 25 entrées pipeline couvrant tous les stages (Sourced → Offer)
- 6 CRs avec transcripts réels, CR IA structuré (JSON), scores AI + consultant
- 2 Report_Log avec KPI snapshots
- 4 consultants liés à leurs missions respectives

### Out of scope
- Formules Rollup KPI dans l'UI Airtable — à configurer manuellement (post-seed)
- `stage_changed_at` (Last Modified Time filtré) — à configurer manuellement dans Airtable UI

## IDs de référence

| Table | ID Airtable |
|-------|-------------|
| Missions | tbldH8xdQhJFKHAw1 |
| Candidates | tblJH0uKC0KKg1vWP |
| Pipeline | tbltBuz3BsmF2fIax |
| Qualifications | tbluuI2nZsivxJqBr |
| Report_Log | tbloE6YACb1vaXKXL |
| Consultants | tblTOrn1NAvO2Yh0O |

Base ID : `appwgQqKsHf4Z1la7`

## Critères d'acceptance

- [x] `Pipeline Stage` est un Single Select avec exactement 12 valeurs (Sourced → Rejected)
- [x] Tous les champs Mission sont présents et typés correctement
- [x] Tous les champs Qualification sont présents (transcript, CR IA, scores, flags)
- [x] La table `Report_Log` existe avec tous ses champs
- [x] Les consultants sont créés et liés à leurs missions
- [x] `npm run seed` peuple la base complètement et de manière reproductible
- [ ] `stage_changed_at` (Last Modified Time sur `pipeline_stage`) — à configurer manuellement dans Airtable UI
- [ ] Formules Rollup KPI sur la vue Mission — à configurer manuellement dans Airtable UI

## Story points : 5

| Tâche | Points |
|-------|--------|
| Schéma complet 6 tables via API REST | 2 |
| Seed data 5 missions + 25 candidats + pipeline | 1 |
| CRs IA structurés + Report_Log | 1 |
| Consultants créés et liés aux missions | 1 |
