# PRD-01 — Data Model & Normalisation Airtable

**Statut :** Draft
**Priorité :** P0
**Story points :** 5
**Dépendances :** PRD-00 (repo + base Airtable créée)
**Bloque :** PRD-03 (KPI engine), PRD-04 (report hebdo)

---

## Problème

Les KPIs du funnel sont aujourd'hui self-reported par les consultants : ils comptent manuellement les candidats à chaque stage et les saisissent dans l'email. C'est la source principale d'erreurs et d'inconsistances.

Pour automatiser les reports, les KPIs doivent être **dérivés automatiquement du système**, pas saisis. Cela nécessite que `pipeline_stage` soit un enum strict et que chaque changement soit horodaté.

## Objectif

Migrer le data model Airtable vers un schéma qui permet l'auto-calcul des KPIs et l'injection automatique des CR. Zéro saisie manuelle de métriques après cette migration.

## Périmètre

### In scope

**Migrations sur les tables existantes :**
- `pipeline_stage` : texte libre → Single Select (12 valeurs fixes)
- Ajout `stage_changed_at` (Last Modified Time filtré sur `pipeline_stage`)
- Ajout sur **Mission** : `client_email`, `client_portal_url`, `report_frequency`, `last_report_sent_at`
- Ajout sur **Qualification** : `raw_transcript`, `ai_generated_cr`, `ai_suggested_score`, `consultant_final_score`, `cr_source`, `consultant_edited`
- Ajout sur **Candidate** : `nb_direct_reports`, `availability_date`, `ai_extracted_fields_log`

**Nouvelle table :**
- `Report_Log` : `mission_id`, `sent_at`, `week_label`, `report_content`, `kpi_snapshot`, `consultant_edited`

**Formules KPI (Rollup sur Mission) :**
- Count par stage (nb_sourced, nb_contacted, …, nb_presented)
- Taux de conversion : contacted→responded, call_done→qualified, qualified→presented

### Out of scope
- Interface Airtable (UI pour les consultants) — hors MVP
- Historique des stages (audit trail complet) — post-MVP

## Risques

- **Migration des données existantes** : si `pipeline_stage` contient du texte libre non-standard, la migration peut perdre des valeurs. Stratégie : exporter les valeurs actuelles, mapper manuellement, puis appliquer.
- **Rollup counts** : les formules Airtable de count par stage nécessitent une table liée correctement — à valider sur la base réelle.

## Critères d'acceptance

- [ ] `pipeline_stage` est un Single Select avec exactement 12 valeurs
- [ ] Aucune donnée existante n'est perdue lors de la migration
- [ ] `stage_changed_at` se met à jour automatiquement quand `pipeline_stage` change
- [ ] Les 4 champs Mission sont présents et typés correctement
- [ ] Les 6 champs Qualification sont présents
- [ ] La table `Report_Log` existe avec tous ses champs
- [ ] Au moins 3 formules Rollup KPI fonctionnelles sur la vue Mission

## Story points : 5

| Tâche | Points |
|-------|--------|
| Migration `pipeline_stage` + mapping données existantes | 2 |
| Ajout des champs sur Mission, Qualification, Candidate | 1 |
| Création table Report_Log | 1 |
| Formules Rollup KPI sur Mission | 1 |
