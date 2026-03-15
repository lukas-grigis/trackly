import { HashRouter, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import AthletesPage from "@/pages/AthletesPage";
import SessionPage from "@/pages/SessionPage";
import RacePage from "@/pages/RacePage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import HowToPage from "@/pages/HowToPage";
import NotFoundPage from "@/pages/NotFoundPage";

// eslint-disable-next-line react-refresh/only-export-components
export const ROUTES = {
  HOME: "/",
  SESSIONS: "/sessions",
  ATHLETES: "/athletes",
  SESSION: (id: string) => `/session/${id}`,
  RACE: (id: string, discipline: string) => `/session/${id}/race/${discipline}`,
  LEADERBOARD: (id: string) => `/session/${id}/leaderboard`,
  HOW_TO: "/how-to",
} as const;

export default function AppRoutes() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sessions" element={<HomePage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/race/:discipline" element={<RacePage />} />
          <Route path="/session/:id/leaderboard" element={<LeaderboardPage />} />
          <Route path="/how-to" element={<HowToPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
