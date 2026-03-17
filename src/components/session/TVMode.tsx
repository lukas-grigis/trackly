import { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { formatValue } from "@/lib/utils";
import { DISCIPLINES } from "@/lib/constants";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

const MEDAL_COLORS = [
  { bg: "bg-yellow-400", text: "text-yellow-900", label: "🥇" },
  { bg: "bg-slate-300", text: "text-slate-700", label: "🥈" },
  { bg: "bg-amber-600", text: "text-amber-100", label: "🥉" },
] as const;

interface TVModeProps {
  entries: LeaderboardEntry[];
  discipline: string;
  customDisciplineName?: string;
  onExit: () => void;
}

export function TVMode({ entries, discipline, customDisciplineName, onExit }: TVModeProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const config = DISCIPLINES[discipline];

  // Request fullscreen and wake lock on mount
  useEffect(() => {
    // Fullscreen
    try {
      document.documentElement.requestFullscreen?.().catch(() => {
        // Fullscreen denied or unsupported — graceful fallback
      });
    } catch {
      // Fullscreen API not available
    }

    // Wake Lock
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock denied or unsupported
      }
    }
    requestWakeLock();

    return () => {
      // Release wake lock
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Re-acquire wake lock when page becomes visible again (e.g. tab switch)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        navigator.wakeLock?.request("screen").then((lock) => {
          wakeLockRef.current = lock;
        }).catch(() => {});
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Exit on fullscreen change (user pressed Esc)
  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        onExit();
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [onExit]);

  const handleClick = useCallback(() => {
    onExit();
  }, [onExit]);

  // Split entries into podium (top 3 ranks) and remaining
  const podiumEntries = entries.filter((e) => e.rank <= 3);
  const remainingEntries = entries.filter((e) => e.rank > 3);

  // Waiting state
  if (entries.length === 0) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-white cursor-pointer"
        onClick={handleClick}
      >
        <div className="text-center">
          <p className="text-4xl font-bold animate-pulse">{t.tvWaiting}</p>
          <p className="mt-6 text-lg text-slate-400">{t.tvExitHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white cursor-pointer overflow-auto"
      onClick={handleClick}
    >
      {/* Discipline title */}
      <div className="shrink-0 px-6 pt-6 pb-2 text-center">
        <h1 className="text-3xl font-bold text-slate-300 sm:text-4xl">
          {discipline === "custom" && customDisciplineName ? customDisciplineName : (t.disciplines[discipline] ?? discipline)}
        </h1>
      </div>

      {/* Podium section */}
      <div className="shrink-0 flex items-end justify-center gap-4 px-4 py-6 sm:gap-8">
        {podiumEntries.map((entry) => {
          const medalIdx = entry.rank - 1;
          const medal = MEDAL_COLORS[medalIdx];
          const isFirst = entry.rank === 1;

          return (
            <div
              key={entry.athleteId}
              className={`flex flex-col items-center ${isFirst ? "order-1" : entry.rank === 2 ? "order-0" : "order-2"}`}
            >
              {/* Medal indicator */}
              <span className="text-4xl sm:text-5xl mb-2">
                {medal?.label}
              </span>
              {/* Name */}
              <p
                className={`font-bold text-center leading-tight ${isFirst ? "text-3xl sm:text-5xl" : "text-2xl sm:text-4xl"}`}
              >
                {entry.athlete?.name ?? entry.athleteId}
              </p>
              {/* Result */}
              <p
                className={`font-mono mt-1 ${isFirst ? "text-2xl sm:text-4xl" : "text-xl sm:text-3xl"} text-slate-300`}
              >
                {config
                  ? formatValue(entry.bestValue, config.unit)
                  : entry.bestValue}
              </p>
              {/* Pedestal */}
              <div
                className={`mt-3 rounded-t-lg w-24 sm:w-32 ${medal ? `${medal.bg}` : "bg-slate-600"} ${isFirst ? "h-20 sm:h-28" : entry.rank === 2 ? "h-14 sm:h-20" : "h-10 sm:h-16"}`}
              >
                <p
                  className={`text-center font-bold pt-2 text-xl sm:text-2xl ${medal ? medal.text : "text-white"}`}
                >
                  {entry.rank}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining athletes */}
      {remainingEntries.length > 0 && (
        <div className="flex-1 px-4 pb-6 sm:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-4xl space-y-2">
            {remainingEntries.map((entry) => (
              <div
                key={entry.athleteId}
                className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3 sm:px-6 sm:py-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-slate-400 sm:text-2xl w-8 text-right">
                    {entry.rank}
                  </span>
                  <span className="text-xl font-semibold sm:text-2xl">
                    {entry.athlete?.name ?? entry.athleteId}
                  </span>
                </div>
                <span className="text-xl font-mono text-slate-300 sm:text-2xl">
                  {config
                    ? formatValue(entry.bestValue, config.unit)
                    : entry.bestValue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exit hint */}
      <div className="shrink-0 pb-4 text-center">
        <p className="text-sm text-slate-500">{t.tvExitHint}</p>
      </div>
    </div>
  );
}
