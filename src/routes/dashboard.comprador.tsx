import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { useEffect } from "react";
import { MLTimeline } from "@/components/dashboard/MLTimeline";
import { formatSoles, formatKg } from "@/lib/format";
import {
  Phone,
  Truck,
  MapPin,
  CheckCircle2,
  Package,
  ShoppingBasket,
  Calendar,
  DollarSign,
  User,
  Info,
  Clock,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { OrderStatus } from "@/context/types";

export const Route = createFileRoute("/dashboard/comprador")({
  component: CompradorDashboard,
});

const STEPS: { label: string; status: OrderStatus }[] = [
  { label: "Pago Custodiado", status: "PAGO_EN_CUSTODIA" },
  { label: "En Camino", status: "EN_CAMINO" },
  { label: "Entregado", status: "ENTREGADO" },
  { label: "Liquidado", status: "COMPLETADO" },
];

function getStepIndex(s: OrderStatus): number {
  // Map legacy statuses if any exist in DB
  if (s === "pendiente_flete") return 0;
  if (s === "flete_asignado" || s === "cargando_origen" || s === "en_transito") return 1;
  if (s === "por_confirmar" || s === "entregado") return 2;
  if (s === "completado") return 3;
  
  return STEPS.findIndex((st) => st.status === s);
}

function CompradorDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  useEffect(() => {
    if (usuario.rol !== "comprador") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);

  const ordenes = useAppStore((s) => s.ordenes).filter(
    (o) => o.compradorId === usuario.id
  );

  const totalGastado = ordenes.reduce(
    (sumatoria, ordenActual) => sumatoria + ordenActual.totalPagoProducto + ordenActual.totalPagoFlete,
    0
  );

  const entregadasCount = ordenes.filter((o) => o.status === "COMPLETADO" || o.status === "ENTREGADO").length;

  const enTransitoCount = ordenes.filter(
    (o) => o.status === "EN_CAMINO" || o.status === "PAGO_EN_CUSTODIA"
  ).length;

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">

      {/* SECCIÓN 1: CABECERA DE PERFIL */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-xl font-bold text-primary shrink-0 border border-primary/10 shadow-inner">
          {usuario.nombre ? usuario.nombre[0] : "C"}
        </div>

        <div className="flex-1 min-w-[180px]">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{usuario.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Punto de Recepción: {usuario.ubicacion}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border font-semibold">
              CUENTA COMERCIAL: {usuario.id}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
          <div className="text-center px-4 py-2 bg-muted/60 border border-border/60 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-foreground">{ordenes.length}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Órdenes</div>
          </div>

          <div className="text-center px-4 py-2 bg-muted/60 border border-border/60 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-primary">{formatSoles(totalGastado)}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Total Invertido</div>
          </div>

          <div className="text-center px-4 py-2 bg-muted/60 border border-border/60 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-success">{entregadasCount}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide font-semibold">Recibidas</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: LISTADO DE ÓRDENES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Mis Compras y Trazabilidad Escrow</h2>
            <p className="text-xs text-muted-foreground">Monitorea los despachos y el estado del resguardo bancario de tu dinero en tiempo real.</p>
          </div>
          <Link
            to="/productos"
            className="text-sm text-primary font-bold hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 transition-colors"
          >
            <ShoppingBasket className="w-4 h-4" /> Abastecerse
          </Link>
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-xs">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-bold text-foreground text-base mb-1">Sin adquisiciones activas</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Aún no has cerrado tratos comerciales en la plataforma. Explora cosechas frescas listas para despacho.
            </p>
            <Link
              to="/productos"
              className="mt-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Ver cosechas disponibles →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map((o) => {
              const idxActual = getStepIndex(o.status);

              const stepsFormulados = STEPS.map((s, i) => ({
                label: s.label,
                done: i < idxActual || o.status === "COMPLETADO" || o.status === "ENTREGADO",
                active: i === idxActual && o.status !== "COMPLETADO" && o.status !== "ENTREGADO",
              }));

              return (
                <article
                  key={o.id}
                  className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-border/60 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-foreground text-base tracking-tight">
                        {o.tituloProducto}
                      </h3>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono font-bold text-zinc-600">ID ORDEN: {o.id}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {o.fechaCreacion ? new Date(o.fechaCreacion).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="font-black text-primary text-base leading-none">
                        {formatSoles(o.totalPagoProducto + o.totalPagoFlete)}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold">
                        {formatKg(o.cantidadComprada || 0)} despachados → <span className="text-foreground">{o.distritoDestino}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/40 text-xs">
                    <div className="p-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Costo Cosecha</span>
                      <span className="font-bold text-foreground">{formatSoles(o.totalPagoProducto)}</span>
                    </div>
                    <div className="p-1.5 border-l border-border/60">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Costo Logístico (Flete)</span>
                      <span className="font-bold text-foreground">{formatSoles(o.totalPagoFlete)}</span>
                    </div>
                    <div className="p-1.5 border-l border-border/60">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Garantía Bancaria</span>
                      <span className="font-bold text-success flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Pago en Custodia
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ContactCard
                      icon={<Phone className="w-4 h-4 text-success" />}
                      label="Productor en Zona de Origen"
                      nombre={o.nombreAgricultor || "Productor del Mantaro"}
                      value={o.telefonoAgricultor || "Teléfono no registrado"}
                      subtext={`Punto de Carga: ${o.distritoOrigen}`}
                      bg="bg-success/5 border-success/20"
                    />

                    <ContactCard
                      icon={<Truck className="w-4 h-4 text-amber-700" />}
                      label="Operador de Transporte Logístico"
                      nombre={o.nombreTransportista ? o.nombreTransportista : "Bolsa de Fletes Abierta"}
                      value={o.telefonoTransportista ? o.telefonoTransportista : "Buscando unidad..."}
                      subtext={
                        o.vehiculoPlaca
                          ? `Camión Placa: ${o.vehiculoPlaca} (${o.vehiculoDescripcion || "Baranda"})`
                          : "El flete está publicado esperando aceptación de transportista"
                      }
                      bg="bg-amber-500/5 border-amber-500/20"
                      muted={!o.nombreTransportista}
                    />
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Progreso de Despacho en Carretera
                    </div>
                    <MLTimeline steps={stepsFormulados} />
                  </div>

                  <div className="pt-2">
                    {o.status === "PAGO_EN_CUSTODIA" && (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-xs text-primary flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Tu pago está guardado de forma segura en depósito escrow. La orden busca transportista en la Bolsa.</span>
                      </div>
                    )}
                    {o.status === "EN_CAMINO" && (
                      <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <Truck className="w-4 h-4 shrink-0" />
                        <span>La cosecha ya fue cargada y está en camino a tu almacén en {o.distritoDestino}. Coordinar por teléfono con el chofer.</span>
                      </div>
                    )}
                    {o.status === "ENTREGADO" && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>La carga física ha sido confirmada como entregada. El Administrador procederá con la liquidación y desembolso de saldos.</span>
                      </div>
                    )}
                    {o.status === "COMPLETADO" && (
                      <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-3 px-4 text-emerald-600 text-xs font-bold flex items-center justify-center gap-2 border-dashed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Transacción comercial finalizada — Fondos distribuidos a agricultor y transportista.</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  nombre,
  value,
  subtext,
  bg,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  nombre: string;
  value: string;
  subtext?: string;
  bg: string;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl p-3 border transition-colors ${bg}`}>
      <div className="shrink-0 p-1.5 bg-white rounded-lg border border-border/40 shadow-xs mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 text-xs">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className={`font-bold tracking-tight text-sm ${muted ? "text-muted-foreground/80 italic" : "text-foreground"}`}>
          {nombre}
        </div>
        <div className={`font-semibold ${muted ? "text-muted-foreground/60 italic" : "text-zinc-700"}`}>
          {value}
        </div>
        {subtext && (
          <div className="text-[10px] text-muted-foreground pt-0.5 block truncate font-medium">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}