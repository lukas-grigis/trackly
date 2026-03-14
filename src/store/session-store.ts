import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Athlete {
  id: string;
  name: string;
  yearOfBirth?: number;
}

export interface Result {
  id: string;
  athleteName: string; // free-text snapshot; decoupled from the global roster
  discipline: string;
  value: number; // ms for time, cm for distance, raw count for games
  unit: "ms" | "cm" | "count";
  recordedAt: string; // ISO timestamp
}

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date
  athleteIds: string[]; // references global Athlete ids
  results: Result[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface StoreState {
  athletes: Athlete[];
  sessions: Session[];

  // Global athlete roster
  addAthlete: (name: string, yearOfBirth?: number) => string;
  updateAthlete: (id: string, name: string, yearOfBirth?: number) => void;
  removeAthlete: (id: string) => void;

  // Sessions
  addSession: (name: string, date: string) => string;
  updateSession: (id: string, name: string, date: string) => void;
  deleteSession: (id: string) => void;
  setSessionAthletes: (sessionId: string, athleteIds: string[]) => void;

  // Results
  addResult: (sessionId: string, result: Omit<Result, "id">) => void;
  addResults: (sessionId: string, results: Omit<Result, "id">[]) => void;
  deleteResult: (sessionId: string, resultId: string) => void;

  clearAllData: () => void;
}

export const useSessionStore = create<StoreState>()(
  persist(
    (set) => ({
      athletes: [],
      sessions: [],

      addAthlete(name, yearOfBirth) {
        const id = crypto.randomUUID();
        set((state) => ({
          athletes: [...state.athletes, { id, name, yearOfBirth }],
        }));
        return id;
      },

      updateAthlete(id, name, yearOfBirth) {
        set((state) => ({
          athletes: state.athletes.map((a) =>
            a.id === id ? { ...a, name, yearOfBirth } : a,
          ),
        }));
      },

      removeAthlete(id) {
        set((state) => ({
          athletes: state.athletes.filter((a) => a.id !== id),
          // Also remove from any session rosters
          sessions: state.sessions.map((s) => ({
            ...s,
            athleteIds: s.athleteIds.filter((aid) => aid !== id),
          })),
        }));
      },

      addSession(name, date) {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: [
            ...state.sessions,
            { id, name, date, athleteIds: [], results: [] },
          ],
        }));
        return id;
      },

      updateSession(id, name, date) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, name, date } : s,
          ),
        }));
      },

      deleteSession(id) {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
      },

      setSessionAthletes(sessionId, athleteIds) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, athleteIds } : s,
          ),
        }));
      },

      addResult(sessionId, result) {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, results: [...s.results, { ...result, id }] }
              : s,
          ),
        }));
      },

      addResults(sessionId, results) {
        const withIds = results.map((r) => ({ ...r, id: crypto.randomUUID() }));
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, results: [...s.results, ...withIds] }
              : s,
          ),
        }));
      },

      deleteResult(sessionId, resultId) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, results: s.results.filter((r) => r.id !== resultId) }
              : s,
          ),
        }));
      },

      clearAllData() {
        set({ athletes: [], sessions: [] });
      },
    }),
    { name: "trackly-storage", version: 4 },
  ),
);
