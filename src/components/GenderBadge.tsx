import type { Gender } from "@/store/session-store";
import { useTranslation } from "@/lib/i18n";

const GENDER_ICONS: Record<Gender, string> = {
  male: "♂",
  female: "♀",
  nonbinary: "⚧",
};

export function GenderBadge({ gender }: { gender?: Gender }) {
  const { t } = useTranslation();
  if (!gender) return null;
  return (
    <span
      className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
      aria-label={t.genderLabels[gender]}
      title={t.genderLabels[gender]}
    >
      {GENDER_ICONS[gender]}
    </span>
  );
}

/** Inline variant for timing buttons — no background, smaller text */
export function GenderBadgeInline({ gender }: { gender?: Gender }) {
  const { t } = useTranslation();
  if (!gender) return null;
  return (
    <span
      className="text-[10px] font-normal opacity-70"
      aria-label={t.genderLabels[gender]}
      title={t.genderLabels[gender]}
    >
      {GENDER_ICONS[gender]}
    </span>
  );
}
