import type { DisciplineType } from "@/store/session-store";
import { DISCIPLINE_OPTIONS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisciplineSelectProps {
  value: DisciplineType | "";
  onChange: (value: DisciplineType) => void;
}

export default function DisciplineSelect({
  value,
  onChange,
}: DisciplineSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as DisciplineType)}
    >
      <SelectTrigger className="w-full sm:w-60">
        <SelectValue placeholder="Select discipline" />
      </SelectTrigger>
      <SelectContent>
        {DISCIPLINE_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
