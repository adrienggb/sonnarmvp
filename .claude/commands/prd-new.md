Crée un nouveau PRD dans prds/01-draft/ à partir du template standard.

Si des arguments sont fournis, utilise-les. Sinon, demande :
- Titre du PRD
- Priorité (P0 / P1 / P2)
- Dépendances (numéros de PRD)
- Estimation en story points

Le numéro du PRD est auto-incrémenté : lit les fichiers existants dans tous les dossiers prds/ et prend le max + 1.

Le fichier créé doit respecter exactement la structure CLAUDE.md :
- Toutes les sections obligatoires (Problème, Objectif, Périmètre, Edge cases critiques, Critères d'acceptance, Story points)
- Statut : Draft
- Champs Bloque : à remplir si connu

Après création, affiche le chemin du fichier et rappelle les prochaines étapes pour le passer en Ready.
