import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
