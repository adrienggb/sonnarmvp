export const PIPELINE_STAGES = [
  "Sourced",
  "Contacted",
  "Responded",
  "Call Done",
  "Qualified",
  "Presented",
  "E1",
  "E2",
  "E3",
  "Offer",
  "Accepted",
  "Rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PRESENTED_STAGES: PipelineStage[] = [
  "Presented",
  "E1",
  "E2",
  "E3",
  "Offer",
  "Accepted",
];

export const ACTIVE_STAGES: PipelineStage[] = [
  "Sourced",
  "Contacted",
  "Responded",
  "Call Done",
  "Qualified",
  "Presented",
  "E1",
  "E2",
  "E3",
  "Offer",
];

export interface Mission {
  id: string;
  name: string;
  clientName: string;
  status: string;
  salaryRange: string;
  location: string;
  reportFrequency: string;
}

export interface Candidate {
  id: string;
  name: string;
  currentTitle: string;
  currentCompany: string;
}

export interface PipelineEntry {
  id: string;
  missionId: string;
  candidateId: string;
  stage: PipelineStage;
  candidate?: Candidate;
}

export interface MissionData {
  mission: Mission;
  pipeline: PipelineEntry[];
  stageCounts: Record<PipelineStage, number>;
  presented: PipelineEntry[];
  activeCount: number;
  qualifiedCount: number;
  presentedCount: number;
}

export interface ReportLog {
  id: string;
  weekLabel: string;
  sentAt: string;
  reportContent: string;
  kpiSnapshot: Record<string, number> | null;
}

// --- Airtable fetch helpers ---

interface AirtableRecord<T> {
  id: string;
  fields: T;
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

async function fetchAllRecords<T>(
  baseId: string,
  apiKey: string,
  table: string,
  params: string = ""
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`
    );
    if (params) url.search = params;
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
    }

    const data: AirtableResponse<T> = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function fetchMissionData(
  baseId: string,
  apiKey: string,
  missionId: string
): Promise<MissionData> {
  // Fetch mission
  const missionRes = await fetch(
    `https://api.airtable.com/v0/${baseId}/Missions/${missionId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!missionRes.ok) throw new Error(`Mission not found: ${missionId}`);
  const missionRecord = await missionRes.json();

  const mission: Mission = {
    id: missionRecord.id,
    name: missionRecord.fields["Name"] ?? "",
    clientName: missionRecord.fields["Client Name"] ?? "",
    status: missionRecord.fields["Status"] ?? "",
    salaryRange: missionRecord.fields["Salary Range"] ?? "",
    location: missionRecord.fields["Location"] ?? "",
    reportFrequency: missionRecord.fields["Report Frequency"] ?? "",
  };

  // Fetch pipeline entries for this mission
  const pipelineRecords = await fetchAllRecords<Record<string, unknown>>(
    baseId,
    apiKey,
    "Pipeline",
    `filterByFormula={Mission}="${missionId}"`
  );

  // Fetch candidates referenced in pipeline
  const candidateIds = [
    ...new Set(
      pipelineRecords
        .map((r) => {
          const ids = r.fields["Candidate"] as string[] | undefined;
          return ids?.[0];
        })
        .filter((id): id is string => !!id)
    ),
  ];

  const candidateMap = new Map<string, Candidate>();
  if (candidateIds.length > 0) {
    const formula = `OR(${candidateIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    const candidateRecords = await fetchAllRecords<Record<string, unknown>>(
      baseId,
      apiKey,
      "Candidates",
      `filterByFormula=${encodeURIComponent(formula)}`
    );
    for (const r of candidateRecords) {
      candidateMap.set(r.id, {
        id: r.id,
        name: (r.fields["Name"] as string) ?? "",
        currentTitle: (r.fields["Current Title"] as string) ?? "",
        currentCompany: (r.fields["Current Company"] as string) ?? "",
      });
    }
  }

  // Build pipeline entries
  const pipeline: PipelineEntry[] = pipelineRecords
    .flatMap((r) => {
      const stage = r.fields["Pipeline Stage"] as string;
      if (!PIPELINE_STAGES.includes(stage as PipelineStage)) return [];
      const candidateId = (r.fields["Candidate"] as string[])?.[0] ?? "";
      const entry: PipelineEntry = {
        id: r.id,
        missionId: (r.fields["Mission"] as string[])?.[0] ?? "",
        candidateId,
        stage: stage as PipelineStage,
        candidate: candidateMap.get(candidateId),
      };
      return [entry];
    });

  // Compute counts
  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s, 0])
  ) as Record<PipelineStage, number>;

  for (const entry of pipeline) {
    stageCounts[entry.stage] = (stageCounts[entry.stage] ?? 0) + 1;
  }

  const presented = pipeline.filter((e) =>
    PRESENTED_STAGES.includes(e.stage)
  );

  const activeCount = pipeline.filter((e) =>
    ACTIVE_STAGES.includes(e.stage)
  ).length;

  const qualifiedCount =
    stageCounts["Qualified"] +
    stageCounts["Presented"] +
    stageCounts["E1"] +
    stageCounts["E2"] +
    stageCounts["E3"] +
    stageCounts["Offer"] +
    stageCounts["Accepted"];

  return {
    mission,
    pipeline,
    stageCounts,
    presented,
    activeCount,
    qualifiedCount,
    presentedCount: presented.length,
  };
}

export async function fetchLatestReport(
  baseId: string,
  apiKey: string,
  missionId: string
): Promise<ReportLog | null> {
  const records = await fetchAllRecords<Record<string, unknown>>(
    baseId,
    apiKey,
    "Report_Log",
    new URLSearchParams({
      filterByFormula: `{Mission}="${missionId}"`,
      sort: JSON.stringify([{ field: "Sent At", direction: "desc" }]),
      maxRecords: "1",
    }).toString()
  );

  if (records.length === 0) return null;

  const r = records[0];
  let kpiSnapshot: Record<string, number> | null = null;
  const raw = r.fields["KPI Snapshot"];
  if (typeof raw === "string") {
    try {
      kpiSnapshot = JSON.parse(raw);
    } catch {
      kpiSnapshot = null;
    }
  }

  return {
    id: r.id,
    weekLabel: (r.fields["Week Label"] as string) ?? "",
    sentAt: (r.fields["Sent At"] as string) ?? "",
    reportContent: (r.fields["Report Content"] as string) ?? "",
    kpiSnapshot,
  };
}
