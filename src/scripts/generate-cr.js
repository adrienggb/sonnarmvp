#!/usr/bin/env node
/**
 * generate-cr.js
 * Génère un CR structuré depuis Airtable et réinjecte le résultat.
 * Usage : node src/scripts/generate-cr.js --id recXXXXXXXXXXXXXX
 *
 * Structure Airtable :
 *   Qualification → Pipeline[0] → Candidate + Mission
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
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
const MODEL = OLLAMA_MODEL ?? process.env.OPENROUTER_MODEL ?? process.env.CLAUDE_MODEL ?? "z-ai/glm-4.5-air:free";
const USE_OLLAMA = !!OLLAMA_MODEL;
const USE_OPENROUTER = !USE_OLLAMA && !!OPENROUTER_KEY;
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
  let cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  // Supprimer les commentaires JSON (non supportés par JSON.parse)
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  // Supprimer les trailing commas avant } ou ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(cleaned);
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
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sonnar.app",
      "X-Title": "Sonnar CR Generator",
    },
    body: JSON.stringify({
      model: MODEL,
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
    throw new Error(`OpenRouter ${res.status}: ${text}`);
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
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  console.log("\n");
  return rawOutput;
}

async function callAnthropic(systemPrompt, userPrompt) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
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

async function callOllama(systemPrompt, userPrompt) {
  const res = await fetch("http://localhost:11434/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
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
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  console.log("\n");
  return rawOutput;
}

async function callLLM(systemPrompt, userPrompt) {
  const call = USE_OLLAMA
    ? () => callOllama(systemPrompt, userPrompt)
    : USE_OPENROUTER
    ? () => callOpenRouter(systemPrompt, userPrompt)
    : () => callAnthropic(systemPrompt, userPrompt);

  try {
    return await call();
  } catch (err) {
    if (err.message.match(/\b5\d\d\b/)) {
      console.log(`⚠️  Erreur serveur, retry dans ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return call();
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

  const apiLabel = USE_OLLAMA ? `Ollama local (${MODEL})` : USE_OPENROUTER ? `OpenRouter (${MODEL})` : `Anthropic (${MODEL})`;
  console.log("─".repeat(60));
  console.log(`🔍 Récupération Qualification ${qualificationId}...`);

  // 1. Fetch Qualification
  const qualRecord = await airtableFetch(`Qualifications/${qualificationId}`);
  const qf = qualRecord.fields;

  const rawTranscript = qf["Raw Transcript"] ?? qf["Transcript"] ?? qf["raw_transcript"] ?? "";
  if (!rawTranscript || rawTranscript.trim().split(/\s+/).length < 50) {
    throw new Error("Transcription absente ou trop courte (< 50 mots). Ajoutez la transcription dans Airtable avant de relancer.");
  }

  const interviewDate = qf["Interview Date"] ?? qf["interview_date"] ?? new Date().toISOString().slice(0, 10);

  // 2. Fetch Pipeline pour obtenir Candidate + Mission
  const pipelineId = (qf["Pipeline"] ?? [])[0];
  if (!pipelineId) {
    throw new Error("La qualification n'est pas liée à un enregistrement Pipeline.");
  }

  const pipelineRecord = await airtableFetch(`Pipeline/${pipelineId}`);
  const pf = pipelineRecord.fields;

  const candidateId = (pf["Candidate"] ?? [])[0];
  const missionId = (pf["Mission"] ?? [])[0];

  if (!candidateId || !missionId) {
    throw new Error("Le Pipeline ne référence pas de candidat ou de mission.");
  }

  // 3. Fetch Candidate + Mission en parallèle
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
    criteria: missionRecord.fields["Persona Target"] ?? "",
    salaryRange: missionRecord.fields["Salary Range"] ?? "",
    location: missionRecord.fields["Location"] ?? "",
  };

  console.log(`   Candidat : ${candidate.name} (${candidate.title} @ ${candidate.company})`);
  console.log(`   Mission  : ${mission.name}`);
  console.log(`   Date     : ${interviewDate}`);
  console.log(`   API      : ${apiLabel}`);
  console.log("─".repeat(60));

  // 4. Build prompt
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

  // 5. Appel LLM
  const apiName = USE_OLLAMA ? "Ollama" : USE_OPENROUTER ? "OpenRouter" : "Anthropic";
  console.log(`⏳ Appel ${apiName}...\n`);
  const rawOutput = await callLLM(systemPrompt, userPrompt);

  // 6. Parse JSON
  let parsed = null;
  let parseError = false;
  try {
    parsed = parseJson(rawOutput);
    console.log("✅ JSON valide");
  } catch {
    parseError = true;
    console.log("❌ JSON invalide — sauvegarde du raw text (parse_error flagué)");
  }

  // 7. PATCH Qualification
  const qualFields = {
    "AI Generated CR": parseError ? rawOutput : JSON.stringify(parsed),
    "CR Source": "ai",
  };

  if (!parseError && parsed.suggested_score != null) {
    qualFields["AI Suggested Score"] = parsed.suggested_score;
  }

  await airtableFetch(`Qualifications/${qualificationId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: qualFields }),
  });
  console.log(`✅ Qualification ${qualificationId} mise à jour`);

  // 8. PATCH Candidate (champs extraits) — skip si champs absents de la base
  if (!parseError && parsed.extracted_fields) {
    const ef = parsed.extracted_fields;
    const candidateFields = {};
    if (ef.salary_current != null) candidateFields["Salary Current"] = ef.salary_current;
    if (ef.salary_target != null) candidateFields["Salary Target"] = ef.salary_target;
    if (ef.availability_date != null) candidateFields["Availability Date"] = ef.availability_date;
    if (ef.nb_direct_reports != null) candidateFields["Nb Direct Reports"] = ef.nb_direct_reports;
    if (ef.location != null) candidateFields["Location Preference"] = ef.location;

    if (Object.keys(candidateFields).length > 0) {
      try {
        await airtableFetch(`Candidates/${candidateId}`, {
          method: "PATCH",
          body: JSON.stringify({ fields: candidateFields }),
        });
        console.log(`✅ Candidat ${candidate.name} mis à jour (${Object.keys(candidateFields).join(", ")})`);
      } catch (err) {
        // Champs optionnels absents de la base — non bloquant
        console.log(`⚠️  Champs candidat non mis à jour (${err.message.includes("UNKNOWN_FIELD") ? "champs absents de la base" : err.message})`);
      }
    }
  }

  // 9. Résumé terminal
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
