import { useTranslation } from "@/lib/i18n";

import type { Translations } from "@/lib/i18n";

type TranslationKey = keyof Translations;

const STEPS: { num: number; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { num: 1, titleKey: "howToStep1Title", descKey: "howToStep1Desc" },
  { num: 2, titleKey: "howToStep2Title", descKey: "howToStep2Desc" },
  { num: 3, titleKey: "howToStep3Title", descKey: "howToStep3Desc" },
  { num: 4, titleKey: "howToStep4Title", descKey: "howToStep4Desc" },
  { num: 5, titleKey: "howToStep5Title", descKey: "howToStep5Desc" },
];

export default function HowToPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t.howToTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.howToSubtitle}</p>
      </div>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />

        {STEPS.map(({ num, titleKey, descKey }, i) => (
          <div
            key={titleKey}
            className="animate-card-enter-stagger relative flex gap-4 py-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Timeline dot */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-sm">
              {num}
            </div>
            {/* Content */}
            <div className="flex-1 rounded-xl border bg-card p-4 space-y-1">
              <h2 className="font-semibold">{t[titleKey] as string}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t[descKey] as string}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
