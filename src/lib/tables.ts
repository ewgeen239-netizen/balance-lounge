// Physical tables in the lounge (numbered 1–20), each with a fixed seat count.
// Staff assign a free table when confirming a reservation. Edit this list to
// match the real floor plan — the admin picker and occupancy grid read from it.

export type TableDef = { no: number; seats: number };

// Sensible default mix (small → large). Adjust seats per your layout.
export const TABLES: TableDef[] = [
  { no: 1, seats: 2 },
  { no: 2, seats: 2 },
  { no: 3, seats: 2 },
  { no: 4, seats: 2 },
  { no: 5, seats: 4 },
  { no: 6, seats: 4 },
  { no: 7, seats: 4 },
  { no: 8, seats: 4 },
  { no: 9, seats: 4 },
  { no: 10, seats: 4 },
  { no: 11, seats: 6 },
  { no: 12, seats: 6 },
  { no: 13, seats: 6 },
  { no: 14, seats: 6 },
  { no: 15, seats: 6 },
  { no: 16, seats: 8 },
  { no: 17, seats: 8 },
  { no: 18, seats: 8 },
  { no: 19, seats: 10 },
  { no: 20, seats: 10 },
  { no: 21, seats: 2 },
  { no: 22, seats: 6 },
  { no: 23, seats: 6 },
  { no: 24, seats: 6 },

];

export const TABLE_MIN = 1;
export const TABLE_MAX = 20;

// Reservation statuses that actually occupy a table for the day.
export const ACTIVE_STATUSES = ["confirmed", "seated"] as const;

export const tableSeats = (no: number): number | undefined =>
  TABLES.find((t) => t.no === no)?.seats;
