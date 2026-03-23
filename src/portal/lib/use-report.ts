"use client";

import { useState, useEffect } from "react";
import { fetchLatestReport, type ReportLog } from "./airtable";

interface UseReportResult {
  report: ReportLog | null;
  loading: boolean;
  error: string | null;
}

export function useReport(missionId: string | null): UseReportResult {
  const [report, setReport] = useState<ReportLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setLoading(false);
      return;
    }

    async function load() {
      const params = new URLSearchParams(window.location.search);
      const apiKey = params.get("key");
      const baseId = params.get("base");

      if (!apiKey || !baseId) {
        // Mode démo : pas de report à afficher
        setLoading(false);
        return;
      }

      try {
        const result = await fetchLatestReport(baseId, apiKey, missionId!);
        setReport(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [missionId]);

  return { report, loading, error };
}
