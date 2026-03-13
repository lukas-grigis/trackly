import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import type { Child } from "@/store/session-store";
import { useSessionStore } from "@/store/session-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChildListProps {
  sessionId: string;
  children: Child[];
}

export default function ChildList({ sessionId, children }: ChildListProps) {
  const addChild = useSessionStore((s) => s.addChild);
  const removeChild = useSessionStore((s) => s.removeChild);
  const [name, setName] = useState("");
  const [yearOfBirth, setYearOfBirth] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const yob = yearOfBirth ? parseInt(yearOfBirth, 10) : undefined;
    addChild(sessionId, trimmed, yob);
    setName("");
    setYearOfBirth("");
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            placeholder="Athlete name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="w-28">
          <Input
            placeholder="Year"
            type="number"
            value={yearOfBirth}
            onChange={(e) => setYearOfBirth(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} size="icon" disabled={!name.trim()}>
          <UserPlus className="size-4" />
        </Button>
      </div>

      {/* List */}
      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No athletes added yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {children.map((child) => (
            <li
              key={child.id}
              className={cn(
                "flex items-center justify-between rounded-md border px-3 py-2"
              )}
            >
              <div>
                <span className="font-medium">{child.name}</span>
                {child.yearOfBirth && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({child.yearOfBirth})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeChild(sessionId, child.id)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
