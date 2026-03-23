# User prompt — Report client hebdomadaire

## Variables injectées

- `{{mission_name}}` — Intitulé de la mission
- `{{client_name}}` — Nom du client (entreprise)
- `{{week_label}}` — Label de la semaine (ex: "Semaine du 17 mars 2025")
- `{{report_date}}` — Date du report (YYYY-MM-DD)
- `{{kpis}}` — KPIs du pipeline au format JSON (counts par stage)
- `{{candidates_met}}` — Résumés des entretiens de la semaine (texte structuré ou "Aucun")

---

## Prompt

Tu vas rédiger le report hebdomadaire client pour la mission suivante.

**Mission :** {{mission_name}}
**Client :** {{client_name}}
**Période :** {{week_label}}
**Date :** {{report_date}}

**KPIs pipeline :**
```json
{{kpis}}
```

**Candidats rencontrés cette semaine :**
{{candidates_met}}

Produis le report structuré en JSON. Le body doit être en markdown avec les 4 sections obligatoires (Avancement, Pipeline actuel, Candidats rencontrés, Prochaines étapes). Sois factuel : utilise les chiffres KPI exacts fournis.
