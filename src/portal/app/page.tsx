"use client";

import { useMission } from "@/lib/use-mission";
import { KpiCards } from "@/components/portal/KpiCards";
import { FunnelBar } from "@/components/portal/FunnelBar";
import { PresentedCandidates } from "@/components/portal/PresentedCandidates";
import { Separator } from "@/components/ui/separator";

export default function PortalPage() {
  const { data, loading, error, isDemo } = useMission();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-destructive">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const mission = data?.mission;

  return (
    <div className="min-h-screen">
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
          <p className="text-xs text-amber-700 font-medium">
            Mode démo — données fictives à titre illustratif
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="space-y-1">
          {loading ? (
            <>
              <div className="h-7 w-64 bg-zinc-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-zinc-100 rounded animate-pulse" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {mission?.name ?? "Mission"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {[mission?.location, mission?.salaryRange]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </>
          )}
        </header>

        <Separator />

        {/* KPI cards */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Vue d&apos;ensemble
          </h2>
          <KpiCards
            activeCount={data?.activeCount ?? 0}
            qualifiedCount={data?.qualifiedCount ?? 0}
            presentedCount={data?.presentedCount ?? 0}
            loading={loading}
          />
        </section>

        {/* Funnel */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Pipeline par étape
          </h2>
          <FunnelBar
            stageCounts={
              data?.stageCounts ?? {
                Sourced: 0, Contacted: 0, Responded: 0, "Call Done": 0,
                Qualified: 0, Presented: 0, E1: 0, E2: 0, E3: 0,
                Offer: 0, Accepted: 0, Rejected: 0,
              }
            }
            loading={loading}
          />
        </section>

        {/* Presented candidates */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Candidats en cours
          </h2>
          <PresentedCandidates
            candidates={data?.presented ?? []}
            loading={loading}
          />
        </section>

        {/* Footer */}
        <footer className="pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Sonnar Executive Search
            {mission?.clientName && ` · À l'attention de ${mission.clientName}`}
          </p>
        </footer>
      </div>
    </div>
  );
}
