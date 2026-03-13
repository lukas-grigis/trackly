import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col")}>
      <Navbar />
      <main className="flex-1 container px-4 py-6">{children}</main>
    </div>
  );
}
