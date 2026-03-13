import { HashRouter, Route, Routes } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import SessionPage from "@/pages/SessionPage";
import RacePage from "@/pages/RacePage";

export const ROUTES = {
  HOME: "/",
  SESSION: (id: string) => `/session/${id}`,
  RACE: (id: string) => `/session/${id}/race`,
} as const;

export default function AppRoutes() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/race" element={<RacePage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
