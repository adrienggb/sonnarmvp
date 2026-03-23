#!/usr/bin/env node
/**
 * demo-e2e.js
 * Script de démo end-to-end :
 *   1. Crée un candidat fictif dans Airtable
 *   2. Le rattache à une mission existante via Pipeline
 *   3. Crée une Qualification avec une transcription fictive
 *   4. Génère le CR IA (Ollama local)
 *   5. Injecte le résultat dans Airtable
 *   6. Affiche l'URL du portail pour visualisation
 *
 * Usage : node src/scripts/demo-e2e.js [--mission recXXXX] [--cleanup]
 *   --mission recXXXX  : ID de la mission cible (défaut: VP Sales Fintech)
 *   --cleanup          : supprimer le candidat/pipeline/qualification créés
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const PAT = process.env.AIRTABLE_PAT;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
const PORTAL_BASE_URL = "https://adrienggb.github.io/SonnarMVP";

// Mission par défaut : VP Sales — Fintech Scale-up
const DEFAULT_MISSION_ID = "rec6RAvzkYERdNS2w";

// Candidat fictif pour la démo
const DEMO_CANDIDATE = {
  name: "Alexandre Petit",
  title: "Head of Sales EMEA",
  company: "Adyen",
};

// Transcription fictive réaliste (~300 mots)
const DEMO_TRANSCRIPT = `
Consultant : Alexandre, parle-moi de ton parcours chez Adyen.

Alexandre : J'ai passé 5 ans chez Adyen comme Head of Sales EMEA. J'ai structuré l'équipe commerciale
de 6 à 18 personnes, avec des sous-équipes par verticale — fintech, retail, marketplace.
On a multiplié le GMV de la région par 2.8 sur la période. Ce qui m'a le plus formé,
c'est la vente aux néobanques — Revolut, N26, Wise — où les cycles sont longs
et où il faut convaincre à la fois les équipes produit et les CFO.

Consultant : Tu gérais directement les grands comptes ?

Alexandre : Oui, je gardais 4-5 comptes stratégiques en direct, les autres étaient délégués
à mes team leads. J'ai signé le contrat Revolut Europe — 18 mois de cycle,
3 niveaux de validation. C'est ce type de deal complexe qui me plaît.

Consultant : Côté rémunération et disponibilité ?

Alexandre : Aujourd'hui je suis à 155k fixe + 45k variable. Pour un poste de VP,
je vise 165-175k fixe. Je pourrais être disponible dans 2 mois,
j'ai une clause de non-concurrence à négocier. Je suis basé à Paris,
ouvert au full remote quelques jours par semaine.

Consultant : Qu'est-ce qui t'attire dans ce type de mission scale-up fintech ?

Alexandre : J'ai fait le tour de ce que je pouvais apprendre chez un acteur établi comme Adyen.
Ce qui m'intéresse maintenant, c'est construire quelque chose — structurer
un département sales dans une boîte qui veut passer de 50 à 200 personnes.
J'ai les cicatrices pour le faire. Et la fintech B2B, c'est mon terrain depuis 7 ans.

Consultant : Tu as une expérience en management multi-pays ?

Alexandre : Oui, j'ai des équipes à Paris, Amsterdam et Madrid. 18 personnes en tout,
dont 3 team leads qui me reportent directement. J'ai aussi monté le processus
de recrutement commercial — on est passé de 3 mois à 6 semaines pour onboarder
un nouveau commercial opérationnel.
`.trim();

// ── Helpers ───────────────────────────────────────────────────────────────────

function step(msg) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`▶  ${msg}`);
  console.log("─".repeat(60));
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function loadFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function buildPrompt(template, vars) {
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replaceAll(`{{${key}}}`, val ?? ""),
    template
  );
}

function parseJson(raw) {
  let cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(cleaned);
  } catch {
    const fixed = cleaned.replace(
      /"((?:[^"\\]|\\[\s\S])*)"/g,
      (_, inner) => `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`
    );
    return JSON.parse(fixed);
  }
}

function airtableHeaders() {
  return {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  };
}

async function airtableFetch(urlPath, options = {}) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${urlPath}`;
  const res = await fetch(url, { headers: airtableHeaders(), ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status} ${urlPath}: ${text}`);
  }
  return res.json();
}

async function airtableCreate(table, fields) {
  const data = await airtableFetch(table, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return data.id;
}

async function airtableDelete(table, id) {
  await airtableFetch(`${table}/${id}`, { method: "DELETE" });
}

async function callOllama(systemPrompt, userPrompt) {
  const res = await fetch("http://localhost:11434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama ${res.status}: ${text}`);
  }

  let rawOutput = "";
  const decoder = new TextDecoder();

  for await (const chunk of res.body) {
    const lines = decoder.decode(chunk).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          process.stdout.write(delta);
          rawOutput += delta;
        }
      } catch { /* ignore */ }
    }
  }

  console.log("\n");
  return rawOutput;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

