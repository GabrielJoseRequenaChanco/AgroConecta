import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAppStore } from "@/context/useAppStore";
import { formatSoles, calcularFlete } from "@/lib/format";
import confetti from "canvas-confetti";
import {
  Truck,
  Wallet,
  CheckCircle2,
  Smartphone,
  Banknote,
  ChevronRight,
  MapPin,
  Package,
  Shield,
} from "lucide-react";

const searchSchema = z.object({
  productoId: z.string().optional(),
  cantidad: z.string().optional(),
  destino: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  component: Checkout,
});

const STEPS = [
  { n: 1, label: "Pedido" },
  { n: 2, label: "Logística" },
  { n: 3, label: "Pago" },
];

function Checkout() {
  const { productoId, cantidad, destino } = Route.useSearch();
  const router = useRouter();
  const producto = useAppStore((s) =>
    s.productos.find((p) => p.id === productoId)
  );
  const usuario = useAppStore((s) => s.usuarioActivo);
  const createOrden = useAppStore((s) => s.createOrden);

  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [metodo, setMetodo] = useState("yape");
  const [confirmado, setConfirmado] = useState<string | null>(null);

  if (!producto) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <p className="text-muted-foreground">
          No hay producto seleccionado.{" "}
          <Link to="/productos" className="text-primary font-semibold hover:underline">
            Ir al marketplace
          </Link>
        </p>
      </div>
    );
  }

  const kg = Math.max(1, Number(cantidad) || 50);
  const dest = (destino as string) || "Huancayo";
  const subtotal = producto.precioPerKg * kg;
  const flete = calcularFlete(dest, kg);
  const total = subtotal + flete;

    const confirmar = async () => {
      const ordenId = await createOrden(
      {
        productoId: producto.id,
        tituloProducto: producto.titulo,
        precioUnitario: producto.precioPerKg,
        cantidadComprada: kg,
        totalPagoProducto: subtotal,
        totalPagoFlete: flete,
          distritoOrigen: producto.distritoOrigen,
        distritoDestino: dest,
        agricultorId: producto.agricultorId,
        nombreAgricultor: producto.nombreAgricultor,
        telefonoAgricultor: producto.telefonoAgricultor,
      },
      {
        origen: `Chacra sector ${producto.distritoOrigen}`,
        destino: dest,
        tarifa: flete,
        descripcion: `${kg} kg de ${producto.titulo}`,
      }
    );
    setConfirmado(ordenId);
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.55 },
      colors: ["#316e2b", "#5e8c31", "#84602b", "#f1c40f", "#fff"],
    });
  };

  if (confirmado) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mt-5 text-foreground">¡Trato cerrado!</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Notificamos a <strong className="text-foreground">{producto.nombreAgricultor}</strong> y
          publicamos el flete en la bolsa de transportistas de Junín.
        </p>

        <div className="bg-card border border-border rounded-xl p-5 mt-6 text-left text-sm space-y-2.5">
          <SummaryRow label="N° de orden" value={confirmado} mono />
          <SummaryRow label="Cosecha" value={producto.titulo} />
          <SummaryRow label="Cantidad" value={`${kg} kg`} />
          <SummaryRow label="Destino" value={dest} />
          <div className="border-t border-border pt-2.5">
            <SummaryRow label="Total pagado" value={formatSoles(total)} bold />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to="/dashboard/comprador"
            className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm tap-target hover:opacity-90 transition-opacity"
          >
            Ver mi panel
          </Link>
          <Link
            to="/productos"
            className="border border-primary text-primary px-5 py-3 rounded-xl font-semibold text-sm tap-target hover:bg-accent transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
      {/* Stepper */}
      <nav className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  paso > s.n
                    ? "bg-success text-success-foreground"
                    : paso === s.n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {paso > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <span
                className={`text-sm font-medium ${
                  paso === s.n ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 h-px transition-colors ${
                  paso > s.n ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </nav>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5">
        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Detalle del pedido</h2>

            <div className="flex gap-4 border border-border rounded-xl p-4 bg-background">
              <img
                src={producto.imagenUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 text-sm min-w-0">
                <div className="font-bold text-foreground">{producto.titulo}</div>
                <div className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {producto.nombreAgricultor} · {producto.distritoOrigen}
                </div>
                <div className="mt-2 text-foreground">
                  {kg} kg × {formatSoles(producto.precioPerKg)} ={" "}
                  <strong>{formatSoles(subtotal)}</strong>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {Math.ceil(kg / 50)} saco(s) de 50 kg · entrega a {dest}
                </div>
              </div>
            </div>

            <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex gap-2 text-sm text-success">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Compra protegida. Si el producto no llega en condiciones, te devolvemos el pago.
              </span>
            </div>

            <button
              onClick={() => setPaso(2)}
              className="w-full bg-success text-success-foreground font-bold py-3.5 rounded-xl tap-target hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Continuar a logística <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Logística y transporte</h2>

            <div className="border border-border rounded-xl p-4 flex gap-4 bg-background">
              <div className="w-12 h-12 bg-earth/10 rounded-xl flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-earth" />
              </div>
              <div className="text-sm flex-1">
                <div className="font-bold text-foreground">Camión asignado por el sistema</div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  Lucho Chanco · Baranda Mitsubishi 4 T · Placa W1X-728
                </div>
                <div className="mt-2 text-foreground flex items-center gap-2 text-xs">
                  <span className="font-medium">{producto.distritoOrigen}</span>
                  <span className="text-muted-foreground">→→→ 🚚 →→→</span>
                  <span className="font-medium">{dest}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tarifa fija de flete:</span>
                  <span className="font-bold text-earth">{formatSoles(flete)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Tiempo estimado</div>
                <div className="font-bold text-foreground">3-6 horas</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Seguro de carga</div>
                <div className="font-bold text-success">Incluido ✓</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 border border-input py-3 rounded-xl tap-target text-sm font-medium hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => setPaso(3)}
                className="flex-2 flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl tap-target hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Continuar al pago <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Método de pago</h2>

            <div className="space-y-2">
              <MetodoOption
                value="yape"
                metodo={metodo}
                setMetodo={setMetodo}
                icon={<Smartphone className="w-5 h-5 text-primary" />}
                label="Yape / Plin"
                desc="Escanea el QR del agricultor al cerrar el trato"
              />
              <MetodoOption
                value="transferencia"
                metodo={metodo}
                setMetodo={setMetodo}
                icon={<Banknote className="w-5 h-5 text-primary" />}
                label="Transferencia bancaria"
                desc="BCP, Interbank o Caja Huancayo — verificado"
              />
              <MetodoOption
                value="contraentrega"
                metodo={metodo}
                setMetodo={setMetodo}
                icon={<Wallet className="w-5 h-5 text-primary" />}
                label="Pago contra entrega"
                desc="Pagas al transportista al recibir la carga"
              />
            </div>

            <div className="border border-border rounded-xl p-4 text-sm space-y-2 bg-background">
              <SummaryRow label="Subtotal cosecha" value={formatSoles(subtotal)} />
              <SummaryRow label={`Flete a ${dest}`} value={formatSoles(flete)} />
              <div className="border-t border-border pt-2">
                <SummaryRow label="Total a pagar" value={formatSoles(total)} bold />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaso(2)}
                className="flex-1 border border-input py-3 rounded-xl tap-target text-sm font-medium hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={confirmar}
                className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl tap-target hover:opacity-90 transition-opacity"
              >
                Confirmar y cerrar trato
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-primary" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}

function MetodoOption({
  value,
  metodo,
  setMetodo,
  icon,
  label,
  desc,
}: {
  value: string;
  metodo: string;
  setMetodo: (v: string) => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  const active = metodo === value;
  return (
    <label
      className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer tap-target transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground"
      }`}
    >
      <input
        type="radio"
        checked={active}
        onChange={() => setMetodo(value)}
        className="accent-primary"
      />
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? "bg-primary/10" : "bg-muted"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}