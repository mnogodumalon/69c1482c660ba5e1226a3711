import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Produkte, Einkaufslisten, Einkaufseintraege } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [produkte, setProdukte] = useState<Produkte[]>([]);
  const [einkaufslisten, setEinkaufslisten] = useState<Einkaufslisten[]>([]);
  const [einkaufseintraege, setEinkaufseintraege] = useState<Einkaufseintraege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [produkteData, einkaufslistenData, einkaufseintraegeData] = await Promise.all([
        LivingAppsService.getProdukte(),
        LivingAppsService.getEinkaufslisten(),
        LivingAppsService.getEinkaufseintraege(),
      ]);
      setProdukte(produkteData);
      setEinkaufslisten(einkaufslistenData);
      setEinkaufseintraege(einkaufseintraegeData);
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
        const [produkteData, einkaufslistenData, einkaufseintraegeData] = await Promise.all([
          LivingAppsService.getProdukte(),
          LivingAppsService.getEinkaufslisten(),
          LivingAppsService.getEinkaufseintraege(),
        ]);
        setProdukte(produkteData);
        setEinkaufslisten(einkaufslistenData);
        setEinkaufseintraege(einkaufseintraegeData);
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

  return { produkte, setProdukte, einkaufslisten, setEinkaufslisten, einkaufseintraege, setEinkaufseintraege, loading, error, fetchAll, produkteMap, einkaufslistenMap };
}