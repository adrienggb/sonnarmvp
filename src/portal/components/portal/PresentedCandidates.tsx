import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { PipelineEntry } from "@/lib/airtable";

interface PresentedCandidatesProps {
  candidates: PipelineEntry[];
  loading?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  Presented: "Présenté",
  E1: "Entretien 1",
  E2: "Entretien 2",
  E3: "Entretien 3",
  Offer: "Offre",
  Accepted: "Accepté",
};

function CandidateRow({ entry }: { entry: PipelineEntry }) {
  const label = STAGE_LABELS[entry.stage] ?? entry.stage;
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-medium text-sm">{entry.candidate?.name ?? "—"}</div>
        <div className="text-xs text-muted-foreground">
          {entry.candidate?.currentTitle}
          {entry.candidate?.currentCompany && ` · ${entry.candidate.currentCompany}`}
        </div>
      </div>
      <Badge variant={entry.stage === "Accepted" ? "default" : "secondary"} className="text-xs shrink-0 ml-4">
        {label}
      </Badge>
    </div>
  );
}

function CandidateSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-5 w-20 ml-4" />
    </div>
  );
}

export function PresentedCandidates({ candidates, loading }: PresentedCandidatesProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Candidats shortlistés</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <CandidateSkeleton key={i} />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">Aucun candidat présenté pour le moment.</p>
        ) : (
          <div className="divide-y">
            {candidates.map((entry, i) => (
              <CandidateRow key={entry.id ?? i} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
