# CLAUDE.md — Sonnar Automated Reporting

Instructions de travail pour Claude Code sur ce projet. À lire en entier avant toute action.

---

## Contexte projet

**Sonnar** est un cabinet de recrutement executive search. Ce projet automatise deux workflows manuels coûteux :
- **Module B** — CR d'entretien : 3-4h → 15 min par entretien
- **Module A** — Report client hebdo : 6-7h → 10 min par semaine

Stack : Airtable (données) · n8n (orchestration) · Claude API (génération) · GitHub Pages (portail client) · Gmail API (envoi)

Contexte d'usage : **projet d'entretien**. Chaque artefact produit doit être présentable et explicable en entretien.

---

## Méthode de travail — PRD first

**Règle absolue : ne jamais créer de fichier d'implémentation sans PRD correspondant en `03-in-progress`.**

### Cycle de vie d'un PRD

```
01-draft → 02-ready → 03-in-progress → 04-complete
```

| Statut | Condition de passage |
|--------|----------------------|
| `01-draft` | PRD rédigé, non encore validé |
| `02-ready` | Critères d'acceptance non-ambigus, dépendances identifiées, story points confirmés |
| `03-in-progress` | Toutes les dépendances sont en `04-complete`, implémentation démarrée |
| `04-complete` | Tous les critères d'acceptance cochés, code mergé |

### Structure d'un PRD (obligatoire)

Chaque PRD doit contenir exactement ces sections :

```markdown
# PRD-XX — Titre

**Statut :** Draft | Ready | In Progress | Complete
**Priorité :** P0 | P1 | P2
**Story points :** N
**Dépendances :** PRD-XX, PRD-XX
**Bloque :** PRD-XX, PRD-XX

## Problème
## Objectif
## Périmètre
### In scope
### Out of scope
## Edge cases critiques  (tableau Cas / Comportement attendu)
## Critères d'acceptance  (checkboxes)
## Story points  (tableau tâches / points)
```

### Nommage des fichiers PRD

```
PRD-00-setup-projet.md
PRD-01-data-model.md
PRD-02-portail-client.md
PRD-03-module-b-cr-entretien.md
PRD-04-module-a-report-hebdo.md
```

Numérotation croissante dans l'ordre de création. Pas de renommage une fois créé.

---

## Structure du projet

```
/
├── CLAUDE.md               ← ce fichier
├── BACKLOG.md              ← synthèse globale (copie du prds/01-draft/BACKLOG.md)
├── README.md               ← point d'entrée public
├── .env.example            ← toutes les variables, aucune valeur réelle
├── .gitignore
├── package.json
│
├── prds/
│   ├── 01-draft/           ← PRDs en cours de rédaction
│   ├── 02-ready/           ← PRDs validés, prêts à implémenter
│   ├── 03-in-progress/     ← PRD en cours d'implémentation (1 max à la fois)
│   └── 04-complete/        ← PRDs terminés (ne pas modifier)
│
├── src/
│   ├── prompts/            ← prompts Claude en .md (system + user séparés)
│   ├── n8n/                ← workflows exportés en .json + README d'import
│   ├── airtable/           ← schema.md + seed-data.json + setup-script.js
│   └── portal/             ← HTML/CSS/JS vanilla (GitHub Pages)
│
└── docs/
    ├── architecture.md     ← flux de données, décisions d'archi
    ├── setup-guide.md      ← guide de setup complet
    └── demo-script.md      ← script de narration pour l'entretien
```

---

## Backlog actuel

| PRD | Titre | Priorité | Points | Statut |
|-----|-------|----------|--------|--------|
| PRD-00 | Setup Projet & Infrastructure | P0 | 3 | Draft |
| PRD-01 | Data Model & Normalisation Airtable | P0 | 5 | Draft |
| PRD-02 | Portail Client (GitHub Pages) | P1 | 5 | Draft |
| PRD-03 | Module B — CR d'entretien IA | P1 | 8 | Draft |
| PRD-04 | Module A — Report hebdo automatisé | P1 | 8 | Draft |

**Chemin critique :** PRD-00 → PRD-01 → PRD-03 → PRD-04
**Parallélisable :** PRD-02 avec PRD-03 (dès PRD-01 terminé)

---

## Conventions de code

### Général
- **Langue** : code en anglais (variables, fonctions, commentaires), PRDs et docs en français
- **Pas de TypeScript** pour le MVP — JS vanilla uniquement (portail client + scripts)
- **Pas de framework** côté portail client — HTML/CSS/JS vanilla, zéro build step
- **Pas de commentaires évidents** — commenter uniquement ce qui n'est pas auto-explicite

