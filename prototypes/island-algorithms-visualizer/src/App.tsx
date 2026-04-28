import { AppShell } from "@/components/layout/AppShell";
import { usePlayback } from "@/hooks/usePlayback";

export default function App() {
  usePlayback();
  return <AppShell />;
}
