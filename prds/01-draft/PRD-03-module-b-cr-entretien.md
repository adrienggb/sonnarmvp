# PRD-03 — Module B : CR d'entretien structuré (IA)

**Statut :** Draft
**Priorité :** P1
**Story points :** 8
**Dépendances :** PRD-00 (n8n local + Claude API key), PRD-01 (champs Qualification créés)
**Bloque :** PRD-04 (les CR alimentent le résumé du report hebdo)

---

## Problème

Chaque CR d'entretien prend 3-4h au consultant : enregistrement → transcription → ChatGPT → reformatage manuel → copie dans Airtable. Le résultat est inconsistant (qualité variable, structure non-imposée, champs structurés rarement remplis).

## Objectif

Un workflow qui prend une transcription en entrée et injecte automatiquement dans Airtable un CR structuré + les champs candidat extraits (salaire, dispo, scope managérial). Le consultant ne relit et valide qu'en 5 minutes.

## Flux cible

```
Consultant colle la transcription (formulaire Airtable)
        ↓
Webhook n8n reçoit (transcript + mission_id + candidate_id)
        ↓
Fetch critères mission depuis Airtable
        ↓
Claude API — prompt structuré → JSON
        ↓
Parse + validation du JSON (fallback si malformé)
        ↓
Update Qualification (ai_generated_cr, ai_suggested_score, cr_source)
Update Candidate (salary, availability, nb_direct_reports, location)
        ↓
Notification consultant : "CR prêt, à valider"
```

## Périmètre

### In scope

**Prompt (cr-structuration.md) :**
- System prompt : persona consultant recrutement executive search
- User prompt : transcription + critères mission en variables injectées
- Output JSON strict : `{ summary, motivations, strengths[], weaknesses[], recommendation, suggested_score, extracted_fields: { salary_current, salary_target, availability_date, location, nb_direct_reports, aspirations } }`

**Workflow n8n (workflow-module-b-cr.json) :**
- Webhook trigger (POST)
- Noeud Airtable : fetch mission criteria
- Noeud Code : build prompt avec variables
- Noeud HTTP Request : appel Claude API (claude-sonnet-4-6)
- Noeud Code : parse JSON + fallback si erreur (sauvegarder le raw output, flag `parse_error`)
- Noeud Airtable × 2 : update Qualification + update Candidate
- Noeud Slack (optionnel) : notif consultant

**Interface d'input (v1) :**
- Formulaire Airtable basique : 3 champs (transcript, mission, candidat) + 1 bouton
- Déclenche le webhook n8n via un script d'automatisation Airtable

### Out of scope
- Intégration Metaview/Grain pour la transcription auto (v2)
- Interface custom (non-Airtable)
- Feedback loop prompt (amélioration continue post-MVP)
- Multi-langue (transcriptions en français uniquement)

## Edge cases critiques

| Cas | Comportement attendu |
|-----|----------------------|
| Claude retourne du JSON malformé | Sauvegarder le raw text dans `ai_generated_cr`, flaguer `parse_error: true`, notifier le consultant |
| Transcription trop courte (< 500 mots) | Claude retourne `data_quality: INSUFFISANTE`, le consultant est averti |
| Champ `suggested_score` absent | Mettre `null`, ne pas bloquer l'injection du CR |
| Timeout Claude API (> 30s) | Retry 1x, puis alerter sur Slack, ne pas perdre la transcription |
| Mission inconnue (mission_id invalide) | Retourner une erreur HTTP 400 claire au formulaire |

## Critères d'acceptance

- [ ] Le webhook reçoit une transcription et retourne un CR JSON en < 20s
- [ ] Le CR est injecté dans le bon Qualification record Airtable
- [ ] Les champs candidat extraits sont mis à jour (au moins salary + availability)
- [ ] Si Claude retourne du JSON invalide, le raw text est sauvegardé et `parse_error` est flagué
- [ ] Le score est marqué "suggéré par IA" — le consultant peut l'override sans déclencher le workflow
- [ ] Testé sur 3 transcriptions fictives du seed data avec résultats cohérents

## Métriques de succès

- Temps consultant par CR : 3-4h → < 15 min (lecture + validation)
- Taux de CR avec champs extraits complets : > 80%
- Taux d'override du score IA par le consultant : mesurer (proxy de qualité)

## Story points : 8

| Tâche | Points |
|-------|--------|
| Rédaction + calibrage prompt (itérations sur seed data) | 3 |
| Workflow n8n : webhook → Claude → parse → Airtable | 3 |
| Interface formulaire Airtable + déclenchement webhook | 1 |
| Tests end-to-end + edge cases | 1 |
