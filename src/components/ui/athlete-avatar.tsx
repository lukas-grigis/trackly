import { cn } from "@/lib/utils";

interface AthleteAvatarProps {
  name: string;
  avatarBase64?: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
} as const;

export function AthleteAvatar({ name, avatarBase64, size = "md", className }: AthleteAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initial = name.trim().charAt(0).toUpperCase();

  if (avatarBase64) {
    return (
      <img
        src={avatarBase64}
        alt={initial}
        className={cn("shrink-0 rounded-full object-cover", sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold",
        sizeClass,
        className,
      )}
    >
      {initial}
    </span>
  );
}
