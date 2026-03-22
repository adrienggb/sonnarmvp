Réinitialise la base Airtable de démo en supprimant tous les enregistrements existants puis en rejouant `npm run seed`.

Base ID : appwgQqKsHf4Z1la7
Tables à vider dans cet ordre (respecter les dépendances inversées) :
1. Report_Log
2. Qualifications
3. Pipeline
4. Candidates
5. Missions
6. Consultants

Pour chaque table :
- Récupère tous les record IDs via l'API Airtable (GET /v0/{baseId}/{table})
- Supprime par batch de 10 max (limite API Airtable)
- Utilise la clé depuis .env (AIRTABLE_API_KEY et AIRTABLE_BASE_ID)

Puis lance : npm run seed

Affiche un résumé du nombre de records supprimés et recréés par table.
