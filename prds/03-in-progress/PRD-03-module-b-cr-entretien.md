# PRD-03 — Module B : CR d'entretien structuré (IA)

**Statut :** In Progress
**Priorité :** P1
**Story points :** 8
**Dépendances :** PRD-00 (Claude API key), PRD-01 (champs Qualification créés)
**Bloque :** PRD-04 (les CR alimentent le résumé du report hebdo)

---

## Problème

Chaque CR d'entretien prend 3-4h au consultant : enregistrement → transcription → ChatGPT → reformatage manuel → copie dans Airtable. Le résultat est inconsistant (qualité variable, structure non-imposée, champs structurés rarement remplis).

## Objectif

Un script CLI qui prend un `qualification_id` Airtable en entrée, fetch les données, appelle Claude API, et injecte automatiquement un CR structuré + les champs candidat extraits. Le consultant ne relit et valide qu'en 5 minutes.

## Flux cible

```
Consultant note le qualification_id dans Airtable
        ↓
npm run generate:cr -- --id recXXXX
        ↓
Fetch transcript + critères mission depuis Airtable
        ↓
Claude API — prompt structuré → JSON
        ↓
Parse + validation du JSON (fallback si malformé)
        ↓
PATCH Qualification (ai_generated_cr, ai_suggested_score, cr_source)
PATCH Candidate (salary_current, salary_target, availability_date, nb_direct_reports)
        ↓
Log résultat dans le terminal
```

## Décisions d'architecture

**Pourquoi script CLI et pas n8n ?**
MVP entretien — n8n est une UI graphique non scriptable, complexe à configurer et à démontrer. Un script Node.js est suffisant pour valider le workflow et démontrable en 30s. N8n viendra en V1 réelle avec webhook, retry automatique et monitoring.

**Pourquoi pas d'interface custom ?**
L'input se fait via Airtable directement (le consultant copie-colle la transcription dans le champ `transcript` du record Qualification). Le script est déclenché manuellement depuis le terminal pour le MVP.

## Périmètre

### In scope

**Prompts (`src/prompts/`) :**
- `cr-system.md` — persona consultant executive search, règles de structuration
- `cr-user.md` — template avec variables injectées : `{{transcript}}`, `{{mission_name}}`, `{{mission_criteria}}`, `{{candidate_name}}`, `{{candidate_title}}`
- Output JSON strict : `{ summary, motivations, strengths[], weaknesses[], recommendation, suggested_score, data_quality, extracted_fields: { salary_current, salary_target, availability_date, location, nb_direct_reports } }`

**Script CLI (`src/scripts/generate-cr.js`) :**
- `node generate-cr.js --id recXXXX` (ou `npm run generate:cr -- --id recXXXX`)
- Fetch Qualification + Candidate + Mission depuis Airtable
- Build prompt + appel Claude API (claude-opus-4-6, streaming)
- Parse JSON response + fallback si malformé
- PATCH Qualification + Candidate dans Airtable
- Output terminal coloré : CR résumé + champs extraits + score

**Script de test (`npm run test:prompt-cr`) :**
- Charge les seed data depuis `src/airtable/seed-data.json`
- Appelle Claude API sans Airtable (boucle hors réseau)
- Permet d'itérer sur les prompts rapidement

### Out of scope
- Interface n8n / webhook (V1 réelle)
- Transcription automatique Metaview/Grain (V2)
- Interface consultant custom (V2)
- Feedback loop prompt / amélioration continue (V2)
- Multi-langue (français uniquement)

## Edge cases critiques

| Cas | Comportement attendu |
|-----|----------------------|
| Claude retourne du JSON malformé | Sauvegarder le raw text dans `ai_generated_cr`, flaguer `parse_error: true` dans le terminal |
| Transcription absente ou < 200 mots | Arrêter avec erreur claire, ne pas appeler Claude |
| Champ `suggested_score` absent du JSON | Mettre `null`, ne pas bloquer l'injection |
| Timeout Claude API | Retry 1x avec backoff 5s, puis exit avec message d'erreur |
| `qualification_id` invalide | Exit 1 avec message d'erreur Airtable |

## Critères d'acceptance

- [ ] `npm run test:prompt-cr` produit un CR JSON valide sur les seed data sans appel Airtable
- [ ] `node generate-cr.js --id recXXXX` injecte le CR dans le bon record Qualification
- [ ] Les champs candidat extraits sont mis à jour (salary_current + availability_date minimum)
- [ ] Si JSON malformé, le raw text est sauvegardé et `parse_error` est loggué
- [ ] Testé sur 3 qualification_ids du seed data avec résultats cohérents
- [ ] Le prompt est en `src/prompts/cr-system.md` + `src/prompts/cr-user.md`

## Story points : 8

| Tâche | Points |
|-------|--------|
| Rédaction + calibrage prompt (itérations sur seed data) | 3 |
| Script CLI generate-cr.js (fetch → Claude → parse → patch) | 3 |
| Script de test npm run test:prompt-cr | 1 |
| Tests end-to-end sur seed data + edge cases | 1 |
