import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/components/pages/Admin";

export const Route = createFileRoute("/admin")({
  component: Admin,
});
