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
    <div className="space-y-16 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          {t.landingHero}
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          {t.landingHeroSub}
        </p>
        <Button size="lg" render={<Link to={ROUTES.SESSIONS} />}>
          {t.landingOpenApp}
        </Button>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">{t.landingHowTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className="flex flex-col items-center gap-3 text-center p-4"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary">
                <Icon icon={step.icon} width={28} height={28} />
              </div>
              <div className="text-sm font-bold text-muted-foreground">
                {i + 1}
              </div>
              <p className="font-semibold">{t[step.key]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center">
          {t.landingFeaturesTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: FeatureIcon, key }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center"
            >
              <FeatureIcon className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{t[key]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="space-y-4 text-center">
        <h2 className="text-2xl font-bold">{t.landingWhoTitle}</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t.landingWhoDesc}
        </p>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-4 py-8">
        <Button size="lg" render={<Link to={ROUTES.SESSIONS} />}>
          {t.landingOpenApp}
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
