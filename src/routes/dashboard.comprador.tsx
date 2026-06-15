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

// Registro unívoco de la ruta del comprador según el árbol de image_94e247.png
export const Route = createFileRoute("/dashboard/comprador")({
  component: CompradorDashboard,
});

/**
 * Matriz extendida de los 6 pasos críticos de la cadena de suministro logístico-comercial.
 * Vincula de manera directa los estados internos del store con las etiquetas del flujo visual.
 */
const STEPS: { label: string; status: OrderStatus }[] = [
  { label: "Trato Cerrado", status: "pendiente_flete" },
  { label: "Flete Asignado", status: "flete_asignado" },
  { label: "Cargando en Origen", status: "cargando_origen" },
  { label: "En Carretera", status: "en_transito" },
  { label: "En Destino", status: "por_confirmar" },
  { label: "Entregado Conforme", status: "entregado" },
];

/**
 * Helper de cálculo de índice de progresión. Evalúa la posición exacta del estado actual
 * dentro de la cadena de suministro para renderizar la barra de progreso de manera fidedigna.
 */
function getStepIndex(s: OrderStatus): number {
  return STEPS.findIndex((st) => st.status === s);
}

function CompradorDashboard() {
  // Suscripción al store global descentralizado de Zustand
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
  const completarEntrega = useAppStore((s) => s.completarEntrega);

  // Cálculos financieros y métricas agregadas en tiempo real para el panel superior
  const totalGastado = ordenes.reduce(
    (sumatoria, ordenActual) => sumatoria + ordenActual.totalPagoProducto + ordenActual.totalPagoFlete,
    0
  );

  const entregadasCount = ordenes.filter((o) => o.status === "entregado").length;

  const enTránsitoCount = ordenes.filter(
    (o) => o.status !== "entregado" && o.status !== "pendiente_flete"
  ).length;

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">

      {/* SECCIÓN 1: CABECERA DE PERFIL DEL COMPRADOR / MAYORISTA */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap items-center gap-4 shadow-xs relative overflow-hidden">
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

        {/* Marcadores de Métricas de Inversión */}
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
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Recibidas</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: LISTADO COMPRENSIVO DE ÓRDENES Y TRAZABILIDAD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Mis Compras y Seguimiento de Carga</h2>
            <p className="text-xs text-muted-foreground">Monitorea el trayecto de los camiones desde las zonas de producción del Valle del Mantaro hasta tu almacén.</p>
          </div>
          <Link
            to="/productos"
            className="text-sm text-primary font-bold hover:underline flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10 transition-colors"
          >
            <ShoppingBasket className="w-4 h-4" /> Abastecerse
          </Link>
        </div>

        {ordenes.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-2xs">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="font-bold text-foreground text-base mb-1">Sin adquisiciones activas</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Aún no has cerrado tratos comerciales con ningún agricultor de la plataforma. Explora cosechas frescas listas para despacho.
            </p>
            <Link
              to="/productos"
              className="mt-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground font-bold text-xs px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-xs"
            >
              Ver cosechas disponibles en Junín →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map((o) => {
              const idxActual = getStepIndex(o.status);

              // Mapeo dinámico y exhaustivo de la línea de tiempo basada en los 6 pasos oficiales
              const stepsFormulados = STEPS.map((s, i) => ({
                label: s.label,
                done: i < idxActual || o.status === "entregado",
                active: i === idxActual && o.status !== "entregado",
              }));

              return (
                <article
                  key={o.id}
                  className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md/5 transition-all"
                >
                  {/* Fila superior: Cabecera interna del pedido */}
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-border/60 pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-extrabold text-foreground text-base tracking-tight">
                        {o.tituloProducto}
                      </h3>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">CÓDIGO DE ORDEN: {o.id}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(o.fechaCreacion).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
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

                  {/* Cuadro de Desglose de Costos e Impuestos de la Cadena */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-xl border border-border/40 text-xs">
                    <div className="p-1.5">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Costo Cosecha</span>
                      <span className="font-bold text-foreground">{formatSoles(o.totalPagoProducto)}</span>
                    </div>
                    <div className="p-1.5 border-l border-border/60">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Costo Logístico (Flete)</span>
                      <span className="font-bold text-foreground">{formatSoles(o.totalPagoFlete)}</span>
                    </div>
                    <div className="p-1.5 border-l border-border/60 col-span-2 sm:col-span-1 bg-card sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-border/40 mt-1 sm:mt-0">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Método de Resguardo</span>
                      <span className="font-bold text-success flex items-center gap-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Depósito en Custodia
                      </span>
                    </div>
                  </div>

                  {/* SECCIÓN DE CONTACTOS: LECTURA DINÁMICA ABSOLUTA DESDE EL STORE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* Tarjeta del Agricultor Conectada */}
                    <ContactCard
                      icon={<Phone className="w-4 h-4 text-success" />}
                      label="Productor Agrícola en Zona de Origen"
                      nombre={o.nombreAgricultor || "Productor del Mantaro"}
                      value={o.telefonoAgricultor || "Teléfono no disponible"}
                      subtext={`Punto de Acopio: ${o.distritoOrigen}`}
                      bg="bg-success/5 border-success/20 dark:bg-success/10"
                    />

                    {/* Tarjeta del Transportista Conectada */}
                    <ContactCard
                      icon={<Truck className="w-4 h-4 text-earth" />}
                      label="Operador de Transporte Logístico"
                      nombre={o.nombreTransportista ? o.nombreTransportista : "Bolsa de Fletes Abierta"}
                      value={o.telefonoTransportista ? o.telefonoTransportista : "Esperando enganche..."}
                      subtext={
                        o.vehiculoPlaca
                          ? `Camión Placa: ${o.vehiculoPlaca} (${o.vehiculoDescripcion || "Baranda"})`
                          : "El flete está publicado esperando un camión libre"
                      }
                      bg="bg-earth/5 border-earth/20 dark:bg-earth/10"
                      muted={!o.nombreTransportista}
                    />

                  </div>

                  {/* Línea de Tiempo Técnica Interactiva */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Progreso de Despacho en Carretera
                    </div>
                    <MLTimeline steps={stepsFormulados} />
                  </div>

                  {/* PANEL DE CONTROL DE ACCIONES CONDICIONALES EXHAUSTIVAS */}
                  <div className="pt-2">

                    {/* Caso A: La carga está lista en destino esperando confirmación del comprador */}
                    {o.status === "por_confirmar" && (
                      <div className="space-y-2">
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs p-3 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Verificación de Mercadería Requerida:</strong>
                            El transportista reporta que el camión ya se encuentra en tu almacén. Por favor, realiza el pesaje físico de la carga. Al presionar el botón inferior, liberarás los fondos retenidos tanto al agricultor como al transportista de forma irreversible.
                          </div>
                        </div>
                        <button
                          onClick={() => completarEntrega(o.id)}
                          className="w-full bg-success text-success-foreground font-black py-3.5 rounded-xl tracking-tight shadow-md hover:bg-success/90 transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          Confirmar Recepción Conforme y Liberar Fondos
                        </button>
                      </div>
                    )}

                    {/* Caso B: La carga viene en camino o está en fases previas */}
                    {(o.status === "pendiente_flete" || o.status === "flete_asignado" || o.status === "cargando_origen" || o.status === "en_transito") && (
                      <div className="bg-muted/50 border border-border p-3 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          {o.status === "pendiente_flete" && "Tu pago está seguro en la pasarela. La orden está listada en la bolsa de fletes buscando camión."}
                          {o.status === "flete_asignado" && `El transportista ${o.nombreTransportista} ya tomó el flete e inició el viaje hacia el punto de carga en ${o.distritoOrigen}.`}
                          {o.status === "cargando_origen" && "La unidad de transporte se encuentra en el distrito de origen cargando y estibando los sacos del productor."}
                          {o.status === "en_transito" && "La cosecha ya salió a carretera. Monitorea el timeline para saber cuándo arribe a tu almacén."}
                        </span>
                      </div>
                    )}

                    {/* Caso C: El viaje concluyó con éxito */}
                    {o.status === "entregado" && (
                      <div className="w-full bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-3 px-4 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 border-dashed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Transacción comercial finalizada — Liquidación bancaria emitida a los operadores del campo.</span>
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

/**
 * COMPONENTE DE ABSTRACCIÓN: TARJETA DE CONTACTO OPERATIVO DINÁMICO
 */
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
    <div className={`flex items-start gap-3 rounded-xl p-3 border.5 transition-colors ${bg}`}>
      <div className="shrink-0 p-1.5 bg-card rounded-lg border border-border/40 shadow-2xs mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 text-xs">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className={`font-bold tracking-tight text-sm ${muted ? "text-muted-foreground/80 italic" : "text-foreground"}`}>
          {nombre}
        </div>
        <div className={`font-semibold ${muted ? "text-muted-foreground/60 italic" : "text-zinc-700 dark:text-zinc-300"}`}>
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