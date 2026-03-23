import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportLog } from "@/lib/airtable";
import { PIPELINE_STAGES } from "@/lib/airtable";

interface WeeklyReportProps {
  report: ReportLog | null;
  loading?: boolean;
}

// Stages to highlight in the KPI snapshot (skip 0-count stages)
const KPI_DISPLAY_STAGES = [
  "Sourced", "Contacted", "Responded", "Call Done",
  "Qualified", "Presented", "E1", "E2", "E3",
  "Offer", "Accepted",
] as const;

function MarkdownBody({ content }: { content: string }) {
  // Minimal markdown renderer: ## headings, **bold**, - lists, newlines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold mt-5 mb-2 text-foreground">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      const text = line.slice(2);
      elements.push(
        <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">
          {renderInline(text)}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-muted-foreground">
          {renderInline(line)}
        </p>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Render **bold** inline
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-foreground">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-48" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function WeeklyReport({ report, loading }: WeeklyReportProps) {
  if (loading) {
    return <ReportSkeleton />;
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun report disponible pour cette mission.
          </p>
        </CardContent>
      </Card>
    );
  }

  const kpis = report.kpiSnapshot;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{report.weekLabel}</p>
        {report.sentAt && (
          <p className="text-xs text-muted-foreground">
            Généré le{" "}
            {new Date(report.sentAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
            })}
          </p>
        )}
      </div>

      {/* KPI badges */}
      {kpis && (
        <div className="flex flex-wrap gap-2">
          {KPI_DISPLAY_STAGES.filter((s) => (kpis[s] ?? 0) > 0).map((stage) => (
            <Badge key={stage} variant="secondary" className="text-xs font-normal">
              {stage} · {kpis[stage]}
            </Badge>
          ))}
          {Object.values(kpis).every((v) => v === 0) && (
            <p className="text-xs text-muted-foreground">Aucune activité cette semaine</p>
          )}
        </div>
      )}

      {/* Report body */}
      <Card>
        <CardContent className="pt-6">
          <MarkdownBody content={report.reportContent} />
        </CardContent>
      </Card>
    </div>
  );
}
