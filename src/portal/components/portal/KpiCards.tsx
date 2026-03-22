import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardsProps {
  activeCount: number;
  qualifiedCount: number;
  presentedCount: number;
  loading?: boolean;
}

interface KpiCardProps {
  value: number;
  label: string;
  sublabel: string;
}

function KpiCard({ value, label, sublabel }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-4xl font-bold tracking-tight">{value}</div>
        <div className="mt-1 text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sublabel}</div>
      </CardContent>
    </Card>
  );
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-10 w-12 mb-2" />
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function KpiCards({ activeCount, qualifiedCount, presentedCount, loading }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <KpiCard value={activeCount} label="Candidats actifs" sublabel="dans le pipeline" />
      <KpiCard value={qualifiedCount} label="Qualifiés" sublabel="entretien Sonnar passé" />
      <KpiCard value={presentedCount} label="Présentés" sublabel="shortlistés pour vous" />
    </div>
  );
}
