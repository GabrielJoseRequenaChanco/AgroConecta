import { createFileRoute, Link } from "@tanstack/react-router";
import Perfil from "@/components/pages/Perfil";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

// Perfil component moved to src/components/pages/Perfil.tsx

export default Perfil;
