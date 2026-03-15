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

      <div className="space-y-4">
        {STEPS.map(({ num, titleKey, descKey }) => (
          <div
            key={titleKey}
            className="rounded-xl border p-4 space-y-1"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {num}
              </span>
              <h2 className="font-semibold">{t[titleKey]}</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-11">
              {t[descKey]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
