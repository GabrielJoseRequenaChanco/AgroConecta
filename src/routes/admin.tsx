import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const users = useAppStore((s) => s.users);
  const verifyUser = useAppStore((s) => s.verifyUser);
  const router = useRouter();

  useEffect(() => {
    if (usuario.rol !== "admin") router.navigate({ to: "/registro" as any });
  }, [usuario, router]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Panel Admin - Usuarios</h2>
      <table className="w-full text-sm border-collapse">
        <thead className="text-left text-xs text-muted-foreground"><tr><th>Nombre</th><th>Rol</th><th>Verificado</th><th>Acciones</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t"><td className="py-2">{u.nombre || u.id}</td><td>{u.rol}</td><td>{u.isMidagriVerified ? "Sí" : "No"}</td><td>{!u.isMidagriVerified && <button onClick={() => verifyUser(u.id)} className="text-sm text-primary underline">Verificar</button>}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
