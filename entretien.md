# Guide de démo — Sonnar Automated Reporting

## Prérequis

- Ollama lancé en local (`ollama serve` ou l'app est ouverte)
- `.env` présent avec `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `ANTHROPIC_API_KEY`
- Serveur portail : `cd src/portal && npm run dev` → http://localhost:3004

---

## Démo 1 — Module B : CR d'entretien IA (45 secondes)

### Avant la démo

```bash
npm run demo:cleanup   # nettoyer si une démo précédente n'a pas été nettoyée
```

### La démo

```bash
npm run demo
```

Tu montres en live :

- **Étape 1** — fetch Airtable : mission VP Sales + client réels récupérés
- **Étape 2** — candidat "Alexandre Petit" créé dans Airtable (ID visible)
- **Étape 3** — rattaché à la mission via Pipeline (stage: Presented)
- **Étape 4** — qualification + transcription (~320 mots) injectées
- **Étape 5** — CR généré token par token par Ollama local (qwen2.5:7b, ~40s)
- **Résumé** — recommandation go/no-go, score IA, forces, faiblesses, champs extraits

### Après le terminal, ouvrir :

1. **Airtable** → tables Candidates + Pipeline + Qualifications : les 3 enregistrements sont là
2. **Portail local** : http://localhost:3004 → onglet Pipeline → candidat visible
3. **Portail GitHub Pages** : https://adrienggb.github.io/SonnarMVP/?missionId=rec6RAvzkYERdNS2w

### Après la démo

```bash
npm run demo:cleanup   # supprime candidat + pipeline + qualification créés
```

---

## Démo 2 — Module A : Report hebdo IA (30 secondes)

### La démo

```bash
node src/scripts/generate-report.js --mission rec6RAvzkYERdNS2w
```

Tu montres en live :

- **Fetch pipeline** — 7 candidats actifs détectés, KPIs par stage calculés automatiquement
- **Fetch entretiens** — qualifications de la semaine récupérées + résumés CRs extraits
- **Génération Ollama** — report token par token avec les 4 sections (Avancement, Pipeline, Candidats, Prochaines étapes)
- **Résumé** — sujet email, extrait body, KPIs en tableau

### Après le terminal, ouvrir :

1. **Airtable** → table Report_Log : le nouveau record est là (Week Label, KPI Snapshot, Report Content)
2. **Portail local** : http://localhost:3004 → onglet **Report hebdo** → KPI badges + contenu markdown

   > En mode démo (sans paramètres URL) le portail affiche les données fictives.
   > Pour voir les vraies données Airtable :
   > http://localhost:3004?missionId=rec6RAvzkYERdNS2w&key=AIRTABLE_PAT&base=appwgQqKsHf4Z1la7

---

## Enchaînement recommandé en entretien

1. `npm run demo` → montrer Module B (CR) en live
2. Ouvrir Airtable → montrer les enregistrements créés
3. Ouvrir le portail → onglet Pipeline
4. `npm run demo:cleanup`
5. `node src/scripts/generate-report.js --mission rec6RAvzkYERdNS2w` → montrer Module A (Report)
6. Onglet Report hebdo dans le portail → montrer les KPI badges + markdown généré
7. **Pitch chiffres** : 3-4h → 15 min pour le CR, 6-7h → < 5 min pour le report

---

## Si Ollama est lent ou planté

```bash
ollama list           # vérifier que qwen2.5:7b est présent
ollama run qwen2.5:7b # warm-up si nécessaire
```

Le fallback automatique est : Ollama → OpenRouter → Anthropic API.
