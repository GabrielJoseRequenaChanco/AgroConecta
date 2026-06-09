import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "@/context/useAppStore";
import { MLTimeline } from "@/components/dashboard/MLTimeline";
import { formatSoles, formatKg } from "@/lib/format";
import {
  Truck,
  MapPin,
  Navigation,
  Package,
  Layers,
  AlertTriangle,
  ArrowRight,
  Gauge,
  ClipboardCheck,
} from "lucide-react";
import type { OrderStatus } from "@/context/types";

// Registro oficial de la ruta
export const Route = createFileRoute("/dashboard/transportista")({
  component: TransportistaDashboard,
});

const STEPS: { label: string; status: OrderStatus }[] = [
  { label: "Trato Cerrado", status: "pendiente_flete" },
  { label: "Flete Asignado", status: "flete_asignado" },
  { label: "Cargando en Chacra", status: "cargando_chacra" },
  { label: "En Carretera", status: "en_transito" },
  { label: "En Destino", status: "por_confirmar" },
  { label: "Entregado Conforme", status: "entregado" },
];

function getStepIndex(s: OrderStatus): number {
  return STEPS.findIndex((st) => st.status === s);
}

function TransportistaDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  useEffect(() => {
    if (usuario.rol !== "transportista") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);
  const todasLasOrdenes = useAppStore((s) => s.ordenes);
  const todosLosFletes = useAppStore((s) => s.fletes);
  
  // Acciones reales del store
  const aceptarFlete = useAppStore((s) => s.aceptarFlete);
  const marcarCargandoEnChacra = useAppStore((s) => s.marcarCargandoEnChacra);
  const marcarEnTransito = useAppStore((s) => s.marcarEnTransito);
  const solicitarConfirmacionEntrega = useAppStore((s) => s.solicitarConfirmacionEntrega);

  const viajeActivo = todasLasOrdenes.find(
    (o) => o.transportistaId === usuario.id && o.status !== "entregado"
  );

  const historialEntregados = todasLasOrdenes.filter(
    (o) => o.transportistaId === usuario.id && o.status === "entregado"
  );

  // Reconstrucción de la bolsa para el transportista
  const bolsaFletesDisponibles = todosLosFletes
    .filter((f) => f.status === "disponible" && !f.transportistaId)
    .map((f) => {
      const ordenAsociada = todasLasOrdenes.find((o) => o.id === f.ordenId);
      return {
        ...f,
        tituloProducto: ordenAsociada?.tituloProducto || "Carga Agrícola",
        distritoOrigen: f.origen,
        distritoDestino: f.destino,
        cantidadComprada: f.pesoCarga,
      };
    });

  const totalGanadoFletes = historialEntregados.reduce((sum, o) => sum + o.totalPagoFlete, 0);

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* SECCIÓN 1: CABECERA */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap items-center gap-4 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-earth/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-14 h-14 bg-earth/10 rounded-2xl flex items-center justify-center text-xl font-bold text-earth shrink-0 border border-earth/10 shadow-inner">
          <Truck className="w-7 h-7 text-earth" />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{usuario.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Gauge className="w-3.5 h-3.5 text-earth" /> Operador de Carga Pesada Regional
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-mono bg-earth/10 text-earth px-2 py-0.5 rounded font-bold border border-earth/10">
              VEHÍCULO: {usuario.vehiculo ? `${usuario.vehiculo.placa} · ${usuario.vehiculo.modelo}` : "SIN VEHÍCULO REGISTRADO"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="text-center px-4 py-2 bg-muted/60 border border-border/60 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-foreground">{historialEntregados.length}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Fletes Hechos</div>
          </div>
          <div className="text-center px-4 py-2 bg-earth/5 border border-earth/10 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-earth">{formatSoles(totalGanadoFletes)}</div>
            <div className="text-[10px] uppercase font-bold text-earth tracking-wide">Fletes Cobrados</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: VIAJE ACTIVO */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Navigation className="w-5 h-5 text-earth" /> Orden de Servicio en Curso
        </h2>

        {viajeActivo ? (
          (() => {
            const idxActual = getStepIndex(viajeActivo.status);
            const stepsFormulados = STEPS.map((s, i) => ({
              label: s.label,
              done: i < idxActual || viajeActivo.status === "entregado",
              active: i === idxActual && viajeActivo.status !== "entregado",
            }));

            return (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative">
                <div className="absolute top-4 right-4 bg-earth/10 text-earth text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider animate-pulse border border-earth/20">
                  En Operación
                </div>

                <div className="border-b border-border/60 pb-3 pr-20">
                  <h3 className="font-extrabold text-foreground text-base tracking-tight">
                    {viajeActivo.tituloProducto}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    HOJA DE RUTA: {viajeActivo.id} · CARGA: {formatKg(viajeActivo.cantidadComprada)} neto
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-xl border border-border/50 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-success" /> Punto de Carga
                    </span>
                    <span className="font-bold text-foreground block text-sm">{viajeActivo.distritoOrigen}</span>
                  </div>
                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-primary" /> Punto de Entrega
                    </span>
                    <span className="font-bold text-foreground block text-sm">{viajeActivo.distritoDestino}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <MLTimeline steps={stepsFormulados} />
                </div>

                <div className="border-t border-border/60 pt-4">
                  {viajeActivo.status === "flete_asignado" && (
                    <button
                      onClick={() => marcarCargandoEnChacra(viajeActivo.id)}
                      className="w-full bg-earth text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-earth/90 transition-all cursor-pointer"
                    >
                      <Package className="w-4 h-4" /> Registrar Inicio de Carga
                    </button>
                  )}

                  {viajeActivo.status === "cargando_chacra" && (
                    <button
                      onClick={() => marcarEnTransito(viajeActivo.id)}
                      className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:bg-amber-700 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" /> Iniciar Ruta
                    </button>
                  )}

                  {viajeActivo.status === "en_transito" && (
                    <button
                      onClick={() => solicitarConfirmacionEntrega(viajeActivo.id)}
                      className="w-full bg-success text-success-foreground font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-all cursor-pointer"
                    >
                      <ClipboardCheck className="w-4.5 h-4.5" /> Notificar Arribo
                    </button>
                  )}

                  {viajeActivo.status === "por_confirmar" && (
                    <div className="bg-muted p-3.5 rounded-xl border border-border flex items-start gap-2.5 text-xs text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        Esperando conformidad del comprador.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-card border border-border/80 border-dashed rounded-2xl p-8 text-center text-xs text-muted-foreground font-medium">
            No tienes ninguna orden activa.
          </div>
        )}
      </div>

      {/* SECCIÓN 3: BOLSA */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Bolsa de Fletes Disponibles
        </h2>

        {bolsaFletesDisponibles.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-2xs">
            <p className="text-muted-foreground text-xs font-medium">No hay fletes pendientes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bolsaFletesDisponibles.map((flete) => (
              <article key={`flete-${flete.id}`} className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-sm">{flete.tituloProducto}</h3>
                  <p className="text-[11px] text-muted-foreground">{formatKg(flete.pesoCarga)}</p>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-auto">
                   <span className="text-base font-black text-earth">{formatSoles(flete.tarifaPropuesta)}</span>
                   <button
                    onClick={() => {
                        if(usuario.vehiculo) {
                            aceptarFlete(flete.id, usuario.id, usuario.nombre, usuario.telefono, usuario.vehiculo);
                        }
                    }}
                    disabled={!!viajeActivo}
                    className="bg-earth text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-earth/90 cursor-pointer"
                  >
                    Asignarse Flete <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}