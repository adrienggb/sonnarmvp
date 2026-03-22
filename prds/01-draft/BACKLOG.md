# Backlog — Sonnar Automated Reporting

## Résumé

| PRD | Titre | Priorité | Points | Statut |
|-----|-------|----------|--------|--------|
| PRD-00 | Setup Projet & Infrastructure | P0 | 5 | **Complete** |
| PRD-01 | Data Model & Normalisation Airtable | P0 | 5 | **Complete** |
| PRD-02 | Portail Client (GitHub Pages) | P1 | 5 | Draft |
| PRD-03 | Module B — CR d'entretien IA | P1 | 8 | Draft |
| PRD-04 | Module A — Report hebdo automatisé | P1 | 8 | Draft |
| **Total** | | | **31 pts** | 10 pts livrés ✓ |

---

## Graphe de dépendances

```
PRD-00 (Setup)        ✓ Complete
    ├── PRD-01 (Data Model)          ✓ Complete
    │       ├── PRD-03 (Module B CR)     ← prêt à démarrer
    │       │       └── PRD-04 (Module A Report)
    │       └── PRD-04 (Module A Report)
    └── PRD-02 (Portail Client)      ← parallélisable avec PRD-03
```

**Chemin critique :** ~~PRD-00 → PRD-01~~ → PRD-03 → PRD-04

PRD-02 et PRD-03 peuvent démarrer immédiatement.

---

## Séquence recommandée

### Sprint 1 — Fondations (10 pts) ✓ TERMINÉ
**PRD-00** (5 pts) + **PRD-01** (5 pts)

Livrable : base Airtable complète (6 tables, schéma propre, seed data réaliste), repo GitHub, pipeline_stage en enum strict, 4 consultants liés.

### Sprint 2 — Module B + Portail (13 pts) ← EN COURS
**PRD-03** (8 pts) + **PRD-02** (5 pts) — parallélisables.

Livrable : workflow CR fonctionnel sur les seed data + portail client déployé sur GitHub Pages.

### Sprint 3 — Module A (8 pts)
**PRD-04** (8 pts) — nécessite PRD-03 terminé.

Livrable : report hebdo généré automatiquement, draft Gmail créé, loggué dans Report_Log.

---

## Critères de passage Draft → Ready

Un PRD passe en `02-ready` quand :
- [ ] Les dépendances amont sont en `04-complete`
- [ ] Les critères d'acceptance sont validés et non-ambigus
- [ ] Les edge cases ont été revus
- [ ] L'estimation en story points est confirmée

Un PRD passe en `03-in-progress` quand :
- [ ] Il est en tête de sprint
- [ ] Toutes ses dépendances sont en `04-complete`
