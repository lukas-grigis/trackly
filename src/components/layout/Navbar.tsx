import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sun, Moon, ClipboardList, Users, CircleHelp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import { useSessionStore } from '@/store/session-store';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import SaveIndicator from './SaveIndicator';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = location.pathname === '/';
  const { t, lang, setLang } = useTranslation();
  const { toggleTheme, isDark } = useTheme();

  // Toast on heat result save
  const heatJustSaved = useSessionStore((s) => s._heatJustSaved);
  const saveError = useSessionStore((s) => s._saveError);
  const prevErrorRef = useRef(false);

  useEffect(() => {
    if (heatJustSaved) {
      toast.success(t.resultSaved);
      useSessionStore.setState({ _heatJustSaved: false });
    }
  }, [heatJustSaved, t.resultSaved]);

  useEffect(() => {
    if (saveError && !prevErrorRef.current) {
      toast.error(t.saveError);
    }
    prevErrorRef.current = saveError;
  }, [saveError, t.saveError]);

  // Show back button on deep pages (session detail, race, leaderboard)
  const isDeepPage = /^\/session\//.test(location.pathname);

  const navLinks = [
    { to: ROUTES.SESSIONS, label: t.sessions, icon: ClipboardList },
    { to: ROUTES.ATHLETES, label: t.athletesNav, icon: Users },
  ];

  const quotaWarning = useSessionStore((s) => s._quotaWarning);

  return (
    <header className="sticky top-0 z-50 navbar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {quotaWarning && (
        <div className="bg-destructive text-destructive-foreground text-center text-xs font-medium py-1.5 px-4">
          {t.storageQuotaBanner}
        </div>
      )}
      <div className="mx-auto flex h-14 max-w-2xl lg:max-w-5xl items-center gap-1 px-4">
        {/* Back button on deep pages */}
        {isDeepPage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate(-1)}
            aria-label={t.back}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Logo — always links to landing */}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight shrink-0 mr-1"
          style={{ fontVariationSettings: "'wght' 750", letterSpacing: '-0.025em' }}
        >
          <span className="text-primary">Track</span>
          <span className="text-foreground/70">ly</span>
        </Link>

        {/* Nav links — visible on non-landing pages */}
        {!isLanding && (
          <nav className="flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save indicator */}
        <SaveIndicator />

        {/* Quick start help */}
        {!isLanding && (
          <Link to={ROUTES.HOW_TO}>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-full',
                location.pathname === ROUTES.HOW_TO && 'bg-primary/10 text-primary'
              )}
              aria-label={t.howToTitle}
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
          </Link>
        )}

        {/* Language toggle */}
        <div className="flex items-center rounded-full border bg-muted/50 p-0.5 text-xs font-semibold">
          {(['de', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-label={t.switchToLanguage.replace('{lang}', l === 'de' ? 'Deutsch' : 'English')}
              className={cn(
                'rounded-full px-2 py-0.5 transition-colors uppercase tracking-wide',
                lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label={t.toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
