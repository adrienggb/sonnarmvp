# Script de démo — Entretien Sonnar (10 min)

## Contexte

L'objectif est de montrer en 10 minutes : la compréhension du problème, les choix techniques, et un artefact live. Pas besoin de tout montrer — choisir 1-2 points forts selon le profil de l'interlocuteur.

---

## Acte 1 — Le problème (2 min)

**Ouvrir :** `prds/03-in-progress/prd-automated-reporting.html` → onglet **Overview**

> "Sonnar a un problème concret : chaque consultant passe 10h par semaine sur du reporting manuel. Sur 12 consultants, c'est 100h perdues chaque semaine — l'équivalent de 2,5 ETP. J'ai décomposé ça en deux pains distincts..."

Montrer les deux cards **Pain A** et **Pain B**.

> "Pain A : le report client hebdo. KPIs saisis à la main, format inconsistant, aucune visibilité client entre deux envois. Pain B : le CR d'entretien. 3-4h par entretien, qualité variable, champs structurés rarement remplis."

**Message :** je comprends le problème métier avant de parler de solution.

---

## Acte 2 — L'architecture (3 min)

**Ouvrir :** onglet **Architecture**

> "La solution c'est deux modules sur une stack commune. Je vais vous montrer le Module B d'abord parce qu'il est plus simple et il démontre la logique."

Tracer le flux Module B avec le curseur :

> "Le consultant colle la transcription dans un formulaire Airtable. n8n reçoit ça via webhook, fetch les critères de la mission depuis Airtable, construit le prompt, appelle Claude API. Claude retourne un JSON structuré avec le CR, les forces/faiblesses, une recommandation go/no-go, et les champs extraits — salaire, dispo, scope managérial. n8n injecte tout ça directement dans Airtable. Le consultant relit en 5 minutes au lieu de 3-4h."

**Question probable :** *Pourquoi n8n et pas Make ou Zapier ?*
> "Coût et flexibilité. n8n self-hosted tourne en local pour la démo, en prod sur un VPS à 5€/mois. Les noeuds Code permettent du JS arbitraire — ici j'en ai besoin pour le fallback si Claude retourne du JSON malformé. Et les workflows sont exportés en JSON, versionnables dans le repo."

---

## Acte 3 — Live (3 min)

**Option A — Portail client (si GitHub Pages déployé)**

Ouvrir l'URL GitHub Pages en mode démo.

> "Voici ce que voit le client — pas à l'attente du prochain email. Le funnel en temps réel, les candidats présentés, l'activité récente. Mise à jour automatique depuis Airtable. Zéro infra : une page HTML servie par GitHub Pages, données fetchées depuis l'API Airtable."

**Option B — Webhook en live (si n8n tourne)**

```bash
curl -X POST http://localhost:5678/webhook/cr-generation \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Julien a passé 4 ans chez Stripe comme Director EMEA...",
    "mission_id": "recXXX",
    "candidate_id": "recXXX",
    "candidate_name": "Julien Favre"
  }'
```

> "Je déclenche le webhook manuellement. En 10-15 secondes, Claude a structuré le CR et il est injecté dans Airtable."

Ouvrir Airtable et montrer le record mis à jour.

---

## Acte 4 — Ce que j'ai appris (2 min)

> "Trois décisions qui ont compté..."

**1. Draft Gmail, pas envoi direct.**
> "La tentation c'est d'automatiser complètement. Mais un mauvais report client peut abîmer une relation. Le draft préserve le contrôle humain — et le flag `consultant_edited` dans le Report Log me permet de mesurer la qualité IA dans le temps."

**2. Le prérequis bloquant : `pipeline_stage` en enum strict.**
> "Tout le KPI engine repose là-dessus. Aujourd'hui c'est du texte libre dans Airtable — impossible de compter automatiquement. C'est la première chose à migrer avant de toucher à quoi que ce soit."

**3. Le fallback de parsing Claude.**
> "Claude retourne du JSON, mais pas toujours parfaitement formaté. J'ai un noeud Code dans n8n qui catch les erreurs de parsing, sauvegarde le raw text, et flag `parse_error: true`. Sans ça, un mauvais retour fait planter silencieusement le workflow."

---

## Questions anticipées

| Question | Réponse courte |
|----------|---------------|
| Coût total ? | ~70-100€/mois — n8n (20€) + Claude API usage (50-80€ pour ~200 CR + 50 reports) |
| Pourquoi Claude et pas GPT-4 ? | Qualité sur le français, structured outputs plus fiables sur les longues transcriptions |
| Qu'est-ce qui est hors scope MVP ? | Intégration Metaview/Grain (transcription auto), feedback loop pour améliorer les prompts, authentification sur le portail client |
| Délai de déploiement en prod ? | 3-4 semaines — cf. le backlog des PRDs avec les 29 story points |
| Et si le consultant ne valide pas ? | Le draft reste dans Gmail, le Report Log est loggué avec `consultant_edited: false`. On peut relancer |

---

## Checklist avant la démo

- [ ] Base Airtable de démo peuplée (`npm run seed`)
- [ ] n8n lancé en local (`npx n8n`) avec les deux workflows importés
- [ ] Portail client accessible (GitHub Pages ou `open src/portal/index.html`)
- [ ] `.env` configuré avec les vraies clés de démo
- [ ] PRD ouvert dans le browser sur l'onglet Overview
