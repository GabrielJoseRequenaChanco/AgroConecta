import { Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";

export default function Carrito() {
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
        <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
          Tu carrito está vacío.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordenes.map((o) =>
            o?.id ? (
              <li key={o.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{o.tituloProducto ?? "Sin título"}</div>
                    <div className="text-sm text-muted-foreground">
                      {o.cantidadComprada ?? 0} kg · {o.nombreAgricultor ?? "N/A"}
                    </div>
                  </div>
                  <div className="text-right font-bold">
                    S/{" "}
                    {(
                      (o.totalPagoProducto ?? 0) + (o.totalPagoFlete ?? 0)
                    ).toFixed(2)}
                  </div>
                </div>
              </li>
            ) : null
          )}
        </ul>
      )}
    </div>
  );
}
