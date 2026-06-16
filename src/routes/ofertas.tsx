import { createFileRoute } from "@tanstack/react-router";
import Ofertas from "@/components/pages/Ofertas";

export const Route = createFileRoute("/ofertas")({
  component: Ofertas,
});
