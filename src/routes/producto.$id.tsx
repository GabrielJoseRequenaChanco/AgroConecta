import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { MLReputationBar } from "@/components/product-detail/MLReputationBar";
import { formatSoles, formatKg, calcularFlete } from "@/lib/format";
import { Truck, ShieldCheck, Star, ShoppingCart, Plus, Minus } from "lucide-react";

export const Route = createFileRoute("/producto/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const producto = useAppStore((s) => s.productos.find((p) => p.id === id));
  const [cantidad, setCantidad] = useState(50);
  const [destino, setDestino] = useState<"Huancayo" | "Concepción" | "Jauja" | "Lima">(
    "Huancayo"
  );

  if (!producto) {
    return (
      <div className="max-w-[1200px] mx-auto p-8 text-center">
        <p className="text-muted-foreground">Cosecha no encontrada.</p>
        <Link to="/productos" className="text-primary hover:underline">
          Volver al marketplace
        </Link>
      </div>
    );
  }

  const flete = calcularFlete(destino, cantidad);
  const subtotal = producto.precioPerKg * cantidad;

  const irACheckout = () => {
    router.navigate({
      to: "/checkout",
      search: {
        productoId: producto.id,
        cantidad: String(cantidad),
        destino,
      } as any,
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
      {/* Breadcrumb */}
      <div className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">
          Inicio
        </Link>{" "}
        ›{" "}
        <Link to="/productos" className="hover:underline">
          {producto.rubro}
        </Link>{" "}
        › <span className="text-foreground">{producto.variedad}</span>
      </div>

      <div className="bg-card border border-border rounded-md p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Galería + descripción */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-square border border-border rounded-sm overflow-hidden bg-muted"
                >
                  <img
                    src={producto.imagenUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              ))}
            </div>
            <div className="flex-1 aspect-square bg-muted rounded-md overflow-hidden">
              <img
                src={producto.imagenUrl}
                alt={producto.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Descripción de la cosecha
            </h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {producto.descripcion}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-y-2 gap-x-4 text-sm border-t border-border pt-4">
              <dt className="text-muted-foreground">Rubro</dt>
              <dd className="text-foreground font-medium">{producto.rubro}</dd>
              <dt className="text-muted-foreground">Variedad</dt>
              <dd className="text-foreground font-medium">{producto.variedad}</dd>
              <dt className="text-muted-foreground">Distrito de origen</dt>
              <dd className="text-foreground font-medium">
                {producto.distritoOrigen}, Concepción
              </dd>
              <dt className="text-muted-foreground">Fecha de cosecha</dt>
              <dd className="text-foreground font-medium">{producto.fechaCosecha}</dd>
              <dt className="text-muted-foreground">Empaque</dt>
              <dd className="text-foreground font-medium">Sacos de 50 kg</dd>
            </dl>
          </div>
        </div>

        {/* Caja sticky */}
        <aside className="lg:sticky lg:top-28 lg:self-start space-y-3">
          <div className="border border-border rounded-md p-4 bg-white space-y-3">
            <div className="text-xs text-muted-foreground">
              Nuevo · +15 toneladas vendidas
            </div>
            <h1 className="text-xl font-semibold text-foreground leading-snug">
              {producto.titulo}
            </h1>
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-success text-success" />
              <span className="font-semibold">
                {producto.reputacionAgricultor.toFixed(1)}
              </span>
              <span className="text-muted-foreground">(18 opiniones)</span>
            </div>

            <div className="text-4xl font-bold text-foreground leading-none">
              {formatSoles(producto.precioPerKg)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / kg
              </span>
            </div>
            <p className="text-sm text-success font-medium">
              Stock disponible: {formatKg(producto.volumenDisponible)}
            </p>

            {/* Cantidad */}
            <div>
              <label className="text-xs text-muted-foreground">
                Cantidad (kg)
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setCantidad((c) => Math.max(50, c - 50))}
                  className="border border-input rounded-sm w-10 h-10 flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(Math.max(1, Number(e.target.value) || 0))
                  }
                  className="flex-1 border border-input rounded-sm px-3 py-2 text-center h-10"
                />
                <button
                  onClick={() => setCantidad((c) => c + 50)}
                  className="border border-input rounded-sm w-10 h-10 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Equivale a {Math.ceil(cantidad / 50)} saco(s) de 50 kg
              </p>
            </div>

            {/* Simulador flete */}
            <div className="bg-muted/60 rounded-md p-3 space-y-2">
              <div className="flex items-center gap-2 text-earth font-semibold text-sm">
                <Truck className="w-4 h-4" />
                Calcular flete a tu negocio
              </div>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value as any)}
                className="w-full border border-input rounded-sm px-2 py-2 text-sm bg-white tap-target"
              >
                <option value="Huancayo">Huancayo</option>
                <option value="Concepción">Concepción</option>
                <option value="Jauja">Jauja</option>
                <option value="Lima">Lima</option>
              </select>
              <p className="text-xs text-foreground">
                Flete estimado con transportista AgroConecta:{" "}
                <span className="font-bold">{formatSoles(flete)}</span>
              </p>
            </div>

            <div className="text-sm border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal cosecha</span>
                <span className="font-semibold">{formatSoles(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flete</span>
                <span className="font-semibold">{formatSoles(flete)}</span>
              </div>
              <div className="flex justify-between text-base mt-1">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">
                  {formatSoles(subtotal + flete)}
                </span>
              </div>
            </div>

            <button
              onClick={irACheckout}
              disabled={producto.status !== "disponible"}
              className="w-full bg-success text-success-foreground font-bold py-3 rounded-md hover:opacity-90 tap-target disabled:opacity-50"
            >
              {producto.status === "disponible"
                ? "Comprar cosecha ahora"
                : "Reservada"}
            </button>
            <button className="w-full border border-primary text-primary font-semibold py-3 rounded-md hover:bg-accent tap-target flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Agregar al carrito
            </button>
          </div>

          {/* Reputación */}
          <div className="border border-border rounded-md p-4 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <div>
                <div className="text-sm font-semibold">
                  {producto.nombreAgricultor}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Productor verificado · {producto.distritoOrigen}
                </div>
              </div>
            </div>
            <MLReputationBar
              nivel={Math.min(5, Math.round(producto.reputacionAgricultor)) as any}
            />
            <ul className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <li>✓ 100% transacciones exitosas</li>
              <li>✓ Precios transparentes garantizados</li>
              <li>✓ Identidad validada con DNI</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
