import type { DisciplineType } from '@/store/session-store';

interface DisciplineConfig {
  label: string;
  unit: 'ms' | 'cm';
  isTimed: boolean;
  sortAscending: boolean; // true = lower is better (time), false = higher is better (distance)
}

export const DISCIPLINES: Record<DisciplineType, DisciplineConfig> = {
  sprint_60: { label: '60m Sprint', unit: 'ms', isTimed: true, sortAscending: true },
  sprint_80: { label: '80m Sprint', unit: 'ms', isTimed: true, sortAscending: true },
  sprint_100: { label: '100m Sprint', unit: 'ms', isTimed: true, sortAscending: true },
  long_jump: { label: 'Long Jump', unit: 'cm', isTimed: false, sortAscending: false },
  shot_put: { label: 'Shot Put', unit: 'cm', isTimed: false, sortAscending: false },
  high_jump: { label: 'High Jump', unit: 'cm', isTimed: false, sortAscending: false },
};

export const DISCIPLINE_OPTIONS = Object.entries(DISCIPLINES).map(([value, config]) => ({
  value: value as DisciplineType,
  label: config.label,
}));
