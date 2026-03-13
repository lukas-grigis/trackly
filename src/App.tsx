import AppRoutes from "@/routes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}
