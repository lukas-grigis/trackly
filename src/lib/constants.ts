export type DisciplineMode = "timed" | "distance" | "count" | "custom";
export type DisciplineCategory = "sprint" | "endurance" | "jumping" | "throwing" | "games";

export interface DisciplineConfig {
  mode: DisciplineMode;
  unit: "ms" | "cm" | "count";
  sortAscending: boolean;
  category: DisciplineCategory;
  icon: string; // MDI icon name for @iconify/react
}

export const DISCIPLINES: Record<string, DisciplineConfig> = {
  // Sprint (timed, short)
  sprint_40:    { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:lightning-bolt" },
  sprint_50:    { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:lightning-bolt" },
  sprint_60:    { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:lightning-bolt" },
  sprint_80:    { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:lightning-bolt" },
  sprint_100:   { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:lightning-bolt" },
  sprint_200:   { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:run-fast" },
  hurdles:      { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:fence" },
  relay:        { mode: "timed", unit: "ms", sortAscending: true,  category: "sprint", icon: "mdi:account-switch" },
  // Endurance (timed, longer)
  run_400:      { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:run" },
  run_800:      { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:run" },
  run_1000:     { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:run" },
  run_1500:     { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:run" },
  run_2000:     { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:timer-sand" },
  run_3000:     { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:timer-sand" },
  run_5000:     { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:timer-sand" },
  cooper_test:  { mode: "distance", unit: "cm", sortAscending: false, category: "endurance", icon: "mdi:heart-pulse" },
  shuttle_run:  { mode: "timed", unit: "ms", sortAscending: true,  category: "endurance", icon: "mdi:swap-horizontal" },
  // Jumping (distance)
  long_jump:    { mode: "distance", unit: "cm", sortAscending: false, category: "jumping", icon: "mdi:arrow-right-bold" },
  high_jump:    { mode: "distance", unit: "cm", sortAscending: false, category: "jumping", icon: "mdi:arrow-up-bold" },
  triple_jump:  { mode: "distance", unit: "cm", sortAscending: false, category: "jumping", icon: "mdi:debug-step-over" },
  standing_jump:{ mode: "distance", unit: "cm", sortAscending: false, category: "jumping", icon: "mdi:human-handsup" },
  pole_vault:   { mode: "distance", unit: "cm", sortAscending: false, category: "jumping", icon: "mdi:arrow-up-bold-circle" },
  // Throwing (distance)
  ball_throw:   { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:baseball" },
  shot_put:     { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:circle" },
  sling_ball:   { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:baseball-bat" },
  discus:       { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:disc" },
  javelin:      { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:arrow-top-right" },
  vortex:       { mode: "distance", unit: "cm", sortAscending: false, category: "throwing", icon: "mdi:rocket-launch" },
  // Games (count/score)
  football:     { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:soccer" },
  basketball:   { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:basketball" },
  handball:     { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:handball" },
  unihockey:    { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:hockey-sticks" },
  volleyball:   { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:volleyball" },
  dodgeball:    { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:bullseye" },
  brennball:    { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:fire" },
  jump_rope:    { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:rotate-right" },
  capture_flag: { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:flag-variant" },
  tug_of_war:   { mode: "count", unit: "count", sortAscending: false, category: "games", icon: "mdi:link-variant" },
  obstacle_run: { mode: "timed", unit: "ms", sortAscending: true,  category: "games", icon: "mdi:forest" },
  // Custom (manual entry)
  custom:       { mode: "custom", unit: "cm", sortAscending: false, category: "games", icon: "mdi:pencil-outline" },
};

export const DISCIPLINE_CATEGORIES: {
  key: DisciplineCategory;
  icon: string;
  label: string; // fallback label for the tab (not used for i18n, just for the key)
}[] = [
  { key: "sprint",    icon: "mdi:lightning-bolt", label: "Sprint" },
  { key: "endurance", icon: "mdi:run",            label: "Endurance" },
  { key: "jumping",   icon: "mdi:human-handsup",  label: "Jump" },
  { key: "throwing",  icon: "mdi:handball",        label: "Throw" },
  { key: "games",     icon: "mdi:soccer",          label: "Games" },
];

// Medal/podium colors
export const MEDAL_STYLES = [
  "bg-yellow-400 text-yellow-900",
  "bg-slate-300 text-slate-700",
  "bg-amber-600 text-amber-100",
] as const;

export function getMedalStyle(rank: number): string | undefined {
  return rank >= 1 && rank <= 3 ? MEDAL_STYLES[rank - 1] : undefined;
}

export function isTimedDiscipline(discipline: string): boolean {
  const config = DISCIPLINES[discipline];
  return config?.mode === "timed";
}

export function getDisciplinesByCategory(
  cat: DisciplineCategory,
): [string, DisciplineConfig][] {
  return Object.entries(DISCIPLINES).filter(([, c]) => c.category === cat);
}
