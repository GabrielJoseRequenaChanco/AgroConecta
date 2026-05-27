import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useAppStore } from "@/context/useAppStore";
import { formatSoles, calcularFlete } from "@/lib/format";
import confetti from "canvas-confetti";
import { Truck, Wallet, CheckCircle2, Smartphone, Banknote } from "lucide-react";

const searchSchema = z.object({
  productoId: z.string().optional(),
  cantidad: z.string().optional(),
  destino: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  component: Checkout,
});

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
      <div className="max-w-2xl mx-auto p-8 text-center text-muted-foreground">
        No hay producto seleccionado.{" "}
        <Link to="/productos" className="text-primary">
          Ir al marketplace
        </Link>
      </div>
    );
  }

  const kg = Math.max(1, Number(cantidad) || 50);
  const dest = (destino as string) || "Huancayo";
  const subtotal = producto.precioPerKg * kg;
  const flete = calcularFlete(dest, kg);
  const total = subtotal + flete;

  const confirmar = () => {
    const ordenId = createOrden(
      {
        productoId: producto.id,
        tituloProducto: producto.titulo,
        compradorId: usuario.id,
        nombreComprador: usuario.nombre,
        agricultorId: producto.agricultorId,
        cantidadComprada: kg,
        totalPagoProducto: subtotal,
        totalPagoFlete: flete,
        distritoDestino: dest,
        fechaCreacion: new Date().toISOString(),
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
      particleCount: 180,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#316e2b", "#5e8c31", "#84602b", "#f1c40f"],
    });
  };

  if (confirmado) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>
        <h1 className="text-3xl font-bold mt-4">¡Trato cerrado!</h1>
        <p className="text-muted-foreground mt-2">
          Hemos notificado a <strong>{producto.nombreAgricultor}</strong> y publicado el
          flete en la bolsa de transportistas de Junín.
        </p>
        <div className="bg-card border border-border rounded-md p-5 mt-6 text-left text-sm space-y-2">
          <Row k="Orden" v={confirmado} />
          <Row k="Cosecha" v={producto.titulo} />
          <Row k="Cantidad" v={`${kg} kg`} />
          <Row k="Destino" v={dest} />
          <Row k="Total" v={formatSoles(total)} bold />
        </div>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to="/dashboard/comprador"
            className="bg-primary text-primary-foreground px-5 py-3 rounded-md font-semibold tap-target"
          >
            Ver mi panel
          </Link>
          <Link
            to="/productos"
            className="border border-primary text-primary px-5 py-3 rounded-md font-semibold tap-target"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6">
      {/* Stepper */}
      <ol className="flex items-center justify-center gap-3 mb-6 text-sm">
        {[
          { n: 1, t: "Pedido" },
          { n: 2, t: "Logística" },
          { n: 3, t: "Pago" },
        ].map((s, i) => (
          <li key={s.n} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                paso >= s.n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s.n}
            </div>
            <span
              className={paso === s.n ? "font-semibold" : "text-muted-foreground"}
            >
              {s.t}
            </span>
            {i < 2 && <div className="w-8 h-px bg-border" />}
          </li>
        ))}
      </ol>

      <div className="bg-card border border-border rounded-md p-5 space-y-4">
        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg">1. Detalle del pedido</h2>
            <div className="flex gap-3 border border-border rounded-md p-3">
              <img
                src={producto.imagenUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-sm"
              />
              <div className="flex-1 text-sm">
                <div className="font-semibold">{producto.titulo}</div>
                <div className="text-muted-foreground">
                  {producto.nombreAgricultor} · {producto.distritoOrigen}
                </div>
                <div className="mt-1">
                  {kg} kg × {formatSoles(producto.precioPerKg)} ={" "}
                  <strong>{formatSoles(subtotal)}</strong>
                </div>
              </div>
            </div>
            <button
              onClick={() => setPaso(2)}
              className="w-full bg-success text-success-foreground font-bold py-3 rounded-md tap-target"
            >
              Continuar a logística
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg">2. Logística y transporte</h2>
            <div className="border border-border rounded-md p-4 flex gap-3 bg-muted/40">
              <Truck className="w-8 h-8 text-earth shrink-0" />
              <div className="text-sm flex-1">
                <div className="font-semibold">
                  Camión asignado por el sistema
                </div>
                <div className="text-muted-foreground">
                  Lucho Chanco · Camión Baranda 4 Toneladas
                </div>
                <div className="mt-1">
                  Ruta: <strong>{producto.distritoOrigen}</strong> →{" "}
                  <strong>{dest}</strong>
                </div>
                <div className="mt-1">
                  Tarifa fija de flete:{" "}
                  <strong className="text-earth">{formatSoles(flete)}</strong>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 border border-input py-3 rounded-md tap-target"
              >
                Atrás
              </button>
              <button
                onClick={() => setPaso(3)}
                className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-md tap-target"
              >
                Continuar al pago
              </button>
            </div>
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg">3. Método de pago seguro</h2>
            <div className="space-y-2">
              <MetodoOption
                value="yape"
                metodo={metodo}
                setMetodo={setMetodo}
                icon={<Smartphone className="w-5 h-5 text-primary" />}
                label="Yape / Plin"
                desc="Escanea el QR del agricultor"
              />
              <MetodoOption
                value="transferencia"
                metodo={metodo}
                setMetodo={setMetodo}
                icon={<Banknote className="w-5 h-5 text-primary" />}
                label="Transferencia / Caja Huancayo"
                desc="Transferencia bancaria verificada"
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

            <div className="border-t border-border pt-3 text-sm space-y-1">
              <Row k="Subtotal cosecha" v={formatSoles(subtotal)} />
              <Row k="Flete" v={formatSoles(flete)} />
              <Row k="Total" v={formatSoles(total)} bold />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaso(2)}
                className="flex-1 border border-input py-3 rounded-md tap-target"
              >
                Atrás
              </button>
              <button
                onClick={confirmar}
                className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-md tap-target"
              >
                Confirmar y reservar operación
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between ${bold ? "text-base font-bold text-primary" : ""}`}
    >
      <span className={bold ? "" : "text-muted-foreground"}>{k}</span>
      <span>{v}</span>
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
      className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer tap-target ${
        active ? "border-primary bg-accent" : "border-border"
      }`}
    >
      <input
        type="radio"
        checked={active}
        onChange={() => setMetodo(value)}
        className="accent-primary"
      />
      {icon}
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}
