import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINE_STAGES, type PipelineStage } from "@/lib/airtable";

interface FunnelBarProps {
  stageCounts: Record<PipelineStage, number>;
  loading?: boolean;
}

const STAGE_GROUPS: { label: string; stages: PipelineStage[] }[] = [
  { label: "Sourcing", stages: ["Sourced", "Contacted", "Responded"] },
  { label: "Qualification", stages: ["Call Done", "Qualified"] },
  { label: "Présentation", stages: ["Presented"] },
  { label: "Entretiens", stages: ["E1", "E2", "E3"] },
  { label: "Offre", stages: ["Offer", "Accepted"] },
];

function stageVariant(stage: PipelineStage, count: number): "default" | "secondary" | "outline" {
  if (count === 0) return "outline";
  if (["Presented", "E1", "E2", "E3", "Offer", "Accepted"].includes(stage)) return "default";
  return "secondary";
}

export function FunnelBar({ stageCounts, loading }: FunnelBarProps) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STAGES.filter((s) => s !== "Rejected").map((s) => (
          <Skeleton key={s} className="h-6 w-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STAGE_GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-24 shrink-0">{group.label}</span>
          <div className="flex flex-wrap gap-1.5">
            {group.stages.map((stage) => {
              const count = stageCounts[stage] ?? 0;
              return (
                <Badge
                  key={stage}
                  variant={stageVariant(stage, count)}
                  className="text-xs"
                >
                  {stage}
                  {count > 0 && (
                    <span className="ml-1.5 font-bold">{count}</span>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
