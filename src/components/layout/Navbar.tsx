import { Link } from "react-router-dom";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="container flex h-14 items-center px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Timer className="size-5 text-primary" />
          <span>Trackly</span>
        </Link>
      </div>
    </header>
  );
}
