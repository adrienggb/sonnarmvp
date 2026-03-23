#!/usr/bin/env node
/**
 * generate-cr.js
 * Génère un CR structuré depuis Airtable et réinjecte le résultat.
 * Usage : node src/scripts/generate-cr.js --id recXXXXXXXXXXXXXX
 */

import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const PAT = process.env.AIRTABLE_PAT;
const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";
const RETRY_DELAY_MS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}

function airtableHeaders() {
  return {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  };
}

async function airtableFetch(path, options = {}) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${path}`;
  const res = await fetch(url, { headers: airtableHeaders(), ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

async function callClaude(systemPrompt, userPrompt) {
  const client = new Anthropic();
  let rawOutput = "";

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
      rawOutput += event.delta.text;
    }
  }
  console.log("\n");
  return rawOutput;
}

async function callWithRetry(systemPrompt, userPrompt) {
  try {
    return await callClaude(systemPrompt, userPrompt);
  } catch (err) {
    if (err.status >= 500) {
      console.log(`⚠️  Erreur serveur, retry dans ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return callClaude(systemPrompt, userPrompt);
    }
    throw err;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Parse args
  const args = process.argv.slice(2);
  const idIndex = args.indexOf("--id");
  if (idIndex === -1 || !args[idIndex + 1]) {
    throw new Error("Usage : node generate-cr.js --id recXXXXXXXXXXXXXX");
  }
  const qualificationId = args[idIndex + 1];

  if (!BASE_ID || !PAT) {
    throw new Error("Variables manquantes : AIRTABLE_BASE_ID et AIRTABLE_PAT requis dans .env");
  }

  console.log("─".repeat(60));
  console.log(`🔍 Récupération Qualification ${qualificationId}...`);

  // 1. Fetch Qualification
  const qualRecord = await airtableFetch(`Qualifications/${qualificationId}`);
  const qf = qualRecord.fields;

  const rawTranscript = qf["Transcript"] ?? qf["raw_transcript"] ?? "";
  if (!rawTranscript || rawTranscript.trim().split(/\s+/).length < 200) {
    throw new Error("Transcription absente ou trop courte (< 200 mots). Ajoutez la transcription dans Airtable avant de relancer.");
  }

  const interviewDate = qf["Interview Date"] ?? qf["interview_date"] ?? new Date().toISOString().slice(0, 10);
  const candidateId = (qf["Candidate"] ?? [])[0];
  const missionId = (qf["Mission"] ?? [])[0];

  if (!candidateId || !missionId) {
    throw new Error("La qualification ne référence pas de candidat ou de mission.");
  }

  // 2. Fetch Candidate + Mission en parallèle
  const [candidateRecord, missionRecord] = await Promise.all([
    airtableFetch(`Candidates/${candidateId}`),
    airtableFetch(`Missions/${missionId}`),
  ]);

  const candidate = {
    name: candidateRecord.fields["Name"] ?? "",
    title: candidateRecord.fields["Current Title"] ?? "",
    company: candidateRecord.fields["Current Company"] ?? "",
  };
  const mission = {
    name: missionRecord.fields["Name"] ?? "",
    criteria: missionRecord.fields["Persona Target"] ?? missionRecord.fields["persona_target"] ?? "",
    salaryRange: missionRecord.fields["Salary Range"] ?? "",
    location: missionRecord.fields["Location"] ?? "",
  };

  console.log(`   Candidat : ${candidate.name} (${candidate.title} @ ${candidate.company})`);
  console.log(`   Mission  : ${mission.name}`);
  console.log(`   Date     : ${interviewDate}`);
  console.log("─".repeat(60));

  // 3. Build prompt
  const systemPrompt = loadFile("src/prompts/cr-system.md");
  const userTemplate = loadFile("src/prompts/cr-user.md");
  const userPrompt = buildPrompt(userTemplate, {
    candidate_name: candidate.name,
    candidate_title: candidate.title,
    candidate_company: candidate.company,
    mission_name: mission.name,
    mission_criteria: mission.criteria,
    mission_salary_range: mission.salaryRange,
    mission_location: mission.location,
    interview_date: interviewDate,
    transcript: rawTranscript,
  });

  // 4. Appel Claude
  console.log(`⏳ Appel Claude (${MODEL})...\n`);
  const rawOutput = await callWithRetry(systemPrompt, userPrompt);

  // 5. Parse JSON
  let parsed = null;
  let parseError = false;
  try {
    parsed = parseJson(rawOutput);
    console.log("✅ JSON valide");
  } catch {
    parseError = true;
    console.log("❌ JSON invalide — sauvegarde du raw text (parse_error flagué)");
  }

  // 6. PATCH Qualification
  const qualFields = {
    "AI Generated CR": parseError ? rawOutput : JSON.stringify(parsed),
    "AI Suggested Score": parseError ? null : (parsed.suggested_score ?? null),
    "CR Source": "ai",
    "Parse Error": parseError,
  };

  await airtableFetch(`Qualifications/${qualificationId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: qualFields }),
  });
  console.log(`✅ Qualification ${qualificationId} mise à jour`);

  // 7. PATCH Candidate (champs extraits)
  if (!parseError && parsed.extracted_fields) {
    const ef = parsed.extracted_fields;
    const candidateFields = {};
    if (ef.salary_current != null) candidateFields["Salary Current"] = ef.salary_current;
    if (ef.salary_target != null) candidateFields["Salary Target"] = ef.salary_target;
    if (ef.availability_date != null) candidateFields["Availability Date"] = ef.availability_date;
    if (ef.nb_direct_reports != null) candidateFields["Nb Direct Reports"] = ef.nb_direct_reports;
    if (ef.location != null) candidateFields["Location Preference"] = ef.location;

    if (Object.keys(candidateFields).length > 0) {
      await airtableFetch(`Candidates/${candidateId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: candidateFields }),
      });
      console.log(`✅ Candidat ${candidate.name} mis à jour (${Object.keys(candidateFields).join(", ")})`);
    }
  }

  // 8. Résumé terminal
  console.log("\n" + "─".repeat(60));
  if (!parseError && parsed) {
    console.log(`📊 Résumé CR — ${candidate.name}`);
    console.log(`   Recommandation : ${parsed.recommendation}`);
    console.log(`   Score suggéré  : ${parsed.suggested_score}/5`);
    console.log(`   Data quality   : ${parsed.data_quality}`);
    console.log(`\n   Summary : ${parsed.summary}`);
    console.log("\n   Forces :");
    parsed.strengths?.forEach((s) => console.log(`   + ${s}`));
    console.log("\n   Faiblesses :");
    parsed.weaknesses?.forEach((w) => console.log(`   - ${w}`));
    console.log("\n   Champs extraits :");
    const ef = parsed.extracted_fields ?? {};
    console.log(`   Salaire actuel : ${ef.salary_current ?? "—"}k€`);
    console.log(`   Salaire cible  : ${ef.salary_target ?? "—"}k€`);
    console.log(`   Disponibilité  : ${ef.availability_date ?? "—"}`);
    console.log(`   Directs        : ${ef.nb_direct_reports ?? "—"}`);
  }
  console.log("─".repeat(60));
  console.log("✅ CR généré. Ouvrez Airtable pour valider et ajuster le score.");
}

main().catch((err) => {
  console.error("\n❌ Erreur :", err.message);
  process.exit(1);
});
