export type DisciplineMode = "timed" | "distance" | "count";
export type DisciplineCategory = "running" | "jumping" | "throwing" | "games";

export interface DisciplineConfig {
  mode: DisciplineMode;
  unit: "ms" | "cm" | "count";
  sortAscending: boolean; // true = lower is better (time), false = higher is better (distance/count)
  category: DisciplineCategory;
}

export const DISCIPLINES: Record<string, DisciplineConfig> = {
  // Running (timed)
  sprint_40:  { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  sprint_50:  { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  sprint_60:  { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  sprint_80:  { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  sprint_100: { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  sprint_200: { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  run_400:    { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  run_800:    { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  run_1000:   { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  hurdles:    { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  relay:      { mode: "timed", unit: "ms", sortAscending: true,  category: "running" },
  // Jumping (distance)
  long_jump:  { mode: "distance", unit: "cm", sortAscending: false, category: "jumping" },
  high_jump:  { mode: "distance", unit: "cm", sortAscending: false, category: "jumping" },
  // Throwing (distance)
  ball_throw: { mode: "distance", unit: "cm", sortAscending: false, category: "throwing" },
  shot_put:   { mode: "distance", unit: "cm", sortAscending: false, category: "throwing" },
  sling_ball: { mode: "distance", unit: "cm", sortAscending: false, category: "throwing" },
  // Games (count)
  football:   { mode: "count", unit: "count", sortAscending: false, category: "games" },
  basketball: { mode: "count", unit: "count", sortAscending: false, category: "games" },
  handball:   { mode: "count", unit: "count", sortAscending: false, category: "games" },
  unihockey:  { mode: "count", unit: "count", sortAscending: false, category: "games" },
  volleyball: { mode: "count", unit: "count", sortAscending: false, category: "games" },
  dodgeball:  { mode: "count", unit: "count", sortAscending: false, category: "games" },
  brennball:  { mode: "count", unit: "count", sortAscending: false, category: "games" },
  jump_rope:  { mode: "count", unit: "count", sortAscending: false, category: "games" },
};

// MDI (Material Design Icons) sport pictograms via @iconify/react
export const DISCIPLINE_CATEGORIES: {
  key: DisciplineCategory;
  icon: string;
}[] = [
  { key: "running",  icon: "mdi:run-fast" },
  { key: "jumping",  icon: "mdi:human-handsup" },
  { key: "throwing", icon: "mdi:handball" },
  { key: "games",    icon: "mdi:soccer" },
];

export function getDisciplinesByCategory(
  cat: DisciplineCategory,
): [string, DisciplineConfig][] {
  return Object.entries(DISCIPLINES).filter(([, c]) => c.category === cat);
}
