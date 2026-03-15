import { useMemo } from "react";
import { DISCIPLINES } from "@/lib/constants";
import type { Session, Athlete } from "@/store/session-store";

export interface LeaderboardEntry {
  athleteId: string;
  athlete: Athlete | undefined;
  bestValue: number;
  rank: number;
}

/**
 * Computes a leaderboard for a session + discipline.
 * Returns personal best per athlete (best result across all heats)
 * and standard competition ranking (1,1,3).
 */
export function useLeaderboard(
  session: Session | undefined,
  discipline: string,
  athletes: Athlete[],
): LeaderboardEntry[] {
  return useMemo(() => {
    if (!session) return [];

    const config = DISCIPLINES[discipline];
    if (!config) return [];

    // Collect all results for this discipline across all heats
    const heats = session.heats.filter((h) => h.disciplineType === discipline);

    // Map athleteId -> best value
    const bestByAthlete = new Map<string, number>();

    for (const heat of heats) {
      for (const result of heat.results) {
        const current = bestByAthlete.get(result.childId);
        if (current === undefined) {
          bestByAthlete.set(result.childId, result.value);
        } else {
          // For ascending (time): lower is better; for descending: higher is better
          const isBetter = config.sortAscending
            ? result.value < current
            : result.value > current;
          if (isBetter) {
            bestByAthlete.set(result.childId, result.value);
          }
        }
      }
    }

    // Build entries
    const entries: LeaderboardEntry[] = Array.from(bestByAthlete.entries()).map(
      ([athleteId, bestValue]) => ({
        athleteId,
        athlete: athletes.find((a) => a.id === athleteId),
        bestValue,
        rank: 0, // computed below
      }),
    );

    // Sort by best value
    entries.sort((a, b) =>
      config.sortAscending
        ? a.bestValue - b.bestValue
        : b.bestValue - a.bestValue,
    );

    // Assign standard competition ranking (1,1,3)
    for (let i = 0; i < entries.length; i++) {
      if (i === 0) {
        entries[i].rank = 1;
      } else if (entries[i].bestValue === entries[i - 1].bestValue) {
        entries[i].rank = entries[i - 1].rank;
      } else {
        entries[i].rank = i + 1;
      }
    }

    return entries;
  }, [session, discipline, athletes]);
}
