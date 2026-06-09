import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/agregar-producto")({
  component: AgregarProducto,
});

function AgregarProducto() {
  const addProducto = useAppStore((s) => s.addProducto);
  const usuario = useAppStore((s) => s.usuarioActivo);

  const [titulo, setTitulo] = useState("");

  if (usuario.rol !== "agricultor") {
    return (
      <div className="max-w-[800px] mx-auto p-6">
        <p className="text-muted-foreground">Debes ser agricultor para agregar productos.</p>
        <Link to="/registro" className="text-primary underline">Crear cuenta</Link>
      </div>
    );
  }

  const submit = () => {
    if (!titulo) return;
    addProducto({ titulo, rubro: "Tubérculos", variedad: "Variedad", volumenDisponible: 100, precioPerKg: 1.0, distritoOrigen: "Aco", imagenUrl: "", fechaCosecha: new Date().toISOString(), descripcion: "" });
    setTitulo("");
  };

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Agregar producto</h2>
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" className="w-full border px-3 py-2 mb-3" />
      <button onClick={submit} className="bg-primary text-primary-foreground px-4 py-2 rounded">Guardar</button>
    </div>
  );
}

export default AgregarProducto;
