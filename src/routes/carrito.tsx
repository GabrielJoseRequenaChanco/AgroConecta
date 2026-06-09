import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/carrito")({
  component: Carrito,
});

function Carrito() {
  // For demo purposes, the store currently doesn't track cart items separately.
  // We'll show a placeholder and the list of orders (purchased) as 'compras'.
  const ordenes = useAppStore((s) => s.ordenes);

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-6">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Inicio</Link>
        {" › "}
        <span className="text-foreground">Carrito</span>
      </nav>

      <h2 className="text-xl font-bold mb-4">Carrito / Compras</h2>
      {ordenes.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-6">Tu carrito está vacío.</div>
      ) : (
        <ul className="space-y-3">
          {ordenes.map((o) => (
            <li key={o.id} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{o.tituloProducto}</div>
                  <div className="text-sm text-muted-foreground">{o.cantidadComprada} kg · {o.nombreAgricultor}</div>
                </div>
                <div className="text-right">S/ {o.totalPagoProducto + o.totalPagoFlete}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Carrito;
