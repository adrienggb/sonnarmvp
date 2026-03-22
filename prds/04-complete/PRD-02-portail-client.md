# PRD-02 — Portail Client (GitHub Pages)

**Statut :** Complete
**Priorité :** P1
**Story points :** 8
**Dépendances :** PRD-00 (repo GitHub), PRD-01 (`pipeline_stage` en enum strict)
**Bloque :** Rien (livrable indépendant)

---

## Problème

Entre deux emails hebdo, le client n'a aucune visibilité sur sa mission. Il doit attendre le prochain report pour savoir où en est son pipeline. Cela génère des relances inutiles et dégrade la perception de service.

## Objectif

Un portail web statique, accessible via un lien unique partagé au client, qui affiche en temps réel l'état du funnel, les candidats présentés, et l'activité récente. Aucune connexion requise pour le client. Mise à jour automatique depuis Airtable.

## Périmètre

### In scope
- App Next.js avec export statique (`output: 'export'`), hébergeable sur GitHub Pages ou en local (`npx serve out/`)
- Paramétrage par query params : `?mission=recXXX&key=patXXX&base=appXXX`
- Affichage du funnel (12 stages, count par stage depuis Airtable API)
- Liste des candidats présentés (stage >= "Presented") : nom, titre, entreprise
- Mode démo avec données fictives si aucun param fourni
- Design avec shadcn/ui — composants Card, Badge, Separator, Skeleton (loading state)

### Out of scope
- Authentification (le lien = l'accès — acceptable pour MVP)
- Affichage des CR ou des transcriptions (données confidentielles)
- Fonctionnalités interactives (filtres, export)
- Server Components / API routes Next.js (incompatible avec static export)
- Timeline d'activité récente (reporter au PRD-05 si besoin)

## Décisions d'architecture

**Pourquoi Next.js + static export et pas HTML vanilla ?**
Choix client — shadcn/ui nécessite React. L'export statique (`next build` → dossier `out/`) génère un site 100% HTML/JS/CSS sans serveur. Compatible GitHub Pages et consultable en local avec `npx serve out/`.

**Hébergement local :**
```bash
cd src/portal
npm run build   # génère out/
npx serve out   # accessible sur http://localhost:3000
```

**Hébergement GitHub Pages :**
Activer GitHub Pages sur le dossier `out/` via une GitHub Action ou manuellement. L'app étant 100% statique, aucune contrainte côté hébergeur.

**Pourquoi l'API key en query param ?**
Pour le MVP avec données fictives, c'est acceptable. La PAT Airtable utilisée est en lecture seule sur la base de démo uniquement.

## Edge cases critiques

| Cas | Comportement attendu |
|-----|----------------------|
| Aucun param `?mission=` | Mode démo avec données fictives |
| API Airtable timeout / erreur | Afficher un état d'erreur explicite (pas d'écran blanc) |
| Mission sans candidats présentés | Afficher la section vide avec message "Aucun candidat présenté" |
| Pipeline Stage non reconnu | Ignorer le record, ne pas planter (`flatMap` → skip) |
| Build local sans Node.js | Documenté dans setup-guide.md |

## Critères d'acceptance

- [x] `npm run build` dans `src/portal/` génère un dossier `out/` sans erreur
- [x] `npx serve out` affiche le portail en local sur http://localhost:3000
- [x] Le funnel affiche le bon count par stage depuis Airtable
- [x] Les candidats présentés sont filtrés correctement (stage ∈ {Presented, E1, E2, E3, Offer, Accepted})
- [x] Le mode démo fonctionne sans paramètres (bannière "Mode démo" affichée)
- [x] Les états de chargement (Skeleton) sont affichés pendant le fetch
- [ ] Déployable sur GitHub Pages via `out/` (testé manuellement)

## Story points : 8

| Tâche | Points |
|-------|--------|
| Setup Next.js + shadcn/ui + config static export | 1 |
| Composants UI : KPI cards, funnel bar, candidats présentés | 2 |
| Fetch Airtable API + parsing pipeline stages | 2 |
| Mode démo + gestion erreurs + loading states | 1 |
| Build statique vérifié (`out/` généré) | 1 |
| Documentation setup-guide.md | 1 |

## Fichiers produits

```
src/portal/
├── next.config.ts              ← output: 'export', trailingSlash, images unoptimized
├── lib/
│   ├── airtable.ts             ← types + fetchMissionData() + fetchAllRecords()
│   ├── demo-data.ts            ← DEMO_DATA hardcoded
│   └── use-mission.ts          ← hook useMission() avec URL params
├── components/portal/
│   ├── KpiCards.tsx            ← 3 KPI cards avec skeleton
│   ├── FunnelBar.tsx           ← funnel groupé par étape avec badges
│   └── PresentedCandidates.tsx ← liste candidats shortlistés
└── app/
    ├── layout.tsx              ← metadata Sonnar, font Geist
    └── page.tsx                ← page principale client component
```
