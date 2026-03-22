# PRD-02 — Portail Client (GitHub Pages)

**Statut :** Draft
**Priorité :** P1
**Story points :** 5
**Dépendances :** PRD-00 (repo GitHub), PRD-01 (`pipeline_stage` en enum strict)
**Bloque :** Rien (livrable indépendant)

---

## Problème

Entre deux emails hebdo, le client n'a aucune visibilité sur sa mission. Il doit attendre le prochain report pour savoir où en est son pipeline. Cela génère des relances inutiles et dégrade la perception de service.

## Objectif

Un portail web statique, accessible via un lien unique partagé au client, qui affiche en temps réel l'état du funnel, les candidats présentés, et l'activité récente. Aucune connexion requise pour le client. Mise à jour automatique depuis Airtable.

## Périmètre

### In scope
- Page HTML/CSS/JS vanilla, hébergée sur GitHub Pages (gratuit)
- Paramétrage par query params : `?mission=recXXX&key=patXXX&base=appXXX`
- Affichage du funnel (12 stages, count par stage depuis Airtable API)
- Liste des candidats présentés (stage >= "Presented") : nom, titre, date de présentation
- Timeline de l'activité récente (derniers changements de stage)
- Mode démo avec données fictives si aucun param fourni
- Design system cohérent avec les PRDs existants (dark theme, DM Sans, JetBrains Mono)

### Out of scope
- Authentification (le lien = l'accès — acceptable pour MVP)
- Affichage des CR ou des transcriptions (données confidentielles)
- Fonctionnalités interactives (filtres, export)
- Version mobile optimisée (responsive basique suffit)

## Décisions d'architecture

**Pourquoi HTML statique et pas React ?**
Zéro build step, déployable directement sur GitHub Pages, maintenable sans toolchain JS. Le portail n'a pas besoin de state management complexe.

**Pourquoi l'API key en query param ?**
Pour le MVP avec données fictives, c'est acceptable. En production, il faudrait un proxy backend ou une Airtable Personal Access Token en lecture seule sur une base dédiée.

**Pourquoi GitHub Pages et pas Vercel/Netlify ?**
Coût zéro, pas de compte supplémentaire, déployé depuis le même repo que le reste du projet.

## Maquette des sections

```
[ SONNAR ]  Mission : VP Sales — Fintech         ● Live

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 32          │  │ 12          │  │ 4           │
│ Candidats   │  │ Qualifiés   │  │ Présentés   │
│ identifiés  │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘

── Pipeline candidats ──────────────────────────────

Sourced(8) → Contacted(6) → Responded(5) → Call Done(4)
→ Qualified(4) → Presented(4) → E1(2) → E2(1) → ...

── Candidats présentés ─────────────────────────────

Julien F.  Director of Sales EMEA · Stripe      14 mars
Camille N. VP Sales · Spendesk                  17 mars

── Activité récente ────────────────────────────────

19 mars  Antoine R. passé en Qualified
17 mars  Camille N. passée en Presented
```

## Critères d'acceptance

- [ ] La page se charge et affiche les données Airtable en < 2s
- [ ] Le funnel affiche le bon count par stage
- [ ] Les candidats présentés sont filtrés correctement (stage ≥ Presented)
- [ ] Le mode démo fonctionne sans paramètres (données fictives intégrées)
- [ ] La page est déployée sur GitHub Pages et accessible via URL publique
- [ ] Le design est cohérent avec le design system Sonnar (couleurs, fonts)

## Story points : 5

| Tâche | Points |
|-------|--------|
| HTML/CSS structure + design system | 1 |
| JS : fetch Airtable API + render funnel | 2 |
| JS : candidats présentés + timeline | 1 |
| Mode démo + déploiement GitHub Pages | 1 |
