# Backlog — Sonnar Automated Reporting

## Résumé

| PRD | Titre | Priorité | Points | Statut |
|-----|-------|----------|--------|--------|
| PRD-00 | Setup Projet & Infrastructure | P0 | 5 | **In Progress** |
| PRD-01 | Data Model & Normalisation Airtable | P0 | 5 | Draft |
| PRD-02 | Portail Client (GitHub Pages) | P1 | 5 | Draft |
| PRD-03 | Module B — CR d'entretien IA | P1 | 8 | Draft |
| PRD-04 | Module A — Report hebdo automatisé | P1 | 8 | Draft |
| **Total** | | | **29 pts** | |

---

## Graphe de dépendances

```
PRD-00 (Setup)
    ├── PRD-01 (Data Model)          ← BLOQUANT pour PRD-03 et PRD-04
    │       ├── PRD-03 (Module B CR)
    │       │       └── PRD-04 (Module A Report)
    │       └── PRD-04 (Module A Report)
    └── PRD-02 (Portail Client)      ← indépendant, parallélisable avec PRD-03
```

**Chemin critique :** PRD-00 → PRD-01 → PRD-03 → PRD-04

PRD-02 peut être développé en parallèle de PRD-03 dès que PRD-01 est terminé.

---

## Séquence recommandée

### Sprint 1 — Fondations (8 pts)
**PRD-00** (3 pts) + **PRD-01** (5 pts) — séquentiel, bloquant tout le reste.

Livrable : base Airtable peuplée, repo GitHub prêt, pipeline_stage en enum strict.

### Sprint 2 — Module B + Portail (13 pts)
**PRD-03** (8 pts) + **PRD-02** (5 pts) — parallélisables.

Livrable : workflow CR fonctionnel sur les seed data + portail client déployé sur GitHub Pages.

### Sprint 3 — Module A (8 pts)
**PRD-04** (8 pts) — nécessite PRD-01 et PRD-03 terminés.

Livrable : report hebdo généré automatiquement, draft Gmail créé, logué dans Report_Log.

---

## Critères de passage Draft → Ready

Un PRD passe en `02-ready` quand :
- [ ] Les dépendances amont sont en `03-in-progress` ou `04-complete`
- [ ] Les critères d'acceptance sont validés et non-ambigus
- [ ] Les edge cases ont été revus
- [ ] L'estimation en story points est confirmée

Un PRD passe en `03-in-progress` quand :
- [ ] Il est en tête de sprint
- [ ] Toutes ses dépendances sont en `04-complete`
