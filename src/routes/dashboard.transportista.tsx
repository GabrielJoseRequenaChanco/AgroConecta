import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { MLTimeline } from "@/components/dashboard/MLTimeline";
import { formatSoles, formatKg } from "@/lib/format";
import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  User,
  Package,
  Layers,
  ArrowRight,
  Gauge,
  ClipboardCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import type { OrderStatus } from "@/context/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/transportista")({
  component: TransportistaDashboard,
});

const STEPS: { label: string; status: OrderStatus }[] = [
  { label: "Pago Custodiado", status: "PAGO_EN_CUSTODIA" },
  { label: "En Camino", status: "EN_CAMINO" },
  { label: "Entregado", status: "ENTREGADO" },
  { label: "Liquidado", status: "COMPLETADO" },
];

function getStepIndex(s: OrderStatus): number {
  return STEPS.findIndex((st) => st.status === s);
}

function TransportistaDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  // Guard redirection if not transportista
  useEffect(() => {
    if (usuario.rol !== "transportista") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);

  const todasLasOrdenes = useAppStore((s) => s.ordenes);
  const todosLosFletes = useAppStore((s) => s.fletes);

  // Store actions
  const aceptarFlete = useAppStore((s) => s.aceptarFlete);
  const solicitarConfirmacionEntrega = useAppStore((s) => s.solicitarConfirmacionEntrega);

  // Active trip (EN_CAMINO or ENTREGADO)
  const viajeActivo = todasLasOrdenes.find(
    (o) => o.transportistaId === usuario.id && o.status !== "COMPLETADO"
  );

  const historialEntregados = todasLasOrdenes.filter(
    (o) => o.transportistaId === usuario.id && o.status === "COMPLETADO"
  );

  // Available shipments on the board (associated with PAGO_EN_CUSTODIA orders)
  const bolsaFletesDisponibles = todosLosFletes
    .filter((f) => {
      const ordenAsociada = todasLasOrdenes.find((o) => o.id === f.ordenId);
      return ordenAsociada && ordenAsociada.status === "PAGO_EN_CUSTODIA";
    })
    .map((f) => {
      const ordenAsociada = todasLasOrdenes.find((o) => o.id === f.ordenId)!;
      return {
        ...f,
        tituloProducto: ordenAsociada.tituloProducto || "Carga Agrícola",
        distritoOrigen: f.origen,
        distritoDestino: f.destino,
        cantidadComprada: f.pesoCarga,
        pesoToneladas: (f.pesoCarga / 1000).toFixed(1),
      };
    });

  const totalGanadoFletes = historialEntregados.reduce((sum, o) => sum + o.totalPagoFlete, 0);

  const handleTomarViaje = async (fleteId: string) => {
    if (!usuario.vehiculo) {
      toast.error("Vehículo no configurado", {
        description: "Debes registrar la placa y características de tu vehículo para tomar fletes."
      });
      return;
    }
    try {
      await aceptarFlete(fleteId, usuario.id, usuario.nombre, usuario.telefono, usuario.vehiculo);
      toast.success("¡Viaje asignado con éxito!", {
        description: "El viaje está activo. Comunícate con ambas partes para coordinar."
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al asignar el flete.");
    }
  };

  const handleCompletarViaje = async (ordenId: string) => {
    try {
      await solicitarConfirmacionEntrega(ordenId);
      toast.success("Entrega notificada al Staff", {
        description: "El pedido se marcó como entregado físicamente. Pendiente de liquidación escrow por el Admin."
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar la entrega.");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* SECCIÓN 1: CABECERA */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-wrap items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20 shadow-inner">
          <Truck className="w-7 h-7 text-amber-700" />
        </div>

        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold text-foreground tracking-tight">{usuario.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <Gauge className="w-3.5 h-3.5 text-amber-700" /> Operador de Carga Certificado
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-800 px-2.5 py-0.5 rounded font-bold border border-amber-500/20">
              PLACA VEHÍCULO: {usuario.vehiculo ? usuario.vehiculo.placa : "PENDIENTE DE VERIFICACIÓN"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="text-center px-4 py-2 bg-muted/60 border border-border/60 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-foreground">{historialEntregados.length}</div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Viajes Completados</div>
          </div>
          <div className="text-center px-4 py-2 bg-success/5 border border-success/10 rounded-xl flex-1 sm:flex-initial">
            <div className="text-lg font-black text-success">{formatSoles(totalGanadoFletes)}</div>
            <div className="text-[10px] uppercase font-bold text-success tracking-wide">Fletes Cobrados</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: VIAJE ACTIVO */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Navigation className="w-5 h-5 text-amber-700 animate-pulse" /> Orden de Servicio en Curso
        </h2>

        {viajeActivo ? (
          (() => {
            const idxActual = getStepIndex(viajeActivo.status);
            const stepsFormulados = STEPS.map((s, i) => ({
              label: s.label,
              done: i < idxActual || viajeActivo.status === "COMPLETADO" || viajeActivo.status === "ENTREGADO",
              active: i === idxActual && viajeActivo.status !== "COMPLETADO" && viajeActivo.status !== "ENTREGADO",
            }));

            return (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative">
                <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-500/20">
                  {viajeActivo.status}
                </div>

                <div className="border-b border-border/60 pb-3 pr-20">
                  <h3 className="font-extrabold text-foreground text-base tracking-tight">
                    {viajeActivo.tituloProducto}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    ID ORDEN: {viajeActivo.id} · CARGA: {formatKg(viajeActivo.cantidadComprada)} neto
                  </p>
                </div>

                {/* Ruta de origen a destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-xl border border-border/50 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-success" /> Punto de Carga (Productor)
                    </span>
                    <span className="font-bold text-foreground block text-sm">{viajeActivo.distritoOrigen}</span>
                  </div>
                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-primary" /> Punto de Entrega (Comprador)
                    </span>
                    <span className="font-bold text-foreground block text-sm">{viajeActivo.distritoDestino}</span>
                  </div>
                </div>

                {/* Revelación de Datos de Contacto Directo */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Contactos Directos de Coordinación</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-border/40">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-success" />
                        <span>Agricultor (Carga)</span>
                      </div>
                      <p className="text-foreground font-medium">{viajeActivo.nombreAgricultor}</p>
                      <a href={`tel:${viajeActivo.telefonoAgricultor}`} className="text-primary font-bold flex items-center gap-1 hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {viajeActivo.telefonoAgricultor}
                      </a>
                    </div>

                    <div className="space-y-1.5 p-3 bg-white rounded-lg border border-border/40">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" />
                        <span>Comprador (Descarga)</span>
                      </div>
                      <p className="text-foreground font-medium">{viajeActivo.nombreComprador}</p>
                      <a href={`tel:${viajeActivo.telefonoComprador}`} className="text-primary font-bold flex items-center gap-1 hover:underline">
                        <Phone className="w-3.5 h-3.5" /> {viajeActivo.telefonoComprador}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <MLTimeline steps={stepsFormulados} />
                </div>

                <div className="border-t border-border/60 pt-4">
                  {viajeActivo.status === "EN_CAMINO" && (
                    <button
                      onClick={() => handleCompletarViaje(viajeActivo.id)}
                      className="w-full bg-success text-success-foreground font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <ClipboardCheck className="w-4.5 h-4.5" /> Marcar Como Entregado Físicamente
                    </button>
                  )}

                  {viajeActivo.status === "ENTREGADO" && (
                    <div className="bg-amber-50 border border-amber-200/50 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                      <CheckCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Entrega registrada.</strong> La liquidación escrow está pendiente de validación de conformidad por el administrador. Una vez procesado, tus fondos serán liberados.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="bg-card border border-border/80 border-dashed rounded-2xl p-8 text-center text-xs text-muted-foreground font-medium">
            No tienes ninguna orden activa asignada.
          </div>
        )}
      </div>

      {/* SECCIÓN 3: BOLSA DE FLETES AUTOMATIZADA */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" /> Bolsa de Fletes Automatizada
        </h2>

        {bolsaFletesDisponibles.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-xs">
            <p className="text-muted-foreground text-xs font-medium">No hay fletes disponibles para coordinar en Junín.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bolsaFletesDisponibles.map((flete) => (
              <article key={`flete-${flete.id}`} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-foreground text-sm tracking-tight">{flete.tituloProducto}</h3>
                    <span className="bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 rounded">Pago Custodiado</span>
                  </div>
                  
                  {/* Ruta visual */}
                  <div className="flex items-center gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border border-border/50">
                    <span className="font-semibold text-foreground">{flete.distritoOrigen}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{flete.distritoDestino}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Peso de Carga:</span>
                    <span className="font-bold text-foreground">{flete.pesoToneladas} Toneladas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground font-semibold">Pago Neto Flete:</span>
                    <span className="text-lg font-black text-amber-700">{formatSoles(flete.tarifaPropuesta)}</span>
                  </div>
                  <button
                    onClick={() => handleTomarViaje(flete.id)}
                    disabled={!!viajeActivo}
                    className="bg-amber-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                  >
                    Tomar Viaje
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