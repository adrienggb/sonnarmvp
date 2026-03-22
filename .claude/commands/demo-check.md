Vérifie que tout est prêt pour la démo Sonnar en 10 minutes.

Checklist à exécuter dans l'ordre :

1. **Base Airtable** — appeler GET /v0/appwgQqKsHf4Z1la7/Missions avec la clé .env et vérifier que des records existent
2. **Variables .env** — vérifier que AIRTABLE_API_KEY, AIRTABLE_BASE_ID et CLAUDE_API_KEY sont présentes et non vides
3. **Seed data** — vérifier qu'il y a bien des records dans Pipeline, Qualifications et Report_Log
4. **Portail client** — vérifier que src/portal/index.html existe
5. **n8n workflows** — vérifier que src/n8n/ contient au moins un fichier .json
6. **Prompts** — vérifier que src/prompts/ contient les fichiers system/user pour CR et report

Pour chaque check : affiche ✓ ou ✗ avec un message d'action corrective si ✗.

Termine par : "Démo prête ✓" ou "X point(s) à corriger avant la démo."
