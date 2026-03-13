import { HashRouter, Route, Routes } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import SessionPage from "@/pages/SessionPage";
import RacePage from "@/pages/RacePage";

export default function AppRoutes() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:id" element={<SessionPage />} />
        <Route path="/session/:id/race" element={<RacePage />} />
      </Routes>
    </HashRouter>
  );
}
