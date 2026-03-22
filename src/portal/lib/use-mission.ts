"use client";

import { useState, useEffect } from "react";
import { fetchMissionData, type MissionData } from "./airtable";
import { DEMO_DATA } from "./demo-data";

interface UseMissionResult {
  data: MissionData | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
}

export function useMission(): UseMissionResult {
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const missionId = params.get("mission");
      const apiKey = params.get("key");
      const baseId = params.get("base");

      // Mode démo si aucun paramètre
      if (!missionId || !apiKey || !baseId) {
        setData(DEMO_DATA);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      try {
        const result = await fetchMissionData(baseId, apiKey, missionId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { data, loading, error, isDemo };
}
