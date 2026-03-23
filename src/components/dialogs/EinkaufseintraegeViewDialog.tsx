import type { Einkaufseintraege, Einkaufslisten, Produkte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { IconPencil } from '@tabler/icons-react';

interface EinkaufseintraegeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Einkaufseintraege | null;
  onEdit: (record: Einkaufseintraege) => void;
  einkaufslistenList: Einkaufslisten[];
  produkteList: Produkte[];
}

export function EinkaufseintraegeViewDialog({ open, onClose, record, onEdit, einkaufslistenList, produkteList }: EinkaufseintraegeViewDialogProps) {
  function getEinkaufslistenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return einkaufslistenList.find(r => r.record_id === id)?.fields.listen_name ?? '—';
  }

  function getProdukteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return produkteList.find(r => r.record_id === id)?.fields.produkt_name ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Einkaufseintraege anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einkaufsliste</Label>
            <p className="text-sm">{getEinkaufslistenDisplayName(record.fields.einkaufsliste)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Produkt</Label>
            <p className="text-sm">{getProdukteDisplayName(record.fields.produkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Menge</Label>
            <p className="text-sm">{record.fields.menge ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einheit</Label>
            <Badge variant="secondary">{record.fields.einheit_eintrag?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prioritaet</Label>
            <Badge variant="secondary">{record.fields.prioritaet?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erledigt</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.erledigt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.erledigt ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anmerkung</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.anmerkung ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}