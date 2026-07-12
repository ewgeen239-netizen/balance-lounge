// Physical tables in the lounge (numbered 1–24), each with a fixed seat count.
// Tables 17–24 are on the outdoor terrace ("Ulica"). Staff assign a free table
// when confirming a reservation. Edit this list to match the real floor plan —
// the admin picker and occupancy grid read from it.

export type TableDef = { no: number; seats: number; outdoor?: boolean };

// Label for the outdoor/terrace section (Polish).
export const TERRACE_LABEL = "Ogródek letni";

// Groups of this size or larger may be seated on the terrace even if the table's
// seat count is smaller — chairs get rearranged there for big companies.
export const LARGE_GROUP = 6;

export const TABLES: TableDef[] = [
  { no: 1, seats: 3 },
  { no: 2, seats: 3 },
  { no: 3, seats: 2 },
  { no: 4, seats: 4 },
  { no: 5, seats: 4 },
  { no: 6, seats: 2 },
  { no: 7, seats: 6 },
  { no: 8, seats: 4 },
  { no: 9, seats: 5 },
  { no: 10, seats: 2 },
  { no: 11, seats: 1 },
  { no: 12, seats: 5 },
  { no: 13, seats: 6 },
  { no: 14, seats: 6 },
  { no: 15, seats: 2 },
  { no: 16, seats: 4 },
  // ---- Terrace / "Ulica" ----
  { no: 17, seats: 3, outdoor: true },
  { no: 18, seats: 2, outdoor: true },
  { no: 19, seats: 2, outdoor: true },
  { no: 20, seats: 2, outdoor: true },
  { no: 21, seats: 3, outdoor: true },
  { no: 22, seats: 3, outdoor: true },
  { no: 23, seats: 2, outdoor: true },
  { no: 24, seats: 2, outdoor: true },
];

export const INDOOR_TABLES = TABLES.filter((t) => !t.outdoor);
export const TERRACE_TABLES = TABLES.filter((t) => t.outdoor);

export const TABLE_MIN = 1;
export const TABLE_MAX = 24;

// Reservation statuses that actually occupy a table for the day.
export const ACTIVE_STATUSES = ["confirmed", "seated"] as const;

export const tableSeats = (no: number): number | undefined =>
  TABLES.find((t) => t.no === no)?.seats;
