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

export interface HeatResult {
  childId: string;
  value: number;
  unit: "ms" | "cm" | "count";
  recordedAt: string; // ISO timestamp
}

export interface Heat {
  id: string;
  sessionId: string;
  disciplineType: string;
  customDisciplineName?: string;
  participantIds: string[];
  startedAt: string; // ISO timestamp
  results: HeatResult[];
}

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date
  athleteIds: string[]; // references global Athlete ids
  heats: Heat[];
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

  // Heats
  addHeat: (sessionId: string, heat: Omit<Heat, "id" | "results">) => string;
  addHeatResult: (sessionId: string, heatId: string, result: HeatResult) => void;
  updateHeat: (sessionId: string, heatId: string, updates: Partial<Pick<Heat, "disciplineType" | "customDisciplineName" | "participantIds" | "startedAt">>) => void;
  deleteHeat: (sessionId: string, heatId: string) => void;

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
            { id, name, date, athleteIds: [], heats: [] },
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

      addHeat(sessionId, heat) {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, heats: [...s.heats, { ...heat, id, results: [] }] }
              : s,
          ),
        }));
        return id;
      },

      addHeatResult(sessionId, heatId, result) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  heats: s.heats.map((h) => {
                    if (h.id !== heatId) return h;
                    // Reject if childId not in participantIds
                    if (!h.participantIds.includes(result.childId)) return h;
                    return { ...h, results: [...h.results, result] };
                  }),
                }
              : s,
          ),
        }));
      },

      updateHeat(sessionId, heatId, updates) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  heats: s.heats.map((h) => {
                    if (h.id !== heatId) return h;
                    const updated = { ...h, ...updates };
                    // Cascade-remove results when participantIds shrink
                    if (updates.participantIds) {
                      updated.results = updated.results.filter((r) =>
                        updates.participantIds!.includes(r.childId),
                      );
                    }
                    return updated;
                  }),
                }
              : s,
          ),
        }));
      },

      deleteHeat(sessionId, heatId) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, heats: s.heats.filter((h) => h.id !== heatId) }
              : s,
          ),
        }));
      },

      clearAllData() {
        set({ athletes: [], sessions: [] });
      },
    }),
    { name: "trackly-storage", version: 5 },
  ),
);
