import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const AthletesPage = lazy(() => import('@/pages/AthletesPage'));
const AthletePage = lazy(() => import('@/pages/AthletePage'));
const SessionPage = lazy(() => import('@/pages/SessionPage'));
const RacePage = lazy(() => import('@/pages/RacePage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const HowToPage = lazy(() => import('@/pages/HowToPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// eslint-disable-next-line react-refresh/only-export-components
export const ROUTES = {
  HOME: '/',
  SESSIONS: '/sessions',
  ATHLETES: '/athletes',
  ATHLETE: (id: string) => `/athlete/${id}`,
  SESSION: (id: string) => `/session/${id}`,
  RACE: (id: string, discipline: string) => `/session/${id}/race/${discipline}`,
  LEADERBOARD: (id: string) => `/session/${id}/leaderboard`,
  HOW_TO: '/how-to',
} as const;

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <HashRouter>
      <AppLayout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sessions" element={<HomePage />} />
            <Route path="/athletes" element={<AthletesPage />} />
            <Route path="/athlete/:id" element={<AthletePage />} />
            <Route path="/session/:id" element={<SessionPage />} />
            <Route path="/session/:id/race/:discipline" element={<RacePage />} />
            <Route path="/session/:id/leaderboard" element={<LeaderboardPage />} />
            <Route path="/how-to" element={<HowToPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </HashRouter>
  );
}
