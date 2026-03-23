#!/usr/bin/env node
/**
 * generate-report.js
 * Génère le report hebdomadaire client depuis Airtable et l'injecte dans Report_Log.
 * Usage : node src/scripts/generate-report.js --mission recXXXXXXXXXXXXXX
 *
 * Flux :
 *   1. Fetch mission + pipeline (KPIs par stage)
 *   2. Fetch qualifications de la semaine (< 7 jours) + leurs CRs
 *   3. Appel LLM (Ollama > OpenRouter > Anthropic)
 *   4. Créer record Report_Log dans Airtable
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

const PIPELINE_STAGES = [
  "Sourced", "Contacted", "Responded", "Call Done",
  "Qualified", "Presented", "E1", "E2", "E3",
  "Offer", "Accepted", "Rejected",
];

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
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(cleaned);
  } catch {
    // Small models sometimes emit literal newlines inside JSON strings.
    // Replace them with \n escape sequences only inside quoted strings.
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
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

async function airtableFetchAll(table, filterFormula) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams();
    if (filterFormula) params.set("filterByFormula", filterFormula);
    if (offset) params.set("offset", offset);
    const data = await airtableFetch(`${table}?${params.toString()}`);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

function getWeekLabel(date = new Date()) {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  monday.setDate(monday.getDate() + diff);
  const options = { day: "numeric", month: "long", year: "numeric" };
  return `Semaine du ${monday.toLocaleDateString("fr-FR", options)}`;
}

// ── LLM calls ─────────────────────────────────────────────────────────────────

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
      } catch { /* ignore */ }
    }
  }

  console.log("\n");
  return rawOutput;
}

