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

async function main() {
  console.log('Sonnar — Airtable Demo Seed');
  console.log(`Base: ${process.env.AIRTABLE_BASE_ID}\n---`);

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

  const candidateMap = await create('Candidates', data.candidates, (c) => ({
    'Name': c.name,
    'Current Title': c.current_title,
    'Current Company': c.current_company,
  }));

  const getId = (map, localId) => map.find(r => r.localId === localId)?.airtableId;

  console.log(`\nCreating ${data.pipeline.length} records in "Pipeline"...`);
  const pipelineMap = [];
  for (const p of data.pipeline) {
    const result = await base('Pipeline').create({
      'Mission': [getId(missionMap, p.mission_id)],
      'Candidate': [getId(candidateMap, p.candidate_id)],
      'Pipeline Stage': p.stage,
    });
    pipelineMap.push({ localMissionId: p.mission_id, localCandidateId: p.candidate_id, airtableId: result.id });
    process.stdout.write('.');
  }
  console.log(' done.');

  console.log(`\nCreating ${data.qualifications.length} records in "Qualifications"...`);
  for (const q of data.qualifications) {
    const pipeline = pipelineMap.find(
      p => p.localMissionId === q.mission_id && p.localCandidateId === q.candidate_id
    );
    await base('Qualifications').create({
      'Pipeline': [pipeline.airtableId],
      'Interview Date': q.interview_date,
      'Raw Transcript': q.raw_transcript,
      'CR Source': q.cr_source,
    });
    process.stdout.write('.');
  }
  console.log(' done.');

  console.log('\n✓ Seed complete.');
  console.log('Next: import n8n workflows from src/n8n/ and run a test.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
