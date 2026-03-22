#!/usr/bin/env node
/**
 * Sonnar — Airtable Demo Seed Script
 * Usage: npm run seed
 * Requires: AIRTABLE_API_KEY and AIRTABLE_BASE_ID in .env
 */

require('dotenv').config();
const Airtable = require('airtable');
const data = require('./seed-data.json');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function create(tableName, records, mapFn) {
  console.log(`\nCreating ${records.length} records in "${tableName}"...`);
  const created = [];
  for (const record of records) {
    const result = await base(tableName).create(mapFn(record));
    created.push({ localId: record.id, airtableId: result.id });
    process.stdout.write('.');
  }
  console.log(' done.');
  return created;
}

function getId(map, localId) {
  return map.find(r => r.localId === localId)?.airtableId;
}

async function main() {
  console.log('Sonnar — Airtable Demo Seed');
  console.log(`Base: ${process.env.AIRTABLE_BASE_ID}\n---`);

  // 1. Consultants
  const consultantMap = await create('Consultants', data.consultants, (c) => ({
    'Name': c.name,
    'Email': c.email,
    'Slack User ID': c.slack_user_id,
  }));

  // 3. Missions
  const missionMap = await create('Missions', data.missions, (m) => ({
    'Name': m.name,
    'Client Name': m.client_name,
    'Client Email': m.client_email,
    'Report Frequency': m.report_frequency,
    'Status': m.status,
    'Persona Target': m.persona_target,
    'Salary Range': m.salary_range,
    'Location': m.location,
  }));

  // 2. Candidates
  const candidateMap = await create('Candidates', data.candidates, (c) => ({
    'Name': c.name,
    'Current Title': c.current_title,
    'Current Company': c.current_company,
  }));

  // 3. Pipeline
  console.log(`\nCreating ${data.pipeline.length} records in "Pipeline"...`);
  const pipelineMap = [];
  for (const p of data.pipeline) {
    const result = await base('Pipeline').create({
      'Mission': [getId(missionMap, p.mission_id)],
      'Candidate': [getId(candidateMap, p.candidate_id)],
      'Pipeline Stage': p.stage,
    });
    pipelineMap.push({
      localMissionId: p.mission_id,
      localCandidateId: p.candidate_id,
      airtableId: result.id,
    });
    process.stdout.write('.');
  }
  console.log(' done.');

  // 4. Qualifications (avec CRs générés IA)
  console.log(`\nCreating ${data.qualifications.length} records in "Qualifications"...`);
  for (const q of data.qualifications) {
    const pipeline = pipelineMap.find(
      p => p.localMissionId === q.mission_id && p.localCandidateId === q.candidate_id
    );
    const fields = {
      'Pipeline': [pipeline.airtableId],
      'Interview Date': q.interview_date,
      'Raw Transcript': q.raw_transcript,
      'CR Source': q.cr_source,
    };
    if (q.ai_generated_cr) fields['AI Generated CR'] = q.ai_generated_cr;
    if (q.ai_suggested_score) fields['AI Suggested Score'] = q.ai_suggested_score;
    if (q.consultant_final_score) fields['Consultant Final Score'] = q.consultant_final_score;
    if (q.consultant_edited !== undefined) fields['Consultant Edited'] = q.consultant_edited;
    await base('Qualifications').create(fields);
    process.stdout.write('.');
  }
  console.log(' done.');

  // 5. Report_Log
  console.log(`\nCreating ${data.report_log.length} records in "Report_Log"...`);
  for (const r of data.report_log) {
    await base('Report_Log').create({
      'Mission': [getId(missionMap, r.mission_id)],
      'Sent At': r.sent_at,
      'Week Label': r.week_label,
      'Report Content': r.report_content,
      'KPI Snapshot': r.kpi_snapshot,
      'Consultant Edited': r.consultant_edited,
    });
    process.stdout.write('.');
  }
  console.log(' done.');

  console.log('\n✓ Seed complete.');
  console.log(`  Consultants  : ${consultantMap.length}`);
  console.log(`  Missions     : ${missionMap.length}`);
  console.log(`  Candidates   : ${candidateMap.length}`);
  console.log(`  Pipeline     : ${pipelineMap.length}`);
  console.log(`  Qualifications: ${data.qualifications.length}`);
  console.log(`  Report_Log   : ${data.report_log.length}`);
  console.log('\nNext: import n8n workflows from src/n8n/ and run a test.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
