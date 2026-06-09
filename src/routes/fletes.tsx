import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/fletes")({
  component: Fletes,
});

function Fletes() {
  const fletes = useAppStore((s) => s.fletes);

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Inicio</Link>
        {" › "}
        <span className="text-foreground">Bolsa de fletes</span>
      </nav>

      <h2 className="text-xl font-bold mb-4">Fletes disponibles</h2>
      {fletes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6">No hay fletes disponibles.</div>
      ) : (
        <ul className="space-y-3">
          {fletes.map((f) => (
            <li key={f.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{f.productoDescripcion}</div>
                  <div className="text-sm text-muted-foreground">{f.origen} → {f.destino}</div>
                </div>
                <div className="text-right"><div className="font-bold">S/ {f.tarifaPropuesta}</div><div className="text-sm text-muted-foreground">{f.status}</div></div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Fletes;
