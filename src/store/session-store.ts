import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DisciplineType =
  | "sprint_60"
  | "sprint_80"
  | "sprint_100"
  | "long_jump"
  | "shot_put"
  | "high_jump";

export interface Child {
  id: string;
  name: string;
  yearOfBirth?: number;
}

export interface Result {
  id: string;
  childId: string;
  discipline: DisciplineType;
  value: number; // ms for time, cm for distance
  unit: "ms" | "cm";
  recordedAt: string; // ISO timestamp
}

export interface Session {
  id: string;
  name: string;
  date: string; // ISO date
  children: Child[];
  results: Result[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface SessionState {
  sessions: Session[];
  addSession: (name: string, date: string) => string;
  updateSession: (id: string, name: string, date: string) => void;
  deleteSession: (id: string) => void;
  getSession: (id: string) => Session | undefined;
  addChild: (sessionId: string, name: string, yearOfBirth?: number) => void;
  removeChild: (sessionId: string, childId: string) => void;
  addResult: (sessionId: string, result: Omit<Result, "id">) => void;
  addResults: (sessionId: string, results: Omit<Result, "id">[]) => void;
  clearAllData: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession(name, date) {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: [
            ...state.sessions,
            { id, name, date, children: [], results: [] },
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

      getSession(id) {
        return get().sessions.find((s) => s.id === id);
      },

      addChild(sessionId, name, yearOfBirth) {
        const childId = crypto.randomUUID();
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  children: [
                    ...s.children,
                    { id: childId, name, yearOfBirth },
                  ],
                }
              : s,
          ),
        }));
      },

      removeChild(sessionId, childId) {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  children: s.children.filter((c) => c.id !== childId),
                  results: s.results.filter((r) => r.childId !== childId),
                }
              : s,
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
        const withIds = results.map((r) => ({
          ...r,
          id: crypto.randomUUID(),
        }));
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? { ...s, results: [...s.results, ...withIds] }
              : s,
          ),
        }));
      },

      clearAllData() {
        set({ sessions: [] });
      },
    }),
    { name: "trackly-storage" },
  ),
);
