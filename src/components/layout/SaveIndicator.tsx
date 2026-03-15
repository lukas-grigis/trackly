import { useEffect, useState, useCallback, useRef } from "react";
import { useSessionStore } from "@/store/session-store";
import { useTranslation } from "@/lib/i18n";
import { CloudOff, X } from "lucide-react";

const TOOLTIP_DISMISSED_KEY = "trackly-save-tooltip-dismissed";

function isTooltipDismissed(): boolean {
  try {
    return localStorage.getItem(TOOLTIP_DISMISSED_KEY) === "true";
  } catch {
    return true;
  }
}

function useRelativeTime(timestamp: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timestamp == null) return;
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (timestamp == null) return null;
  const diffSec = Math.round((now - timestamp) / 1000);
  if (diffSec < 60) return `${diffSec} Sek.`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin} Min.`;
}

export default function SaveIndicator() {
  const lastSavedAt = useSessionStore((s) => s.lastSavedAt);
  const saveError = useSessionStore((s) => s._saveError);
  const { t } = useTranslation();
  const relative = useRelativeTime(lastSavedAt);

  const [showTooltip, setShowTooltip] = useState(() => !isTooltipDismissed());
  const tooltipRef = useRef<HTMLDivElement>(null);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    try {
      localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  if (saveError) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOff className="h-3 w-3" />
        <span className="hidden sm:inline">{t.saveError}</span>
      </span>
    );
  }

  return (
    <span className="relative flex items-center text-xs text-muted-foreground">
      {relative ? (
        <span>{t.savedAgo.replace("{time}", relative)}</span>
      ) : (
        <span>—</span>
      )}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute right-0 top-full mt-2 z-50 w-56 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-md"
        >
          <button
            onClick={dismissTooltip}
            className="absolute right-1 top-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="dismiss"
          >
            <X className="h-3 w-3" />
          </button>
          <p>{t.autoSaveTooltip}</p>
        </div>
      )}
    </span>
  );
}
