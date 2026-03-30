// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Einkaufseintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    einkaufsliste?: string; // applookup -> URL zu 'Einkaufslisten' Record
    produkt?: string; // applookup -> URL zu 'Produkte' Record
    menge?: number;
    einheit_eintrag?: LookupValue;
    prioritaet?: LookupValue;
    erledigt?: boolean;
    anmerkung?: string;
  };
}

export interface Produkte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produkt_name?: string;
    kategorie?: LookupValue;
    einheit?: LookupValue;
    beschreibung?: string;
  };
}

export interface Einkaufslisten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    listen_name?: string;
    einkaufsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geschaeft?: string;
    status?: LookupValue;
    notizen?: string;
  };
}

export const APP_IDS = {
  EINKAUFSEINTRAEGE: '69c14815fa58aab0bb1f483b',
  PRODUKTE: '69c1480f8b2d1f1284e79d0a',
  EINKAUFSLISTEN: '69c148142a23cb12a67799b4',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'einkaufseintraege': {
    einheit_eintrag: [{ key: "kg", label: "Kilogramm (kg)" }, { key: "gramm", label: "Gramm (g)" }, { key: "liter", label: "Liter (l)" }, { key: "milliliter", label: "Milliliter (ml)" }, { key: "packung", label: "Packung" }, { key: "flasche", label: "Flasche" }, { key: "dose", label: "Dose" }, { key: "beutel", label: "Beutel" }, { key: "stueck", label: "Stueck" }],
    prioritaet: [{ key: "niedrig", label: "Niedrig" }, { key: "normal", label: "Normal" }, { key: "hoch", label: "Hoch" }],
  },
  'produkte': {
    kategorie: [{ key: "obst_gemuese", label: "Obst & Gemuese" }, { key: "milchprodukte", label: "Milchprodukte" }, { key: "fleisch_fisch", label: "Fleisch & Fisch" }, { key: "backwaren", label: "Backwaren" }, { key: "getraenke", label: "Getraenke" }, { key: "tiefkuehl", label: "Tiefkuehlprodukte" }, { key: "konserven", label: "Konserven & Trockenware" }, { key: "hygiene", label: "Hygiene & Reinigung" }, { key: "sonstiges", label: "Sonstiges" }],
    einheit: [{ key: "stueck", label: "Stueck" }, { key: "kg", label: "Kilogramm (kg)" }, { key: "gramm", label: "Gramm (g)" }, { key: "liter", label: "Liter (l)" }, { key: "milliliter", label: "Milliliter (ml)" }, { key: "packung", label: "Packung" }, { key: "flasche", label: "Flasche" }, { key: "dose", label: "Dose" }, { key: "beutel", label: "Beutel" }],
  },
  'einkaufslisten': {
    status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "erledigt", label: "Erledigt" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'einkaufseintraege': {
    'einkaufsliste': 'applookup/select',
    'produkt': 'applookup/select',
    'menge': 'number',
    'einheit_eintrag': 'lookup/select',
    'prioritaet': 'lookup/radio',
    'erledigt': 'bool',
    'anmerkung': 'string/textarea',
  },
  'produkte': {
    'produkt_name': 'string/text',
    'kategorie': 'lookup/select',
    'einheit': 'lookup/select',
    'beschreibung': 'string/textarea',
  },
  'einkaufslisten': {
    'listen_name': 'string/text',
    'einkaufsdatum': 'date/date',
    'geschaeft': 'string/text',
    'status': 'lookup/radio',
    'notizen': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateEinkaufseintraege = StripLookup<Einkaufseintraege['fields']>;
export type CreateProdukte = StripLookup<Produkte['fields']>;
export type CreateEinkaufslisten = StripLookup<Einkaufslisten['fields']>;