### JavaScript (scripts Airtable, portal/app.js)
- `const` par défaut, `let` si réassignation nécessaire, jamais `var`
- Fonctions nommées, pas de fonctions fléchées anonymes imbriquées
- Erreurs explicites : `throw new Error('message clair')` — pas de `console.error` silencieux
- `async/await` uniquement, pas de `.then()` chaîné

### Prompts Claude (src/prompts/)
- Un fichier `*-system.md` (system prompt) + un fichier `*-user.md` (user prompt) par module
- Les variables injectées sont documentées en haut du fichier sous `## Variables injectées`
- Le format de sortie attendu (JSON schema) est dans le prompt user, pas dans le system
- Ne jamais mettre de credentials ou de données réelles dans les prompts

### Workflows n8n (src/n8n/)
- Exportés via l'UI n8n (File > Download) — pas écrits à la main
- Un fichier par workflow, nommé `workflow-module-[a|b]-*.json`
- Toujours inclure un noeud de fallback pour les erreurs Claude API (parse_error flag)
- Les credentials sont référencés par nom (`$env.CLAUDE_API_KEY`), jamais en dur

### Airtable
- `pipeline_stage` est toujours un Single Select — jamais de texte libre
- Les champs IA sont préfixés `ai_` : `ai_generated_cr`, `ai_suggested_score`
- Les champs consultant sont préfixés `consultant_` : `consultant_final_score`, `consultant_edited`
- `cr_source` vaut toujours `"manual"` ou `"ai"` — pas d'autre valeur

---

## Règles de sécurité

- Ne jamais committer `.env` — il est dans `.gitignore`
- Ne jamais mettre une API key en dur dans un fichier (même temporairement)
- Le portail client GitHub Pages utilise une Airtable PAT en lecture seule sur la base de démo uniquement
- Les transcriptions d'entretiens sont des données personnelles — ne pas les loguer en clair hors Airtable

---

## Ce qu'il ne faut pas faire

- **Ne pas créer de fichier d'implémentation sans PRD en `03-in-progress`**
- **Ne pas modifier un PRD en `04-complete`** — créer un nouveau PRD si besoin
- **Ne pas utiliser React, Vue, ou un bundler** pour le portail client
- **Ne pas envoyer d'email directement** depuis n8n — toujours créer un draft Gmail pour validation consultant
- **Ne pas merger un PR** si les critères d'acceptance du PRD correspondant ne sont pas tous cochés
- **Ne pas ajouter de dépendances npm** sans les justifier dans le PRD concerné

---

## Skills à créer (propositions)

Les skills Claude Code permettent d'automatiser des actions récurrentes via des slash commands. Voici les skills recommandés pour ce projet.

### Skills de gestion PRD

**`/prd-new`** — Créer un nouveau PRD depuis un template
Génère un fichier PRD dans `01-draft/` avec toutes les sections obligatoires pré-remplies, demande le titre, la priorité, les dépendances et l'estimation en story points.

**`/prd-promote`** — Avancer un PRD dans le cycle de vie
Déplace un fichier PRD d'un dossier au suivant (`01-draft` → `02-ready` → `03-in-progress` → `04-complete`), met à jour le champ `Statut` dans le fichier, et met à jour le BACKLOG.md.

**`/prd-status`** — Afficher l'état du backlog
Liste tous les PRDs par dossier avec leur priorité, story points et dépendances. Met en évidence le chemin critique et ce qui est bloqué.

### Skills de développement

**`/seed-reset`** — Réinitialiser la base Airtable de démo
Supprime tous les enregistrements de la base de démo et relance `npm run seed`. Utile pour repartir d'un état propre avant une démo.

**`/test-prompt`** — Tester un prompt Claude sur les seed data
Prend un nom de module (`cr` ou `report`), charge les données fictives du seed, appelle Claude API avec le prompt correspondant et affiche le résultat formaté. Permet d'itérer sur les prompts sans n8n.

**`/n8n-export`** — Exporter et versionner les workflows n8n
Rappelle la procédure d'export depuis l'UI n8n et vérifie que les fichiers `src/n8n/*.json` sont à jour par rapport à la dernière modification.

### Skills de démo

**`/demo-check`** — Vérifier que tout est prêt pour la démo
Checklist automatique : base Airtable accessible, portail GitHub Pages up, n8n local démarré, variables `.env` présentes, seed data chargé.

**`/demo-reset`** — Remettre la démo dans un état initial propre
Remet les données Airtable dans l'état du seed, supprime les Report_Log de tests, remet les scores IA à null pour que la démo soit reproductible.

---

## Commandes utiles

```bash
npm install          # installer les dépendances
npm run seed         # peupler la base Airtable de démo
npm run test:prompt-cr      # tester le prompt CR sur les seed data
npm run test:prompt-report  # tester le prompt report sur les seed data
npx n8n              # lancer n8n en local (http://localhost:5678)
```
