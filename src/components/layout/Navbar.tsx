import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, Moon, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { ROUTES } from "@/routes";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const { t, lang, setLang } = useTranslation();
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-50 navbar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-2xl items-center gap-2 px-4">
        {!isHome && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label={t.back}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Link
          to="/"
          className="text-lg font-bold tracking-tight flex-1"
          style={{ fontVariationSettings: "'wght' 750", letterSpacing: "-0.025em" }}
        >
          <span className="text-primary">Track</span><span className="text-accent">ly</span>
        </Link>
        <Link to={ROUTES.ATHLETES} aria-label={t.athletesNav}>
          <Button variant="ghost" size="icon">
            <Users className="h-4 w-4" />
          </Button>
        </Link>
        {/* Compact pill-style language toggle */}
        <div className="flex items-center rounded-full border bg-muted/50 p-0.5 text-xs font-semibold">
          {(["de", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-label={l === "de" ? "Deutsch" : "English"}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors uppercase tracking-wide",
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={t.toggleTheme}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
