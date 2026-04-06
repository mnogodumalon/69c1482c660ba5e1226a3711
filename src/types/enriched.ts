import type { Einkaufseintraege } from './app';

export type EnrichedEinkaufseintraege = Einkaufseintraege & {
  einkaufslisteName: string;
  produktName: string;
};
