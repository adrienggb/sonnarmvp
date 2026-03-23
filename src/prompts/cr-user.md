# User prompt — CR d'entretien structuré

## Variables injectées

- `{{candidate_name}}` — Prénom et nom du candidat
- `{{candidate_title}}` — Titre actuel du candidat
- `{{candidate_company}}` — Entreprise actuelle du candidat
- `{{mission_name}}` — Intitulé de la mission
- `{{mission_criteria}}` — Description du profil cible (persona_target de la mission)
- `{{mission_salary_range}}` — Fourchette salariale de la mission
- `{{mission_location}}` — Localisation de la mission
- `{{interview_date}}` — Date de l'entretien (YYYY-MM-DD), utilisée pour calculer la disponibilité
- `{{transcript}}` — Transcription brute de l'entretien

---

## Prompt

Tu vas analyser l'entretien de qualification suivant et produire un CR structuré.

**Candidat :** {{candidate_name}} — {{candidate_title}} chez {{candidate_company}}

**Mission :** {{mission_name}}
**Profil cible :** {{mission_criteria}}
**Fourchette salariale :** {{mission_salary_range}}
**Localisation :** {{mission_location}}
**Date d'entretien :** {{interview_date}}

**Transcription :**
---
{{transcript}}
---

Produis le CR structuré en JSON. Évalue les forces et faiblesses du candidat par rapport aux critères de la mission ci-dessus. Pour calculer la date de disponibilité, pars de la date d'entretien fournie.
