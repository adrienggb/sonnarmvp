# Backlog — Sonnar Automated Reporting

## Résumé

| PRD | Titre | Priorité | Points | Statut |
|-----|-------|----------|--------|--------|
| PRD-00 | Setup Projet & Infrastructure | P0 | 5 | **Complete** |
| PRD-01 | Data Model & Normalisation Airtable | P0 | 5 | **Complete** |
| PRD-02 | Portail Client (GitHub Pages) | P1 | 8 | **Complete** |
| PRD-03 | Module B — CR d'entretien IA | P1 | 8 | **Complete** |
| PRD-04 | Module A — Report hebdo automatisé | P1 | 8 | **Complete** |
| **Total** | | | **34 pts** | **34 pts livrés ✓** |

---

## Graphe de dépendances

```
PRD-00 (Setup)        ✓ Complete
    ├── PRD-01 (Data Model)          ✓ Complete
    │       ├── PRD-03 (Module B CR)     ✓ Complete
    │       │       └── PRD-04 (Module A Report) ✓ Complete
    │       └── PRD-04 (Module A Report)
    └── PRD-02 (Portail Client)      ✓ Complete
```

**Tous les PRDs sont terminés. Projet MVP complet.**

---

## Livrables finaux

### Module B — CR d'entretien (PRD-03)
- `src/prompts/cr-system.md` + `cr-user.md`
- `src/scripts/generate-cr.js` — génère un CR structuré JSON depuis une qualification Airtable
- `src/scripts/demo-e2e.js` — démo end-to-end reproductible
- Démo : `npm run demo` / `npm run demo:cleanup`

### Module A — Report hebdo (PRD-04)
- `src/prompts/report-system.md` + `report-user.md`
- `src/scripts/generate-report.js` — génère un report hebdo depuis le pipeline Airtable
- Portail : onglet "Report" affiche le dernier Report_Log (KPI badges + markdown)
- Usage : `npm run generate:report -- --mission recXXXX`

### Portail client (PRD-02)
- Next.js static export → GitHub Pages
- Onglet Pipeline : KPI cards, funnel bar, candidats en cours
- Onglet Report : report hebdo avec KPI badges et markdown
- URL démo : `https://adrienggb.github.io/SonnarMVP?missionId=rec6RAvzkYERdNS2w`
