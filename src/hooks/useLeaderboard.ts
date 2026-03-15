import { useMemo } from "react";
import { DISCIPLINES } from "@/lib/constants";
import { getAgeGroup } from "@/lib/utils";
import type { Session, Athlete } from "@/store/session-store";

export type AgeGroupFilter =
  | "All"
  | "U8"
  | "U10"
  | "U12"
  | "U14"
  | "U16"
  | "U18"
  | "Senior";

export const AGE_GROUP_OPTIONS: AgeGroupFilter[] = [
  "All",
  "U8",
  "U10",
  "U12",
  "U14",
  "U16",
  "U18",
  "Senior",
];

export interface LeaderboardEntry {
  athleteId: string;
  athlete: Athlete | undefined;
  bestValue: number;
  rank: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  hasYobData: boolean;
}

/**
 * Computes a leaderboard for a session + discipline.
 * Supports age group filtering and heat filtering.
 * Returns personal best per athlete and standard competition ranking (1,1,3).
 */
export function useLeaderboard(
  session: Session | undefined,
  discipline: string,
  athletes: Athlete[],
  ageGroupFilter: AgeGroupFilter = "All",
  heatFilter: string = "all", // "all" or a specific heat ID
): LeaderboardResult {
  return useMemo(() => {
    if (!session) return { entries: [], hasYobData: false };

    const config = DISCIPLINES[discipline];
    if (!config) return { entries: [], hasYobData: false };

    // Determine if any session athletes have YoB data
    const sessionAthletes = athletes.filter((a) =>
      session.athleteIds.includes(a.id),
    );
    const hasYobData = sessionAthletes.some((a) => a.yearOfBirth != null);

    // Build set of allowed athlete IDs based on age group filter
    const allowedAthleteIds = new Set<string>();
    for (const athlete of sessionAthletes) {
      if (ageGroupFilter === "All") {
        allowedAthleteIds.add(athlete.id);
      } else if (athlete.yearOfBirth != null) {
        if (getAgeGroup(athlete.yearOfBirth) === ageGroupFilter) {
          allowedAthleteIds.add(athlete.id);
        }
      }
      // Athletes without YoB are excluded from specific age group filters
    }

    // Collect heats for this discipline, optionally filtered by heat ID
    let heats = session.heats.filter((h) => h.disciplineType === discipline);
    if (heatFilter !== "all") {
      heats = heats.filter((h) => h.id === heatFilter);
    }

    // Map athleteId -> best value
    const bestByAthlete = new Map<string, number>();

    for (const heat of heats) {
      for (const result of heat.results) {
        if (!allowedAthleteIds.has(result.childId)) continue;

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

    return { entries, hasYobData };
  }, [session, discipline, athletes, ageGroupFilter, heatFilter]);
}
