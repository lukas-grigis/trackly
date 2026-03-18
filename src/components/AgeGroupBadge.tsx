import { getAgeGroup } from '@/lib/utils';

export function AgeGroupBadge({ yearOfBirth, referenceYear }: { yearOfBirth?: number; referenceYear?: number }) {
  if (!yearOfBirth) return null;
  return (
    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
      {getAgeGroup(yearOfBirth, referenceYear)}
    </span>
  );
}
