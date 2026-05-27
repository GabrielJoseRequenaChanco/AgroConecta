import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { MLTimeline } from "@/components/dashboard/MLTimeline";
import { formatSoles } from "@/lib/format";
import { Phone, Truck, MapPin, CheckCircle2 } from "lucide-react";
import type { OrderStatus } from "@/context/types";

export const Route = createFileRoute("/dashboard/comprador")({
  component: CompradorDashboard,
});

const STEPS: { label: string; status: OrderStatus }[] = [
  { label: "Trato hecho", status: "pendiente_flete" },
  { label: "Cargando en chacra", status: "flete_asignado" },
  { label: "En carretera central", status: "en_transito" },
  { label: "Entregado", status: "entregado" },
];

function getStepIndex(s: OrderStatus) {
  return STEPS.findIndex((st) => st.status === s);
}

function CompradorDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const ordenes = useAppStore((s) => s.ordenes).filter(
    (o) => o.compradorId === usuario.id
  );
  const completar = useAppStore((s) => s.completarEntrega);

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-5 space-y-5">
      <header className="bg-card border border-border rounded-md p-5">
        <h1 className="text-xl font-bold">{usuario.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          <MapPin className="w-3 h-3 inline" /> {usuario.ubicacion}
        </p>
      </header>

      <h2 className="text-lg font-bold">Mis compras</h2>

      {ordenes.length === 0 ? (
        <div className="bg-card border border-border rounded-md p-10 text-center text-muted-foreground">
          Aún no tienes compras. Ve al marketplace y reserva tu primera cosecha.
        </div>
      ) : (
        <div className="space-y-3">
          {ordenes.map((o) => {
            const idxActual = getStepIndex(o.status);
            const steps = STEPS.map((s, i) => ({
              label: s.label,
              done: i < idxActual || o.status === "entregado",
              active: i === idxActual && o.status !== "entregado",
            }));

            return (
              <article
                key={o.id}
                className="bg-card border border-border rounded-md p-4 space-y-3"
              >
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <div>
                    <div className="font-bold">{o.tituloProducto}</div>
                    <div className="text-xs text-muted-foreground">
                      Orden {o.id} · {new Date(o.fechaCreacion).toLocaleDateString("es-PE")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      {formatSoles(o.totalPagoProducto + o.totalPagoFlete)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.cantidadComprada} kg → {o.distritoDestino}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                    <Phone className="w-4 h-4 text-success" />
                    Agricultor: <strong>+51 964 123 456</strong>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                    <Truck className="w-4 h-4 text-earth" />
                    {o.nombreTransportista
                      ? `Transportista: ${o.nombreTransportista} · +51 974 887 990`
                      : "Buscando transportista en la bolsa de fletes..."}
                  </div>
                </div>

                <MLTimeline steps={steps} />

                {o.status === "en_transito" && (
                  <button
                    onClick={() => completar(o.id)}
                    className="w-full bg-success text-success-foreground font-bold py-3 rounded-md tap-target inline-flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirmar entrega y calificar
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
