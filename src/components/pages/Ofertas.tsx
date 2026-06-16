import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { MLProductCard } from "@/components/marketplace/MLProductCard";

export default function Ofertas() {
  const productos = useAppStore((s) => s.productos);

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Inicio</Link>
        {" › "}
        <span className="text-foreground">Ofertas</span>
      </nav>

      <h2 className="text-xl font-bold mb-4">Ofertas destacadas</h2>
      {productos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay productos disponibles.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {productos.map((p) => p?.id ? <MLProductCard key={p.id} p={p} /> : null)}
        </div>
      )}
    </div>
  );
}