async function callOpenRouter(systemPrompt, userPrompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://sonnar.app",
      "X-Title": "Sonnar Report Generator",
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
      } catch { /* ignore */ }
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
  const args = process.argv.slice(2);
  const missionIdx = args.indexOf("--mission");
  if (missionIdx === -1 || !args[missionIdx + 1]) {
    throw new Error("Usage : node generate-report.js --mission recXXXXXXXXXXXXXX");
  }
  const missionId = args[missionIdx + 1];

  if (!BASE_ID || !PAT) {
    throw new Error("Variables manquantes : AIRTABLE_BASE_ID et AIRTABLE_PAT requis dans .env");
  }

  const apiLabel = USE_OLLAMA ? `Ollama local (${MODEL})` : USE_OPENROUTER ? `OpenRouter (${MODEL})` : `Anthropic (${MODEL})`;
  console.log("─".repeat(60));
  console.log(`📊 Génération report — Mission ${missionId}`);
  console.log(`   API : ${apiLabel}`);
  console.log("─".repeat(60));

  // 1. Fetch mission
  const missionRecord = await airtableFetch(`Missions/${missionId}`);
  const mf = missionRecord.fields;
  const mission = {
    name: mf["Name"] ?? "",
    clientName: mf["Client Name"] ?? "",
  };
  console.log(`✅ Mission : ${mission.name} (client : ${mission.clientName || "—"})`);

  // 2. Fetch pipeline → KPIs par stage
  // Airtable filters don't work well on linked record fields — fetch all and filter client-side
  const allPipelineRecords = await airtableFetchAll("Pipeline");
  const pipelineRecords = allPipelineRecords.filter((r) =>
    Array.isArray(r.fields["Mission"]) && r.fields["Mission"].includes(missionId)
  );

  const stageCounts = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, 0]));
  for (const r of pipelineRecords) {
    const stage = r.fields["Pipeline Stage"];
    if (stage && stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  }
  const totalActive = pipelineRecords.filter(
    (r) => r.fields["Pipeline Stage"] !== "Rejected"
  ).length;

  console.log(`✅ Pipeline : ${totalActive} candidats actifs, ${pipelineRecords.length} total`);
  const stagesSummary = PIPELINE_STAGES
    .filter((s) => stageCounts[s] > 0)
    .map((s) => `${s}: ${stageCounts[s]}`)
    .join(", ");
  console.log(`   Stages : ${stagesSummary || "aucun"}`);

  // 3. Fetch qualifications des 7 derniers jours
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString().slice(0, 10);

  // Collect pipeline IDs for this mission
  const pipelineIds = pipelineRecords.map((r) => r.id);

  let candidatesMet = "Aucun entretien cette semaine.";
  let nbEntretiens = 0;

  if (pipelineIds.length > 0) {
    // Fetch all qualifications and filter client-side (Airtable linked record filters are unreliable)
    const qualRecords = await airtableFetchAll("Qualifications");

    const missionQuals = qualRecords.filter((r) => {
      const pipelineLink = r.fields["Pipeline"];
      if (!Array.isArray(pipelineLink) || !pipelineLink.some((id) => pipelineIds.includes(id))) {
        return false;
      }
      // Filter by date: only qualifications from the last 7 days
      const interviewDate = r.fields["Interview Date"];
      return interviewDate && interviewDate >= since;
    });

    nbEntretiens = missionQuals.length;

    if (missionQuals.length > 0) {
      const summaries = missionQuals.map((r) => {
        // Try to extract summary from AI Generated CR
        let summary = "";
        const aiCr = r.fields["AI Generated CR"];
        if (aiCr) {
          try {
            const cr = JSON.parse(aiCr);
            summary = cr.summary ?? "";
          } catch {
            summary = String(aiCr).slice(0, 200);
          }
        }

        const date = r.fields["Interview Date"] ?? "";
        return `- Entretien du ${date}${summary ? ` : ${summary}` : " (pas de CR disponible)"}`;
      });

      candidatesMet = summaries.join("\n");
    }
  }

  console.log(`✅ Entretiens semaine : ${nbEntretiens === 0 ? "aucun" : nbEntretiens}`);

  // 4. Build prompt
  const today = new Date().toISOString().slice(0, 10);
  const weekLabel = getWeekLabel();
  const systemPrompt = loadFile("src/prompts/report-system.md");
  const userTemplate = loadFile("src/prompts/report-user.md");
  const userPrompt = buildPrompt(userTemplate, {
    mission_name: mission.name,
    client_name: mission.clientName || "le client",
    week_label: weekLabel,
    report_date: today,
    kpis: JSON.stringify(stageCounts, null, 2),
    candidates_met: candidatesMet,
  });

  // 5. Appel LLM
  const apiName = USE_OLLAMA ? "Ollama" : USE_OPENROUTER ? "OpenRouter" : "Anthropic";
  console.log(`\n⏳ Appel ${apiName}...\n`);
  const rawOutput = await callLLM(systemPrompt, userPrompt);

  // 6. Parse JSON
  let parsed = null;
  let parseError = false;
  try {
    parsed = parseJson(rawOutput);
    console.log("✅ JSON valide");
  } catch {
    parseError = true;
    console.log("❌ JSON invalide — sauvegarde du raw text");
  }

  // 7. Créer record Report_Log
  const kpiSnapshot = JSON.stringify(stageCounts);
  const reportFields = {
    "Mission": [missionId],
    "Week Label": weekLabel,
    "Sent At": today,
    "Report Content": parseError ? rawOutput : (parsed?.body ?? rawOutput),
    "KPI Snapshot": kpiSnapshot,
  };

  const newRecord = await airtableFetch("Report_Log", {
    method: "POST",
    body: JSON.stringify({ fields: reportFields }),
  });

  console.log(`✅ Report_Log créé : ${newRecord.id}`);

  // 8. Résumé terminal
  console.log("\n" + "─".repeat(60));
  console.log(`📋 Report généré — ${mission.name}`);
  console.log(`   Semaine    : ${weekLabel}`);
  console.log(`   Record     : ${newRecord.id}`);
  if (!parseError && parsed) {
    console.log(`   Sujet      : ${parsed.subject ?? "—"}`);
    console.log(`\n   Extrait body :\n`);
    const bodyPreview = (parsed.body ?? "").slice(0, 300);
    console.log(bodyPreview + (parsed.body?.length > 300 ? "..." : ""));
  }
  console.log("\n   KPIs :");
  PIPELINE_STAGES.filter((s) => stageCounts[s] > 0).forEach((s) => {
    console.log(`   ${s.padEnd(12)} : ${stageCounts[s]}`);
  });
  console.log("─".repeat(60));
  console.log("✅ Report généré. Ouvrez le portail pour visualiser.");
}

main().catch((err) => {
  console.error("\n❌ Erreur :", err.message);
  process.exit(1);
});
