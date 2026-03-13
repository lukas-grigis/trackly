import { Link } from "react-router-dom";
import { CalendarDays, Users, BarChart3 } from "lucide-react";
import type { Session } from "@/store/session-store";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionCardProps {
  session: Session;
  onExport?: () => void;
}

export default function SessionCard({ session, onExport }: SessionCardProps) {
  return (
    <Link to={`/session/${session.id}`}>
      <Card
        className={cn(
          "transition-colors hover:border-primary/40 hover:shadow-md cursor-pointer"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{session.name}</CardTitle>
            <Badge variant="secondary">
              <Users className="size-3 mr-1" />
              {session.children.length}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {session.date}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <BarChart3 className="size-3" />
            <span>{session.results.length} results</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
