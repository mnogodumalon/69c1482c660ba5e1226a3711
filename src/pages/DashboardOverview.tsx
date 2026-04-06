import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichEinkaufseintraege } from '@/lib/enrich';
import type { EnrichedEinkaufseintraege } from '@/types/enriched';
import type { Einkaufslisten, Einkaufseintraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EinkaufslistenDialog } from '@/components/dialogs/EinkaufslistenDialog';
import { EinkaufseintraegeDialog } from '@/components/dialogs/EinkaufseintraegeDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconPlus, IconPencil, IconTrash, IconShoppingCart,
  IconCheck, IconClockHour4, IconCircleCheck, IconCalendar, IconBuilding,
  IconShoppingBag, IconChevronRight, IconPackage
} from '@tabler/icons-react';

// ─── Status helpers ──────────────────────────────────────────────────────────

function statusBadge(status: Einkaufslisten['fields']['status']) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    offen: { label: 'Offen', cls: 'bg-amber-100 text-amber-700', icon: <IconClockHour4 size={12} className="shrink-0" /> },
    in_bearbeitung: { label: 'In Bearbeitung', cls: 'bg-blue-100 text-blue-700', icon: <IconShoppingCart size={12} className="shrink-0" /> },
    erledigt: { label: 'Erledigt', cls: 'bg-green-100 text-green-700', icon: <IconCircleCheck size={12} className="shrink-0" /> },
  };
  const s = map[status.key] ?? { label: status.label, cls: 'bg-muted text-muted-foreground', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

function priorityDot(prioritaet: Einkaufseintraege['fields']['prioritaet']) {
  if (!prioritaet) return null;
  const map: Record<string, string> = {
    niedrig: 'bg-slate-400',
    normal: 'bg-amber-400',
    hoch: 'bg-red-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${map[prioritaet.key] ?? 'bg-slate-300'}`} />;
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const {
    produkte, einkaufslisten, einkaufseintraege,
    produkteMap, einkaufslistenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedEinkaufseintraege = enrichEinkaufseintraege(einkaufseintraege, { einkaufslistenMap, produkteMap });

  // UI state — all hooks BEFORE early returns
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editList, setEditList] = useState<Einkaufslisten | null>(null);
  const [deleteList, setDeleteList] = useState<Einkaufslisten | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EnrichedEinkaufseintraege | null>(null);
  const [deleteItem, setDeleteItem] = useState<EnrichedEinkaufseintraege | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Derived data
  const sortedLists = useMemo(() => {
    return [...einkaufslisten].sort((a, b) => {
      // Offen and in_bearbeitung first
      const order: Record<string, number> = { offen: 0, in_bearbeitung: 1, erledigt: 2 };
      const ao = order[a.fields.status?.key ?? ''] ?? 3;
      const bo = order[b.fields.status?.key ?? ''] ?? 3;
      if (ao !== bo) return ao - bo;
      return (b.fields.einkaufsdatum ?? '').localeCompare(a.fields.einkaufsdatum ?? '');
    });
  }, [einkaufslisten]);

  const activeListId = selectedListId ?? sortedLists[0]?.record_id ?? null;
  const activeList = einkaufslistenMap.get(activeListId ?? '') ?? null;

  const listItems = useMemo(() => {
    return enrichedEinkaufseintraege.filter(e => {
      const id = extractRecordId(e.fields.einkaufsliste);
      return id === activeListId;
    });
  }, [enrichedEinkaufseintraege, activeListId]);

  const itemsByCategory = useMemo(() => {
    const groups: Record<string, EnrichedEinkaufseintraege[]> = {};
    for (const item of listItems) {
      const prodId = extractRecordId(item.fields.produkt);
      const prod = prodId ? produkteMap.get(prodId) : null;
      const cat = prod?.fields.kategorie?.label ?? 'Sonstiges';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [listItems, produkteMap]);

  const doneCount = listItems.filter(i => i.fields.erledigt).length;
  const totalCount = listItems.length;

  // KPI counts
  const offenCount = einkaufslisten.filter(l => l.fields.status?.key === 'offen').length;
  const inBearbeitungCount = einkaufslisten.filter(l => l.fields.status?.key === 'in_bearbeitung').length;
  const erledigtCount = einkaufslisten.filter(l => l.fields.status?.key === 'erledigt').length;

  // Handlers
  const handleToggleErledigt = useCallback(async (item: EnrichedEinkaufseintraege) => {
    if (togglingIds.has(item.record_id)) return;
    setTogglingIds(prev => new Set(prev).add(item.record_id));
    try {
      await LivingAppsService.updateEinkaufseintraegeEntry(item.record_id, {
        erledigt: !item.fields.erledigt,
      });
      await fetchAll();
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(item.record_id); return n; });
    }
  }, [togglingIds, fetchAll]);

  const handleDeleteList = useCallback(async () => {
    if (!deleteList) return;
    await LivingAppsService.deleteEinkaufslistenEntry(deleteList.record_id);
    if (activeListId === deleteList.record_id) setSelectedListId(null);
    setDeleteList(null);
    fetchAll();
  }, [deleteList, activeListId, fetchAll]);

  const handleDeleteItem = useCallback(async () => {
    if (!deleteItem) return;
    await LivingAppsService.deleteEinkaufseintraegeEntry(deleteItem.record_id);
    setDeleteItem(null);
    fetchAll();
  }, [deleteItem, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IconShoppingBag size={16} className="text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Alle Listen</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{einkaufslisten.length}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IconClockHour4 size={16} className="text-amber-500 shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Offen</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{offenCount}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IconShoppingCart size={16} className="text-blue-500 shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">In Bearbeitung</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{inBearbeitungCount}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IconCircleCheck size={16} className="text-green-500 shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Erledigt</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{erledigtCount}</div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[560px]">
        {/* Left panel: shopping lists */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-base">Einkaufslisten</h2>
            <Button size="sm" onClick={() => { setEditList(null); setListDialogOpen(true); }} className="gap-1.5">
              <IconPlus size={14} className="shrink-0" />
              <span className="hidden sm:inline">Neue Liste</span>
            </Button>
          </div>

          {sortedLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-card border border-dashed border-border rounded-2xl gap-3">
              <IconShoppingBag size={36} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground text-center">Noch keine Einkaufslisten.<br />Erstelle deine erste Liste.</p>
              <Button size="sm" variant="outline" onClick={() => { setEditList(null); setListDialogOpen(true); }}>
                <IconPlus size={14} className="shrink-0 mr-1" />Neue Liste
              </Button>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[500px] lg:max-h-[calc(100vh-300px)] pr-0.5">
              {sortedLists.map(list => {
                const isActive = list.record_id === activeListId;
                const itemsForList = einkaufseintraege.filter(e => extractRecordId(e.fields.einkaufsliste) === list.record_id);
                const doneForList = itemsForList.filter(e => e.fields.erledigt).length;
                return (
                  <div
                    key={list.record_id}
                    onClick={() => setSelectedListId(list.record_id)}
                    className={`relative rounded-2xl border cursor-pointer transition-all select-none ${
                      isActive
                        ? 'bg-primary/5 border-primary/30 shadow-sm'
                        : 'bg-card border-border hover:border-primary/20 hover:bg-accent/30'
                    }`}
                  >
                    <div className="p-3.5 pr-[72px]">
                      <div className="flex items-start gap-2 mb-1.5">
                        <div className="min-w-0 flex-1">
                          <p className={`font-medium text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                            {list.fields.listen_name ?? 'Unbenannte Liste'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {statusBadge(list.fields.status)}
                        {list.fields.einkaufsdatum && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <IconCalendar size={11} className="shrink-0" />
                            {formatDate(list.fields.einkaufsdatum)}
                          </span>
                        )}
                        {list.fields.geschaeft && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[120px]">
                            <IconBuilding size={11} className="shrink-0" />
                            {list.fields.geschaeft}
                          </span>
                        )}
                      </div>
                      {itemsForList.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{doneForList}/{itemsForList.length} erledigt</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full transition-all"
                              style={{ width: `${itemsForList.length ? (doneForList / itemsForList.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); setEditList(list); setListDialogOpen(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        <IconPencil size={13} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteList(list); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                    {isActive && (
                      <div className="absolute right-14 top-1/2 -translate-y-1/2">
                        <IconChevronRight size={14} className="text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel: list detail / items */}
        <div className="flex-1 min-w-0 bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          {!activeList ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 gap-3">
              <IconShoppingCart size={48} className="text-muted-foreground" stroke={1.5} />
              <p className="text-sm text-muted-foreground">Wähle eine Einkaufsliste aus</p>
            </div>
          ) : (
            <>
              {/* List header */}
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground text-lg truncate">
                      {activeList.fields.listen_name ?? 'Unbenannte Liste'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {statusBadge(activeList.fields.status)}
                      {activeList.fields.geschaeft && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <IconBuilding size={12} className="shrink-0" />{activeList.fields.geschaeft}
                        </span>
                      )}
                      {activeList.fields.einkaufsdatum && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <IconCalendar size={12} className="shrink-0" />{formatDate(activeList.fields.einkaufsdatum)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setEditItem(null); setItemDialogOpen(true); }}
                    className="gap-1.5 shrink-0"
                  >
                    <IconPlus size={14} className="shrink-0" />
                    Artikel
                  </Button>
                </div>
                {totalCount > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">{doneCount} von {totalCount} Artikeln erledigt</span>
                      <span className="text-xs font-medium text-foreground">
                        {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto">
                {listItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <IconPackage size={40} className="text-muted-foreground" stroke={1.5} />
                    <p className="text-sm text-muted-foreground text-center">Noch keine Artikel in dieser Liste.</p>
                    <Button size="sm" variant="outline" onClick={() => { setEditItem(null); setItemDialogOpen(true); }}>
                      <IconPlus size={14} className="shrink-0 mr-1" />Artikel hinzufügen
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {Object.entries(itemsByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <div className="space-y-1.5">
                          {items.map(item => {
                            const isDone = !!item.fields.erledigt;
                            const isToggling = togglingIds.has(item.record_id);
                            return (
                              <div
                                key={item.record_id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                                  isDone
                                    ? 'bg-muted/30 border-border/50 opacity-60'
                                    : 'bg-background border-border hover:border-primary/20'
                                }`}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={() => handleToggleErledigt(item)}
                                  disabled={isToggling}
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isDone
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-border hover:border-green-400'
                                  } ${isToggling ? 'opacity-50' : ''}`}
                                >
                                  {isDone && <IconCheck size={11} stroke={3} />}
                                </button>

                                {/* Item info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {priorityDot(item.fields.prioritaet)}
                                    <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                      {item.produktName || 'Unbekanntes Produkt'}
                                    </span>
                                    {item.fields.menge && (
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {item.fields.menge} {item.fields.einheit_eintrag?.label ?? ''}
                                      </span>
                                    )}
                                  </div>
                                  {item.fields.anmerkung && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.fields.anmerkung}</p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1 shrink-0">
                                  <button
                                    onClick={() => { setEditItem(item); setItemDialogOpen(true); }}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  >
                                    <IconPencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteItem(item)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <IconTrash size={13} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EinkaufslistenDialog
        open={listDialogOpen}
        onClose={() => { setListDialogOpen(false); setEditList(null); }}
        onSubmit={async (fields) => {
          if (editList) {
            await LivingAppsService.updateEinkaufslistenEntry(editList.record_id, fields);
          } else {
            await LivingAppsService.createEinkaufslistenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editList?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Einkaufslisten']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Einkaufslisten']}
      />

      <EinkaufseintraegeDialog
        open={itemDialogOpen}
        onClose={() => { setItemDialogOpen(false); setEditItem(null); }}
        onSubmit={async (fields) => {
          if (editItem) {
            await LivingAppsService.updateEinkaufseintraegeEntry(editItem.record_id, fields);
          } else {
            // Pre-fill the current list
            const enrichedFields = { ...fields };
            if (activeListId && !enrichedFields.einkaufsliste) {
              enrichedFields.einkaufsliste = createRecordUrl(APP_IDS.EINKAUFSLISTEN, activeListId);
            }
            await LivingAppsService.createEinkaufseintraegeEntry(enrichedFields);
          }
          fetchAll();
        }}
        defaultValues={
          editItem
            ? editItem.fields
            : activeListId
              ? { einkaufsliste: createRecordUrl(APP_IDS.EINKAUFSLISTEN, activeListId) }
              : undefined
        }
        einkaufslistenList={einkaufslisten}
        produkteList={produkte}
        enablePhotoScan={AI_PHOTO_SCAN['Einkaufseintraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Einkaufseintraege']}
      />

      <ConfirmDialog
        open={!!deleteList}
        title="Liste löschen"
        description={`Möchtest du die Liste „${deleteList?.fields.listen_name ?? ''}" wirklich löschen?`}
        onConfirm={handleDeleteList}
        onClose={() => setDeleteList(null)}
      />

      <ConfirmDialog
        open={!!deleteItem}
        title="Artikel löschen"
        description={`Möchtest du „${deleteItem?.produktName ?? 'diesen Artikel'}" wirklich aus der Liste entfernen?`}
        onConfirm={handleDeleteItem}
        onClose={() => setDeleteItem(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <div className="flex gap-4">
        <div className="w-80 space-y-2">
          <Skeleton className="h-8 w-40" />
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="flex-1 h-96 rounded-2xl" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
