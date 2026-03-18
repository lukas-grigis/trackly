import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSessionStore } from '@/store/session-store';
import { useTranslation } from '@/lib/i18n';
import { CloudOff } from 'lucide-react';

const TOOLTIP_DISMISSED_KEY = 'trackly-save-tooltip-dismissed';

function useRelativeTime(timestamp: number | null, lang: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (timestamp == null) return;
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (timestamp == null) return null;
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));
  if (lang === 'de') {
    if (diffSec < 60) return `${diffSec} Sek.`;
    return `${Math.floor(diffSec / 60)} Min.`;
  }
  if (diffSec < 60) return `${diffSec}s`;
  return `${Math.floor(diffSec / 60)}m`;
}

export default function SaveIndicator() {
  const lastSavedAt = useSessionStore((s) => s.lastSavedAt);
  const saveError = useSessionStore((s) => s._saveError);
  const { t, lang } = useTranslation();
  const relative = useRelativeTime(lastSavedAt, lang);

  // Show a one-time toast on first visit instead of a floating tooltip
  useEffect(() => {
    try {
      if (localStorage.getItem(TOOLTIP_DISMISSED_KEY) !== 'true') {
        // Small delay so it appears after the page has loaded
        const timer = setTimeout(() => {
          toast.info(t.autoSaveTooltip, { duration: 6000 });
          localStorage.setItem(TOOLTIP_DISMISSED_KEY, 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (saveError) {
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudOff className="h-3 w-3" />
        <span className="hidden sm:inline">{t.saveError}</span>
      </span>
    );
  }

  // Don't show anything if we haven't saved yet
  if (!relative) return null;

  return (
    <span className="flex items-center text-xs text-muted-foreground">{t.savedAgo.replace('{time}', relative)}</span>
  );
}
