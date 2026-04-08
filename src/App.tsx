import { useEffect } from 'react';
import AppRoutes from '@/routes';
import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/use-theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ThemeInitializer() {
  const { isDark } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return null;
}

function ThemedToaster() {
  const { isDark } = useTheme();
  return <Toaster theme={isDark ? 'dark' : 'light'} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeInitializer />
      <AppRoutes />
      <ThemedToaster />
    </ErrorBoundary>
  );
}