async function cleanup(ids) {
  step("Nettoyage des enregistrements de démo");
  if (ids.qualificationId) {
    await airtableDelete("Qualifications", ids.qualificationId);
    ok(`Qualification ${ids.qualificationId} supprimée`);
  }
  if (ids.pipelineId) {
    await airtableDelete("Pipeline", ids.pipelineId);
    ok(`Pipeline ${ids.pipelineId} supprimé`);
  }
  if (ids.candidateId) {
    await airtableDelete("Candidates", ids.candidateId);
    ok(`Candidat ${ids.candidateId} supprimé`);
  }
  console.log("\n✅ Nettoyage terminé.");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const missionIdx = args.indexOf("--mission");
  const missionId = missionIdx !== -1 ? args[missionIdx + 1] : DEFAULT_MISSION_ID;
  const isCleanup = args.includes("--cleanup");

  if (!BASE_ID || !PAT) {
    throw new Error("Variables manquantes : AIRTABLE_BASE_ID et AIRTABLE_PAT requis dans .env");
  }

  // Mode cleanup : lire les IDs depuis un fichier temp et supprimer
  if (isCleanup) {
    const idsFile = path.join(ROOT, ".demo-ids.json");
    if (!fs.existsSync(idsFile)) {
      throw new Error("Aucun enregistrement de démo trouvé. Lancez d'abord sans --cleanup.");
    }
    const ids = JSON.parse(fs.readFileSync(idsFile, "utf8"));
    await cleanup(ids);
    fs.unlinkSync(idsFile);
    return;
  }

  console.log("\n🎬 DÉMO END-TO-END — Sonnar Automated Reporting");
  console.log("=".repeat(60));
  console.log(`   Candidat : ${DEMO_CANDIDATE.name} (${DEMO_CANDIDATE.title} @ ${DEMO_CANDIDATE.company})`);
  console.log(`   Mission  : ${missionId}`);
  console.log(`   Modèle   : Ollama (${OLLAMA_MODEL})`);

  const createdIds = {};

  // ── ÉTAPE 1 : Fetch mission ─────────────────────────────────────────────────
  step("1/5 — Fetch de la mission Airtable");
  const missionRecord = await airtableFetch(`Missions/${missionId}`);
  const mission = {
    name: missionRecord.fields["Name"] ?? "",
    criteria: missionRecord.fields["Persona Target"] ?? "",
    salaryRange: missionRecord.fields["Salary Range"] ?? "",
    location: missionRecord.fields["Location"] ?? "",
    clientEmail: missionRecord.fields["Client Email"] ?? "",
  };
  ok(`Mission : ${mission.name}`);
  ok(`Client  : ${mission.clientEmail}`);

  // ── ÉTAPE 2 : Création candidat ─────────────────────────────────────────────
  step("2/5 — Création du candidat dans Airtable");
  const candidateId = await airtableCreate("Candidates", {
    "Name": DEMO_CANDIDATE.name,
    "Current Title": DEMO_CANDIDATE.title,
    "Current Company": DEMO_CANDIDATE.company,
  });
  createdIds.candidateId = candidateId;
  ok(`Candidat créé : ${candidateId}`);

  // ── ÉTAPE 3 : Création pipeline ─────────────────────────────────────────────
  step("3/5 — Rattachement à la mission (Pipeline)");
  const pipelineId = await airtableCreate("Pipeline", {
    "Candidate": [candidateId],
    "Mission": [missionId],
    "Pipeline Stage": "Presented",
  });
  createdIds.pipelineId = pipelineId;
  ok(`Pipeline créé : ${pipelineId} (stage: Presented)`);

  // ── ÉTAPE 4 : Création qualification + transcript ───────────────────────────
  step("4/5 — Création de la qualification avec transcription");
  const today = new Date().toISOString().slice(0, 10);
  const qualificationId = await airtableCreate("Qualifications", {
    "Pipeline": [pipelineId],
    "Interview Date": today,
    "Raw Transcript": DEMO_TRANSCRIPT,
  });
  createdIds.qualificationId = qualificationId;
  ok(`Qualification créée : ${qualificationId}`);
  ok(`Transcription : ${DEMO_TRANSCRIPT.split(/\s+/).length} mots`);

  // Sauvegarder les IDs pour le cleanup
  fs.writeFileSync(
    path.join(ROOT, ".demo-ids.json"),
    JSON.stringify(createdIds, null, 2)
  );

  // ── ÉTAPE 5 : Génération CR IA ──────────────────────────────────────────────
  step("5/5 — Génération du CR par IA (Ollama local)");
  console.log(`⏳ Appel ${OLLAMA_MODEL}...\n`);

  const systemPrompt = loadFile("src/prompts/cr-system.md");
  const userTemplate = loadFile("src/prompts/cr-user.md");
  const userPrompt = buildPrompt(userTemplate, {
    candidate_name: DEMO_CANDIDATE.name,
    candidate_title: DEMO_CANDIDATE.title,
    candidate_company: DEMO_CANDIDATE.company,
    mission_name: mission.name,
    mission_criteria: mission.criteria,
    mission_salary_range: mission.salaryRange,
    mission_location: mission.location,
    interview_date: today,
    transcript: DEMO_TRANSCRIPT,
  });

  const rawOutput = await callOllama(systemPrompt, userPrompt);

  let parsed = null;
  let parseError = false;
  try {
    parsed = parseJson(rawOutput);
    ok("JSON valide");
  } catch {
    parseError = true;
    warn("JSON invalide — raw text sauvegardé");
  }

  // PATCH Qualification
  const qualFields = {
    "AI Generated CR": parseError ? rawOutput : JSON.stringify(parsed),
    "CR Source": "ai",
  };
  if (!parseError && parsed?.suggested_score != null) {
    qualFields["AI Suggested Score"] = parsed.suggested_score;
  }

  await airtableFetch(`Qualifications/${qualificationId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: qualFields }),
  });
  ok(`Qualification ${qualificationId} mise à jour dans Airtable`);

  // ── Résumé final ────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DÉMO TERMINÉE\n");

  if (!parseError && parsed) {
    console.log(`   Candidat        : ${DEMO_CANDIDATE.name}`);
    console.log(`   Mission         : ${mission.name}`);
    console.log(`   Recommandation  : ${parsed.recommendation}`);
    console.log(`   Score IA        : ${parsed.suggested_score}/5`);
    console.log(`   Data quality    : ${parsed.data_quality}`);
    console.log(`\n   Summary :\n   ${parsed.summary}`);
    console.log("\n   Forces :");
    parsed.strengths?.forEach((s) => console.log(`   + ${s}`));
    console.log("\n   Faiblesses :");
    parsed.weaknesses?.forEach((w) => console.log(`   - ${w}`));
  }

  console.log("\n" + "─".repeat(60));
  console.log("📋 Enregistrements créés dans Airtable :");
  console.log(`   Candidat      : ${createdIds.candidateId}`);
  console.log(`   Pipeline      : ${createdIds.pipelineId}`);
  console.log(`   Qualification : ${createdIds.qualificationId}`);
  console.log("\n🌐 Portail client :");
  console.log(`   ${PORTAL_BASE_URL}?missionId=${missionId}`);
  console.log("\n🧹 Pour nettoyer : npm run demo:cleanup");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\n❌ Erreur :", err.message);
  process.exit(1);
});
