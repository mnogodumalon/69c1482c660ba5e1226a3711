import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Einkaufseintraege, Produkte, Einkaufslisten } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [einkaufseintraege, setEinkaufseintraege] = useState<Einkaufseintraege[]>([]);
  const [produkte, setProdukte] = useState<Produkte[]>([]);
  const [einkaufslisten, setEinkaufslisten] = useState<Einkaufslisten[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [einkaufseintraegeData, produkteData, einkaufslistenData] = await Promise.all([
        LivingAppsService.getEinkaufseintraege(),
        LivingAppsService.getProdukte(),
        LivingAppsService.getEinkaufslisten(),
      ]);
      setEinkaufseintraege(einkaufseintraegeData);
      setProdukte(produkteData);
      setEinkaufslisten(einkaufslistenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [einkaufseintraegeData, produkteData, einkaufslistenData] = await Promise.all([
          LivingAppsService.getEinkaufseintraege(),
          LivingAppsService.getProdukte(),
          LivingAppsService.getEinkaufslisten(),
        ]);
        setEinkaufseintraege(einkaufseintraegeData);
        setProdukte(produkteData);
        setEinkaufslisten(einkaufslistenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const produkteMap = useMemo(() => {
    const m = new Map<string, Produkte>();
    produkte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [produkte]);

  const einkaufslistenMap = useMemo(() => {
    const m = new Map<string, Einkaufslisten>();
    einkaufslisten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [einkaufslisten]);

  return { einkaufseintraege, setEinkaufseintraege, produkte, setProdukte, einkaufslisten, setEinkaufslisten, loading, error, fetchAll, produkteMap, einkaufslistenMap };
}