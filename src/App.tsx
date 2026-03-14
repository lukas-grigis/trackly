import { useEffect } from "react";
import AppRoutes from "@/routes";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

function ThemeInitializer() {
  const { isDark } = useTheme();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return null;
}

export default function App() {
  return (
    <>
      <ThemeInitializer />
      <AppRoutes />
      <Toaster />
    </>
  );
}
