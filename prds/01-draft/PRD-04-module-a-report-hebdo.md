# PRD-04 — Module A : Report client hebdomadaire automatisé

**Statut :** Draft
**Priorité :** P1
**Story points :** 8
**Dépendances :** PRD-00 (n8n + Gmail API), PRD-01 (KPI engine + pipeline_stage enum), PRD-03 (CR alimentent le contenu du report)
**Bloque :** Rien (livrable final)

---

## Problème

Chaque consultant passe 6-7h/semaine à produire manuellement le report client : compter les candidats par stage, screenshot Airtable, rédiger l'email, l'envoyer. Les KPIs sont self-reported (erreurs possibles), le format varie entre consultants, et le client n'a aucune visibilité entre deux envois.

## Objectif

Un workflow qui se déclenche chaque lundi matin, calcule automatiquement les KPIs depuis Airtable, génère un email professionnel via Claude, et le place en draft Gmail dans la boîte du consultant. Le consultant relit, ajuste si besoin, et envoie en 1 clic.

## Flux cible

```
Cron trigger — lundi 8h00
        ↓
Pour chaque mission active (report_frequency = weekly)
        ↓
Fetch pipeline records → calcul KPIs par stage (auto-dérivés)
Fetch CR de la semaine (qualifications créées depuis 7 jours)
        ↓
Claude API — prompt report → email HTML
        ↓
Créer draft Gmail dans la boîte du consultant assigné
Loguer dans Report_Log (mission, date, contenu, kpi_snapshot)
        ↓
Notif Slack : "X reports prêts à valider"
```

## Périmètre

### In scope

**Prompt (report-weekly-generation.md) :**
- System prompt : tonalité Sonnar (sobre, factuel, professionnel, pas d'emoji)
- Variables injectées : mission_name, client_name, consultant_name, week_label, kpis_this_week, kpis_last_week, candidates_met (avec résumés CR), actions_next_week (optionnel consultant)
- Output : corps email HTML (styles inline, prêt à être injecté dans Gmail)
- Section "Point d'attention" conditionnelle si un KPI dévie des benchmarks

**Workflow n8n (workflow-module-a-report.json) :**
- Cron trigger lundi 8h + mode on-demand (bouton manuel)
- Airtable : list missions actives filtrées sur `report_frequency = weekly`
- SplitInBatches : traitement 1 mission à la fois
- Code node : calcul KPIs par stage + deltas vs semaine précédente
- Airtable : fetch qualifications créées dans les 7 derniers jours
- HTTP Request : appel Claude API
- Gmail : créer draft (`to: client_email`, `from: consultant_email`)
- Airtable : créer record dans Report_Log
- Slack : notif groupée au consultant

**KPI engine (formules Airtable) :**
- Count par stage auto-calculé depuis Pipeline (dépend PRD-01)
- Delta hebdo : comparaison kpi_snapshot du dernier Report_Log

### Out of scope
- Envoi automatique sans validation consultant (trop risqué pour la relation client)
- Portail client temps réel intégré dans l'email (c'est PRD-02)
- Personnalisation du template par client
- Report bi-mensuel (weekly uniquement en MVP)

## Décision clé : Draft Gmail, pas envoi direct

Le consultant valide avant envoi. Raisons :
1. Préserver la relation client (un mauvais report peut nuire)
2. Permettre les ajustements de ton ou de contexte
3. Le flag `consultant_edited` dans Report_Log mesure la qualité IA dans le temps

## Edge cases critiques

| Cas | Comportement attendu |
|-----|----------------------|
| Aucune activité cette semaine | Claude génère un email court qui le mentionne explicitement + explique (jours fériés, etc.) |
| Aucun CR cette semaine | La section "candidats rencontrés" dit "Aucun entretien cette semaine" — pas de section vide |
| Mission sans `client_email` | Skipper la mission, alerter sur Slack avec le nom de la mission |
| Claude API timeout | Loguer l'erreur dans Report_Log avec `status: failed`, alerter Slack |
| Gmail API erreur auth | Alerter Slack, ne pas perdre le contenu généré (logué dans Report_Log) |
| Plusieurs missions pour 1 consultant | Un draft séparé par mission (pas de merge) |

## Critères d'acceptance

- [ ] Le cron se déclenche chaque lundi à 8h00 et traite toutes les missions actives
- [ ] Les KPIs sont auto-calculés depuis Airtable (zéro saisie manuelle)
- [ ] Un draft Gmail est créé dans la boîte du consultant avec le bon destinataire et sujet
- [ ] Le contenu de l'email est professionnel et cohérent avec les données Airtable
- [ ] Chaque report est loggué dans Report_Log avec le kpi_snapshot
- [ ] Le workflow gère silencieusement les missions sans activité (pas d'erreur)
- [ ] Testé en mode on-demand sur les 3 missions du seed data

## Métriques de succès

- Temps consultant par report : 6-7h → < 10 min (lecture + envoi)
- Taux de reports envoyés sans modification : mesurer (target : > 70% après 4 semaines)
- Taux d'erreurs workflow : < 5% des exécutions

## Story points : 8

| Tâche | Points |
|-------|--------|
| Rédaction + calibrage prompt report (itérations) | 2 |
| Workflow n8n : cron → KPIs → Claude → Gmail draft | 3 |
| KPI delta (comparaison vs semaine précédente) | 1 |
| Gmail API setup (OAuth2 dans n8n) | 1 |
| Tests end-to-end + edge cases | 1 |
