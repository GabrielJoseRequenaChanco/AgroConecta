import { createFileRoute } from "@tanstack/react-router";
import Fletes from "@/components/pages/Fletes";

export const Route = createFileRoute("/fletes")({
  component: Fletes,
});
