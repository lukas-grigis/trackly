import { useState } from "react";
import { useSessionStore } from "@/store/session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import SessionCard from "@/components/session/SessionCard";

export default function HomePage() {
  const sessions = useSessionStore((s) => s.sessions);
  const addSession = useSessionStore((s) => s.addSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  function handleCreate() {
    if (!name.trim()) return;
    addSession(name.trim(), date);
    setName("");
    setDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Session erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="session-name">Name</Label>
                <Input
                  id="session-name"
                  placeholder="z.B. Sportfest 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-date">Datum</Label>
                <Input
                  id="session-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Noch keine Sessions vorhanden. Erstelle eine neue Session um loszulegen.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={deleteSession}
            />
          ))}
        </div>
      )}
    </div>
  );
}
