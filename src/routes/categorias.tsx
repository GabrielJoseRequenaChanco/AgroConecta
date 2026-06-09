import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { MLProductCard } from "@/components/marketplace/MLProductCard";
import { Rubro } from "@/context/types";

export const Route = createFileRoute("/categorias")({
  component: Categorias,
});

function Categorias() {
  const productos = useAppStore((s) => s.productos);

  const categorias: Rubro[] = ["Tubérculos", "Cereales", "Hortalizas", "Frutas", "Legumbres"];

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Inicio</Link>
        {" › "}
        <span className="text-foreground">Categorías</span>
      </nav>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <aside className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-bold mb-3">Categorías</h3>
          <ul className="space-y-2 text-sm">
            {categorias.map((c) => (
              <li key={c} className="hover:underline">
                <a href={`/productos?filtro=${encodeURIComponent(c)}`}>{c}</a>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          <h2 className="text-xl font-bold mb-4">Cosechas por categoría</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {productos.map((p) => (
              <MLProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Categorias;
