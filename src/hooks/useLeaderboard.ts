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
 * Pure computation (no hooks). Computes a leaderboard for one discipline.
 * Safe to call inside loops or useMemo over multiple disciplines.
 */
export function computeLeaderboard(
  session: Session,
  discipline: string,
  athletes: Athlete[],
  ageGroupFilter: AgeGroupFilter = "All",
): LeaderboardResult {
  const config = DISCIPLINES[discipline];
  if (!config) return { entries: [], hasYobData: false };

  const sessionYear = new Date(session.date).getFullYear();
  const sessionAthletes = athletes.filter((a) => session.athleteIds.includes(a.id));
  const hasYobData = sessionAthletes.some((a) => a.yearOfBirth != null);

  const allowedAthleteIds = new Set<string>();
  for (const athlete of sessionAthletes) {
    if (ageGroupFilter === "All") {
      allowedAthleteIds.add(athlete.id);
    } else if (athlete.yearOfBirth != null && getAgeGroup(athlete.yearOfBirth, sessionYear) === ageGroupFilter) {
      allowedAthleteIds.add(athlete.id);
    }
  }

  // I1: exclude team- prefixed IDs and IDs not in athletes array
  const athleteIdSet = new Set(athletes.map((a) => a.id));

  const heats = session.heats.filter((h) => h.disciplineType === discipline);
  const bestByAthlete = new Map<string, number>();

  for (const heat of heats) {
    for (const result of heat.results) {
      if (!allowedAthleteIds.has(result.athleteId)) continue;
      if (result.athleteId.startsWith("team-") || !athleteIdSet.has(result.athleteId)) continue;
      const current = bestByAthlete.get(result.athleteId);
      if (current === undefined) {
        bestByAthlete.set(result.athleteId, result.value);
      } else {
        const isBetter = config.sortAscending ? result.value < current : result.value > current;
        if (isBetter) bestByAthlete.set(result.athleteId, result.value);
      }
    }
  }

  const entries: LeaderboardEntry[] = Array.from(bestByAthlete.entries()).map(
    ([athleteId, bestValue]) => ({
      athleteId,
      athlete: athletes.find((a) => a.id === athleteId),
      bestValue,
      rank: 0,
    }),
  );

  entries.sort((a, b) => config.sortAscending ? a.bestValue - b.bestValue : b.bestValue - a.bestValue);

  for (let i = 0; i < entries.length; i++) {
    if (i === 0) entries[i].rank = 1;
    else if (entries[i].bestValue === entries[i - 1].bestValue) entries[i].rank = entries[i - 1].rank;
    else entries[i].rank = i + 1;
  }

  return { entries, hasYobData };
}

/**
 * Hook wrapper — computes leaderboard for a single discipline with memoisation.
 * Supports age group filtering and heat filtering.
 */
export function useLeaderboard(
  session: Session | undefined,
  discipline: string,
  athletes: Athlete[],
  ageGroupFilter: AgeGroupFilter = "All",
  heatFilter: string = "all",
): LeaderboardResult {
  return useMemo(() => {
    if (!session) return { entries: [], hasYobData: false };

    const config = DISCIPLINES[discipline];
    if (!config) return { entries: [], hasYobData: false };

    const sessionYear = new Date(session.date).getFullYear();
    const sessionAthletes = athletes.filter((a) => session.athleteIds.includes(a.id));
    const hasYobData = sessionAthletes.some((a) => a.yearOfBirth != null);
    const athleteIdSet = new Set(athletes.map((a) => a.id));

    const allowedAthleteIds = new Set<string>();
    for (const athlete of sessionAthletes) {
      if (ageGroupFilter === "All") {
        allowedAthleteIds.add(athlete.id);
      } else if (athlete.yearOfBirth != null && getAgeGroup(athlete.yearOfBirth, sessionYear) === ageGroupFilter) {
        allowedAthleteIds.add(athlete.id);
      }
    }

    let heats = session.heats.filter((h) => h.disciplineType === discipline);
    if (heatFilter !== "all") heats = heats.filter((h) => h.id === heatFilter);

    const bestByAthlete = new Map<string, number>();
    for (const heat of heats) {
      for (const result of heat.results) {
        if (!allowedAthleteIds.has(result.athleteId)) continue;
        if (result.athleteId.startsWith("team-") || !athleteIdSet.has(result.athleteId)) continue;
        const current = bestByAthlete.get(result.athleteId);
        if (current === undefined) {
          bestByAthlete.set(result.athleteId, result.value);
        } else {
          const isBetter = config.sortAscending ? result.value < current : result.value > current;
          if (isBetter) bestByAthlete.set(result.athleteId, result.value);
        }
      }
    }

    const entries: LeaderboardEntry[] = Array.from(bestByAthlete.entries()).map(
      ([athleteId, bestValue]) => ({
        athleteId,
        athlete: athletes.find((a) => a.id === athleteId),
        bestValue,
        rank: 0,
      }),
    );

    entries.sort((a, b) => config.sortAscending ? a.bestValue - b.bestValue : b.bestValue - a.bestValue);

    for (let i = 0; i < entries.length; i++) {
      if (i === 0) entries[i].rank = 1;
      else if (entries[i].bestValue === entries[i - 1].bestValue) entries[i].rank = entries[i - 1].rank;
      else entries[i].rank = i + 1;
    }

    return { entries, hasYobData };
  }, [session, discipline, athletes, ageGroupFilter, heatFilter]);
}
