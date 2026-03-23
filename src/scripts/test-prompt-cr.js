#!/usr/bin/env node
/**
 * test-prompt-cr.js
 * Teste le prompt CR sur les seed data sans appel Airtable.
 * Usage : node src/scripts/test-prompt-cr.js [index]
 *   index : index de la qualification dans seed-data.json (défaut: 0)
 *
 * API utilisée (par ordre de priorité) :
 *   1. ANTHROPIC_API_KEY → Anthropic SDK
 *   2. OPENROUTER_API_KEY → OpenRouter (compatible OpenAI)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ── Config ─────────────────────────────────────────────────────────────────

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;
const MODEL = OLLAMA_MODEL ?? process.env.OPENROUTER_MODEL ?? process.env.CLAUDE_MODEL ?? "z-ai/glm-4.5-air:free";

const USE_OLLAMA = !!OLLAMA_MODEL;
const USE_OPENROUTER = !USE_OLLAMA && !!OPENROUTER_KEY;

// ── Helpers ────────────────────────────────────────────────────────────────

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

  return rawOutput;
}

async function callAnthropic(systemPrompt, userPrompt) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

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

  return rawOutput;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const index = parseInt(process.argv[2] ?? "0", 10);

  const seedData = JSON.parse(loadFile("src/airtable/seed-data.json"));
  const systemPrompt = loadFile("src/prompts/cr-system.md");
  const userTemplate = loadFile("src/prompts/cr-user.md");

  const qual = seedData.qualifications[index];
  if (!qual) {
    throw new Error(`Pas de qualification à l'index ${index}. Disponibles : 0-${seedData.qualifications.length - 1}`);
  }

  const candidate = seedData.candidates.find((c) => c.id === qual.candidate_id);
  const mission = seedData.missions.find((m) => m.id === qual.mission_id);

  if (!candidate || !mission) {
    throw new Error(`Candidat ou mission introuvable pour la qualification index ${index}`);
  }

  const apiLabel = USE_OLLAMA ? `Ollama local (${MODEL})` : USE_OPENROUTER ? `OpenRouter (${MODEL})` : `Anthropic (${MODEL})`;

  console.log("─".repeat(60));
  console.log(`📋 Qualification index ${index} — ${apiLabel}`);
  console.log(`   Candidat : ${candidate.name} (${candidate.current_title} @ ${candidate.current_company})`);
  console.log(`   Mission  : ${mission.name}`);
  console.log(`   Date     : ${qual.interview_date}`);
  console.log("─".repeat(60));

  const userPrompt = buildPrompt(userTemplate, {
    candidate_name: candidate.name,
    candidate_title: candidate.current_title,
    candidate_company: candidate.current_company,
    mission_name: mission.name,
    mission_criteria: mission.persona_target,
    mission_salary_range: mission.salary_range,
    mission_location: mission.location,
    interview_date: qual.interview_date,
    transcript: qual.raw_transcript,
  });

  const apiName = USE_OLLAMA ? "Ollama" : USE_OPENROUTER ? "OpenRouter" : "Anthropic";
  console.log(`⏳ Appel ${apiName}...\n`);

  let rawOutput = "";
  if (USE_OLLAMA) {
    rawOutput = await callOllama(systemPrompt, userPrompt);
  } else if (USE_OPENROUTER) {
    rawOutput = await callOpenRouter(systemPrompt, userPrompt);
  } else {
    rawOutput = await callAnthropic(systemPrompt, userPrompt);
  }

  console.log("\n\n" + "─".repeat(60));

  let parsed;
  try {
    parsed = parseJson(rawOutput);
    console.log("✅ JSON valide\n");
    console.log(`   Recommandation : ${parsed.recommendation}`);
    console.log(`   Score suggéré  : ${parsed.suggested_score}/5`);
    console.log(`   Data quality   : ${parsed.data_quality}`);
    console.log(`   Salaire actuel : ${parsed.extracted_fields?.salary_current ?? "—"}k€`);
    console.log(`   Salaire cible  : ${parsed.extracted_fields?.salary_target ?? "—"}k€`);
    console.log(`   Disponibilité  : ${parsed.extracted_fields?.availability_date ?? "—"}`);
    console.log(`   Directs        : ${parsed.extracted_fields?.nb_direct_reports ?? "—"}`);
    console.log("\n   Forces :");
    parsed.strengths?.forEach((s) => console.log(`   + ${s}`));
    console.log("\n   Faiblesses :");
    parsed.weaknesses?.forEach((w) => console.log(`   - ${w}`));
  } catch {
    console.log("❌ JSON invalide — parse_error");
    console.log("\nOutput brut :");
    console.log(rawOutput.slice(0, 500));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
