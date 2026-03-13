import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { Session } from "@/store/session-store";

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
}

export default function SessionCard({ session, onDelete }: SessionCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={() => navigate(`/session/${session.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{session.name}</CardTitle>
            <CardDescription>{session.date}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Badge variant="secondary">{session.children.length} Athletes</Badge>
        <Badge variant="secondary">{session.results.length} Results</Badge>
      </CardContent>
    </Card>
  );
}
