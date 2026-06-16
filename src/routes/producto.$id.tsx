import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { MLReputationBar } from "@/components/product-detail/MLReputationBar";
import { formatSoles, formatKg, calcularFlete } from "@/lib/format";
import {
  Truck,
  ShieldCheck,
  Star,
  ShoppingCart,
  Plus,
  Minus,
  MapPin,
  Calendar,
  Package,
  ChevronRight,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/producto/$id")({
  component: ProductDetail,
});

const DESTINOS = ["Huancayo", "Concepción", "Jauja", "Lima"] as const;
type Destino = (typeof DESTINOS)[number];

function ProductDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const producto = useAppStore((s) => s.productos.find((p) => p.id === id));
  const [cantidad, setCantidad] = useState(50);
  const [destino, setDestino] = useState<Destino>("Huancayo");
  const [imgIdx, setImgIdx] = useState(0);

  if (!producto) {
    return (
      <div className="max-w-[1200px] mx-auto p-12 text-center">
        <p className="text-4xl mb-4">🌾</p>
        <p className="text-muted-foreground font-medium">
          Esta cosecha no existe o ya fue vendida.
        </p>
        <Link
          to="/productos"
          className="mt-4 inline-flex items-center gap-1 text-primary font-semibold hover:underline"
        >
          Volver al marketplace <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const flete = calcularFlete(destino, cantidad);
  const subtotal = producto.precioPerKg * cantidad;
  const total = subtotal + flete;

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

  const changeCantidad = (delta: number) => {
    setCantidad((c) => Math.max(50, c + delta));
  };

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
        <Link to="/" className="hover:underline">Inicio</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/productos" className="hover:underline">{producto.rubro}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{producto.variedad}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Galería + descripción */}
        <div className="space-y-6">
          {/* Galería */}
          <div className="flex gap-3">
            <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`aspect-square border-2 rounded-lg overflow-hidden transition-colors ${
                    imgIdx === i
                      ? "border-primary"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <img
                    src={producto.imagenUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-90"
                  />
                </button>
              ))}
            </div>
            <div className="flex-1 aspect-square bg-muted rounded-xl overflow-hidden border border-border">
              <img
                src={producto.imagenUrl}
                alt={producto.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-bold text-foreground mb-3">
              Descripción de la cosecha
            </h2>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {producto.descripcion}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-y-3 gap-x-6 text-sm border-t border-border pt-4">
              {[
                { k: "Rubro", v: producto.rubro, icon: <Package className="w-3.5 h-3.5" /> },
                { k: "Variedad", v: producto.variedad, icon: <Package className="w-3.5 h-3.5" /> },
                {
                  k: "Distrito",
                  v: `${producto.distritoOrigen}, Concepción`,
                  icon: <MapPin className="w-3.5 h-3.5" />,
                },
                {
                  k: "Fecha cosecha",
                  v: producto.fechaCosecha,
                  icon: <Calendar className="w-3.5 h-3.5" />,
                },
                { k: "Empaque", v: "Sacos de 50 kg", icon: <Package className="w-3.5 h-3.5" /> },
                {
                  k: "Stock",
                  v: formatKg(producto.volumenDisponible),
                  icon: <Package className="w-3.5 h-3.5" />,
                },
              ].map(({ k, v, icon }) => (
                <div key={k}>
                  <dt className="flex items-center gap-1 text-muted-foreground text-xs mb-0.5">
                    {icon} {k}
                  </dt>
                  <dd className="text-foreground font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Sticky buy box */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-3">
          {/* Precio & compra */}
          <div className="border border-border rounded-xl p-5 bg-white space-y-4">
            <div className="text-xs text-muted-foreground font-medium">
              Nuevo · +15 toneladas vendidas
            </div>
            <h1 className="text-lg font-bold text-foreground leading-snug">
              {producto.titulo}
            </h1>
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(producto.reputacionAgricultor)
                        ? "fill-success text-success"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">
                {producto.reputacionAgricultor?.toFixed(1) ?? "N/A"}
              </span>
              <span className="text-xs text-muted-foreground">(18 opiniones)</span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                {formatSoles(producto.precioPerKg)}
              </span>
              <span className="text-sm text-muted-foreground">/ kg</span>
            </div>
            <p className="text-sm text-success font-semibold">
              ✓ Stock disponible: {formatKg(producto.volumenDisponible)}
            </p>

            {/* Cantidad */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Cantidad (kg)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeCantidad(-50)}
                  className="border border-input rounded-lg w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(Math.max(50, Number(e.target.value) || 50))
                  }
                  className="flex-1 border border-input rounded-lg px-3 py-2 text-center font-bold h-10"
                />
                <button
                  onClick={() => changeCantidad(50)}
                  className="border border-input rounded-lg w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                = {Math.ceil(cantidad / 50)} saco(s) de 50 kg
              </p>
            </div>

            {/* Simulador flete */}
            <div className="bg-muted/50 rounded-xl p-3.5 space-y-2.5 border border-border">
              <div className="flex items-center gap-2 text-sm font-semibold text-earth">
                <Truck className="w-4 h-4" />
                Calcular flete incluido
              </div>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value as Destino)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-white tap-target"
              >
                {DESTINOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <p className="text-xs text-foreground">
                Flete estimado:{" "}
                <span className="font-bold text-earth">{formatSoles(flete)}</span>
              </p>
            </div>

            {/* Resumen de precio */}
            <div className="text-sm space-y-1.5 border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal cosecha</span>
                <span className="text-foreground">{formatSoles(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Flete a {destino}</span>
                <span className="text-foreground">{formatSoles(flete)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatSoles(total)}</span>
              </div>
            </div>

            <button
              onClick={irACheckout}
              disabled={producto.status !== "disponible"}
              className="w-full bg-success text-success-foreground font-bold py-3.5 rounded-xl hover:opacity-90 active:scale-98 transition-all tap-target disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {producto.status === "disponible"
                ? "Comprar cosecha ahora"
                : "Cosecha reservada"}
            </button>
            <button className="w-full border border-primary text-primary font-semibold py-3 rounded-xl hover:bg-accent tap-target flex items-center justify-center gap-2 text-sm transition-colors">
              <ShoppingCart className="w-4 h-4" /> Guardar para después
            </button>
          </div>

          {/* Productor */}
          <div className="border border-border rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success font-bold text-lg shrink-0">
                {producto.nombreAgricultor[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-foreground leading-tight">
                  {producto.nombreAgricultor}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-success" />
                  Productor verificado · {producto.distritoOrigen}
                </div>
              </div>
            </div>

            <MLReputationBar
              nivel={Math.min(5, Math.round(producto.reputacionAgricultor)) as any}
            />

            <ul className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border">
              <li className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span>
                100% transacciones exitosas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span>
                Precios transparentes garantizados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-success font-bold">✓</span>
                Identidad validada con DNI
              </li>
            </ul>

            <a
              href="tel:+51964123456"
              className="flex items-center justify-center gap-2 w-full border border-border rounded-xl py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Phone className="w-4 h-4 text-success" />
              Contactar al productor
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}