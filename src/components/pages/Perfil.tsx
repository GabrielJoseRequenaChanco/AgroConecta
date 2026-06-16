import { useAppStore } from "@/context/useAppStore";
import { Link } from "@tanstack/react-router";

export default function Perfil() {
  const usuario = useAppStore((s) => s.usuarioActivo);

  if (usuario.rol === "anon") {
    return (
      <div className="max-w-[800px] mx-auto p-6">
        <p className="text-muted-foreground">No has iniciado sesión.</p>
        <Link to="/registro" className="text-primary underline">Crea una cuenta</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Mi perfil</h2>
      <div className="space-y-2">
        <div><strong>Nombre:</strong> {usuario.nombre}</div>
        <div><strong>Teléfono:</strong> {usuario.telefono}</div>
        <div><strong>Ubicación:</strong> {usuario.ubicacion}</div>
      </div>
    </div>
  );
}
