import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { Icon } from "@iconify/react";
import {
  Zap,
  WifiOff,
  UserX,
  Code2,
  FileDown,
  Trophy,
  ExternalLink,
  Timer,
  ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/routes";

import type { Translations } from "@/lib/i18n";

type TranslationKey = keyof Translations;

const STEPS: { icon: string; key: TranslationKey }[] = [
  { icon: "mdi:clipboard-text-outline", key: "landingStep1" },
  { icon: "mdi:account-plus-outline", key: "landingStep2" },
  { icon: "mdi:timer-outline", key: "landingStep3" },
];

const FEATURES: { icon: typeof Zap; key: TranslationKey }[] = [
  { icon: Zap, key: "landingFeatureFree" },
  { icon: WifiOff, key: "landingFeatureOffline" },
  { icon: UserX, key: "landingFeatureNoAccount" },
  { icon: Code2, key: "landingFeatureOpenSource" },
  { icon: FileDown, key: "landingFeatureExport" },
  { icon: Trophy, key: "landingFeatureLeaderboard" },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-20 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 py-16">
        <div className="flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          <Timer className="h-3.5 w-3.5" />
          <span>Free &middot; Offline &middot; Open Source</span>
        </div>
        <h1 className="text-gradient text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-lg">
          {t.landingHero}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
          {t.landingHeroSub}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button size="lg" className="btn-shimmer gap-2 h-12 px-8 text-base rounded-xl" nativeButton={false} render={<Link to={ROUTES.SESSIONS} />}>
            {t.landingOpenApp}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t.landingHowTitle}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className="animate-card-enter-stagger flex flex-col items-center gap-4 text-center p-6 rounded-2xl border bg-card"
            >
              <div className="relative">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary">
                  <Icon icon={step.icon} width={32} height={32} />
                </div>
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                  {i + 1}
                </span>
              </div>
              <p className="font-semibold text-lg">{t[step.key] as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {t.landingFeaturesTitle}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: FeatureIcon, key }, i) => (
            <div
              key={key}
              className="animate-card-enter-stagger group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <FeatureIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">{t[key] as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="rounded-2xl border bg-card p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">{t.landingWhoTitle}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {t.landingWhoDesc}
        </p>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-5 py-4">
        <Button size="lg" className="btn-shimmer gap-2 h-12 px-8 text-base rounded-xl" nativeButton={false} render={<Link to={ROUTES.SESSIONS} />}>
          {t.landingOpenApp}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <a
          href="https://github.com/lukas-grigis/trackly"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.landingViewGithub}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t pt-8 pb-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <a
            href="https://github.com/lukas-grigis/trackly"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Code2 className="h-3.5 w-3.5" />
            {t.landingOpenSourceBadge}
          </a>
        </div>
        <p className="text-xs text-muted-foreground">{t.landingFooterPrivacy}</p>
      </footer>
    </div>
  );
}
