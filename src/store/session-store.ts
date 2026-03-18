import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Gender = "male" | "female" | "nonbinary";

export interface Athlete {
  id: string;
  name: string;
  yearOfBirth?: number;
  gender?: Gender;
  avatarBase64?: string;
}

export interface HeatResult {
  athleteId: string;
  value: number;
  unit: "ms" | "s" | "cm" | "m" | "count";
  note?: string;
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

/** Estimate localStorage usage in bytes */
function estimateStorageUsage(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += key.length + (localStorage.getItem(key)?.length ?? 0);
      }
    }
    return total * 2; // UTF-16 = 2 bytes per char
  } catch {
    return 0;
  }
}

/** Returns true if storage usage is above ~4MB */
export function isStorageNearQuota(): boolean {
  return estimateStorageUsage() > 4 * 1024 * 1024;
}

/** Compress an avatar image to max 200x200 at JPEG quality 60% */
export function compressAvatar(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      const dim = Math.min(size, 200);
      canvas.width = dim;
      canvas.height = dim;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, dim, dim);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface StoreState {
  athletes: Athlete[];
  sessions: Session[];
  lastSavedAt: number | null;
  _heatJustSaved: boolean;
  _saveError: boolean;
  _quotaWarning: boolean;

  // Global athlete roster
  addAthlete: (name: string, yearOfBirth?: number, gender?: Gender, avatarBase64?: string) => string;
  updateAthlete: (id: string, name: string, yearOfBirth?: number, gender?: Gender, avatarBase64?: string) => void;
  removeAthlete: (id: string) => void;

  // Sessions
  addSession: (name: string, date: string, athleteIds?: string[]) => string;
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
      lastSavedAt: null,
      _heatJustSaved: false,
      _saveError: false,
      _quotaWarning: false,

      addAthlete(name, yearOfBirth, gender, avatarBase64) {
        const id = crypto.randomUUID();
        set((state) => ({
          athletes: [...state.athletes, { id, name, yearOfBirth, gender, avatarBase64 }],
        }));
        return id;
      },

      updateAthlete(id, name, yearOfBirth, gender, avatarBase64) {
        set((state) => ({
          athletes: state.athletes.map((a) =>
            a.id === id ? { ...a, name, yearOfBirth, gender, avatarBase64 } : a,
          ),
        }));
      },

      removeAthlete(id) {
        set((state) => ({
          athletes: state.athletes.filter((a) => a.id !== id),
          // Also remove from any session rosters and cascade-clean heats
          sessions: state.sessions.map((s) => ({
            ...s,
            athleteIds: s.athleteIds.filter((aid) => aid !== id),
            heats: s.heats.map((h) => ({
              ...h,
              participantIds: h.participantIds.filter((pid) => pid !== id),
              results: h.results.filter((r) => r.athleteId !== id),
            })),
          })),
        }));
      },

      addSession(name, date, athleteIds) {
        const id = crypto.randomUUID();
        set((state) => ({
          sessions: [
            ...state.sessions,
            { id, name, date, athleteIds: athleteIds ?? [], heats: [] },
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
          _heatJustSaved: true,
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  heats: s.heats.map((h) => {
                    if (h.id !== heatId) return h;
                    // Reject if athleteId not in participantIds
                    if (!h.participantIds.includes(result.athleteId)) return h;
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
                        updates.participantIds!.includes(r.athleteId),
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
        try { localStorage.removeItem("trackly-save-tooltip-dismissed"); } catch { /* ignore */ }
        set({ athletes: [], sessions: [], lastSavedAt: null, _heatJustSaved: false, _saveError: false, _quotaWarning: false });
      },
    }),
    {
      name: "trackly-storage",
      version: 5,
      storage: (() => {
        // Re-entry guard: updating lastSavedAt triggers persist, which calls
        // setItem again, which would schedule another setState — infinite loop.
        let _writing = false;
        return {
          getItem: (name: string) => {
            try {
              const str = localStorage.getItem(name);
              return str ? JSON.parse(str) : null;
            } catch {
              return null;
            }
          },
          setItem: (name: string, value: unknown) => {
            if (_writing) return;
            _writing = true;
            try {
              const json = JSON.stringify(value);
              localStorage.setItem(name, json);
              const nearQuota = isStorageNearQuota();
              queueMicrotask(() => {
                useSessionStore.setState({ lastSavedAt: Date.now(), _saveError: false, _quotaWarning: nearQuota });
                _writing = false;
              });
            } catch (e) {
              const isQuota = e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22);
              queueMicrotask(() => {
                useSessionStore.setState({ _saveError: true, _quotaWarning: isQuota });
                _writing = false;
              });
            }
          },
          removeItem: (name: string) => {
            try {
              localStorage.removeItem(name);
            } catch {
              // ignore
            }
          },
        };
      })(),
      partialize: (state) => ({
        athletes: state.athletes,
        sessions: state.sessions,
      }) as unknown as StoreState,
    },
  ),
);

// M5: Cross-tab sync — reload store when another tab writes to localStorage
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "trackly-storage" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed?.state) {
          useSessionStore.setState({
            athletes: parsed.state.athletes ?? [],
            sessions: parsed.state.sessions ?? [],
            lastSavedAt: Date.now(),
          });
        }
      } catch { /* ignore parse errors */ }
    }
  });
}
