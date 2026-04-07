import type { EnrichedEinkaufseintraege } from '@/types/enriched';
import type { Einkaufseintraege, Einkaufslisten, Produkte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface EinkaufseintraegeMaps {
  einkaufslistenMap: Map<string, Einkaufslisten>;
  produkteMap: Map<string, Produkte>;
}

export function enrichEinkaufseintraege(
  einkaufseintraege: Einkaufseintraege[],
  maps: EinkaufseintraegeMaps
): EnrichedEinkaufseintraege[] {
  return einkaufseintraege.map(r => ({
    ...r,
    einkaufslisteName: resolveDisplay(r.fields.einkaufsliste, maps.einkaufslistenMap, 'listen_name'),
    produktName: resolveDisplay(r.fields.produkt, maps.produkteMap, 'produkt_name'),
  }));
}
