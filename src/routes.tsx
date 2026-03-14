import { HashRouter, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import AthletesPage from "@/pages/AthletesPage";
import SessionPage from "@/pages/SessionPage";
import RacePage from "@/pages/RacePage";
import NotFoundPage from "@/pages/NotFoundPage";

export const ROUTES = {
  HOME: "/",
  ATHLETES: "/athletes",
  SESSION: (id: string) => `/session/${id}`,
  RACE: (id: string, discipline: string) => `/session/${id}/race/${discipline}`,
} as const;

export default function AppRoutes() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/race/:discipline" element={<RacePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
