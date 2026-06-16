import { useEffect, useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { useRouter } from "@tanstack/react-router";
import { ShieldCheck, Clock, FileText, CheckCircle2, DollarSign, ArrowRightLeft, Users, Landmark, Image } from "lucide-react";
import { toast } from "sonner";
import { formatSoles } from "@/lib/format";

type AdminTab = "kyc" | "assets";
type KycSubTab = "pendientes" | "aprobados" | "todos";

export default function Admin() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const rawUsers = useAppStore((s) => s.users);
  const todasLasOrdenes = useAppStore((s) => s.ordenes);
  
  const approveUser = useAppStore((s) => s.approveUser);
  const rejectUser = useAppStore((s) => s.rejectUser);
  const liquidarOrden = useAppStore((s) => s.liquidarOrden);
  
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<AdminTab>("kyc");
  const [kycSubTab, setKycSubTab] = useState<KycSubTab>("pendientes");
  const [selectedVoucherUrl, setSelectedVoucherUrl] = useState<string | null>(null);

  // Guard: Admin access control
  const storeReady = usuario != null && usuario.rol !== undefined;

  useEffect(() => {
    if (!storeReady) return;
    if (usuario.rol !== "admin") {
      router.navigate({ to: "/registro" as any });
    }
  }, [storeReady, usuario?.rol, router]);

  if (!storeReady || usuario.rol === "anon") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Clock className="w-8 h-8 text-muted-foreground/50 mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  // Helper for KYC Users Filtering
  const users = Array.isArray(rawUsers)
    ? rawUsers.filter((u) => u?.rol && u.rol !== "anon")
    : [];

  const kycPendientes = users.filter(
    (u) =>
      u?.verificacionEstado === "PENDIENTE_VERIFICACION" ||
      u?.verificacionEstado === "pendiente" ||
      (!u?.isMidagriVerified && (!!u?.documentoUrl || !!u?.breveteUrl))
  );

  const kycAprobados = users.filter(
    (u) => u?.verificacionEstado === "aprobado" || u?.isMidagriVerified
  );

  const filteredUsers =
    kycSubTab === "pendientes" ? kycPendientes : kycSubTab === "aprobados" ? kycAprobados : users;

  // Escrow Calculations
  const calculateOrderCommission = (orden: typeof todasLasOrdenes[0]) => {
    const agricultor = users.find((u) => u.id === orden.agricultorId);
    const hectares = agricultor?.hectareas ? Number(agricultor.hectareas) : 0;
    // Commission rate: 5% if agricultor has >= 5 hectares, 3% otherwise
    const rate = hectares >= 5 ? 0.05 : 0.03;
    return orden.totalPagoProducto * rate;
  };

  // Escrow live metrics summaries
  const fondosEnCustodia = todasLasOrdenes
    .filter((o) => ["PAGO_EN_CUSTODIA", "EN_CAMINO", "ENTREGADO", "pendiente_flete", "flete_asignado", "cargando_origen", "en_transito", "por_confirmar", "entregado"].includes(o.status))
    .reduce((sum, o) => sum + o.totalPagoProducto + o.totalPagoFlete, 0);

  const comisionesRetenidas = todasLasOrdenes
    .filter((o) => o.status === "COMPLETADO" || o.status === "completado")
    .reduce((sum, o) => sum + calculateOrderCommission(o), 0);

  const totalDisbursed = todasLasOrdenes
    .filter((o) => o.status === "COMPLETADO" || o.status === "completado")
    .reduce((sum, o) => {
      const comm = calculateOrderCommission(o);
      const agricultorAmount = o.totalPagoProducto - comm;
      return sum + agricultorAmount + o.totalPagoFlete;
    }, 0);

  // Handlers
  const handleApprove = async (userId: string, userName: string) => {
    try {
      await approveUser(userId);
      toast.success(`Cuenta de ${userName} aprobada con éxito.`, {
        description: "Se ha activado el Sello de Confianza."
      });
    } catch (err) {
      console.error("Error al aprobar usuario:", err);
      toast.error("Ocurrió un error al aprobar.");
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    try {
      await rejectUser(userId);
      toast.warning(`Solicitud de ${userName} rechazada.`);
    } catch (err) {
      console.error("Error al rechazar usuario:", err);
      toast.error("Ocurrió un error al rechazar.");
    }
  };

  const handleLiquidar = async (orden: typeof todasLasOrdenes[0]) => {
    try {
      const comm = calculateOrderCommission(orden);
      const pagoAgr = orden.totalPagoProducto - comm;
      
      await liquidarOrden(orden.id);
      
      toast.success("¡Orden Liquidada con éxito!", {
        description: `Se distribuyeron: S/ ${pagoAgr.toFixed(2)} al Agricultor, S/ ${orden.totalPagoFlete.toFixed(2)} al Transportista y comisión AgroConecta S/ ${comm.toFixed(2)} registrada.`
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al liquidar la transacción.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Panel de Control del Staff
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mesa de aprobación KYC, Verificación Escrow y Liquidación de Assets Financieros
          </p>
        </div>
        <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
          Rol: {usuario?.nombre} (Admin)
        </span>
      </div>

      {/* TABS PRINCIPALES */}
      <div className="flex gap-2 border-b border-border/60 pb-px">
        <button
          onClick={() => setActiveTab("kyc")}
          className={`pb-3 text-sm font-bold px-4 transition-all bg-transparent border-none cursor-pointer flex items-center gap-2 ${
            activeTab === "kyc" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Aprobaciones KYC
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`pb-3 text-sm font-bold px-4 transition-all bg-transparent border-none cursor-pointer flex items-center gap-2 ${
            activeTab === "assets" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Assets & Escrow Financiero
        </button>
      </div>

      {/* PANELES DE CONTENIDO */}
      {activeTab === "kyc" && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {/* Sub-Tabs de KYC */}
          <div className="flex gap-2 border-b border-border/30 pb-2">
            {(
              [
                { key: "pendientes", label: "Pendientes", count: kycPendientes.length },
                { key: "aprobados", label: "Aprobados", count: null },
                { key: "todos", label: "Todos", count: null },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setKycSubTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  kycSubTab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {label} {count !== null && count > 0 && `(${count})`}
              </button>
            ))}
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center">
              <Clock className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground">No hay solicitudes en esta sección</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="pb-3 pt-1">Usuario</th>
                    <th className="pb-3 pt-1">Rol</th>
                    <th className="pb-3 pt-1">Ubicación</th>
                    <th className="pb-3 pt-1">DNI / RUC</th>
                    <th className="pb-3 pt-1">Archivos Adjuntos</th>
                    <th className="pb-3 pt-1 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((u) => {
                    const hasDni = !!u.documentoUrl;
                    const hasBrevete = !!u.breveteUrl;
                    const isPending =
                      u.verificacionEstado === "PENDIENTE_VERIFICACION" ||
                      u.verificacionEstado === "pendiente" ||
                      (!u.isMidagriVerified && (hasDni || hasBrevete));

                    return (
                      <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-4 font-bold text-foreground">
                          {u.nombre}
                          {u.razonSocial && <span className="block text-xs font-normal text-muted-foreground">{u.razonSocial}</span>}
                        </td>
                        <td className="py-4 capitalize">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.rol === "agricultor" ? "bg-success/15 text-success" : u.rol === "transportista" ? "bg-amber-500/15 text-amber-800" : "bg-primary/15 text-primary"
                          }`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="py-4 text-muted-foreground text-xs">{u.ubicacion}</td>
                        <td className="py-4 font-mono text-xs">{u.ruc || u.documentoUrl ? u.ruc || "Registrado" : "N/A"}</td>
                        <td className="py-4 space-y-1">
                          {hasDni && (
                            <a href={u.documentoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <FileText className="w-3 h-3" /> <span>DNI Foto</span>
                            </a>
                          )}
                          {hasBrevete && (
                            <a href={u.breveteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-amber-700 hover:underline">
                              <FileText className="w-3 h-3" /> <span>Brevete Foto</span>
                            </a>
                          )}
                          {!hasDni && !hasBrevete && <span className="text-xs text-muted-foreground">Ninguno</span>}
                        </td>
                        <td className="py-4 text-right">
                          {isPending ? (
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => handleReject(u.id, u.nombre)}
                                className="px-3 py-1 text-xs font-semibold border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-lg"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleApprove(u.id, u.nombre)}
                                className="px-3 py-1 text-xs font-bold text-white bg-success hover:opacity-90 rounded-lg"
                              >
                                Aprobar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-success font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Verificado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "assets" && (
        <div className="space-y-6">
          {/* METRICS DASHBOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase">Fondos en Custodia (Escrow)</span>
                <h3 className="text-2xl font-black text-foreground mt-1">{formatSoles(fondosEnCustodia)}</h3>
              </div>
              <Landmark className="w-10 h-10 text-primary opacity-30" />
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase">Ingresos por Comisión AgroConecta</span>
                <h3 className="text-2xl font-black text-success mt-1">{formatSoles(comisionesRetenidas)}</h3>
              </div>
              <DollarSign className="w-10 h-10 text-success opacity-30" />
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold uppercase">Total Desembolsado</span>
                <h3 className="text-2xl font-black text-muted-foreground mt-1">{formatSoles(totalDisbursed)}</h3>
              </div>
              <ArrowRightLeft className="w-10 h-10 text-muted-foreground opacity-30" />
            </div>
          </div>

          {/* ESCROW TRANSACCIONES */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-foreground">Órdenes Activas en Depósito de Custodia</h3>
            
            {todasLasOrdenes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No hay registros de transacciones comerciales.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 pt-1">Orden ID / Cosecha</th>
                      <th className="pb-3 pt-1">Comprador</th>
                      <th className="pb-3 pt-1">Transportista</th>
                      <th className="pb-3 pt-1">Comprobante</th>
                      <th className="pb-3 pt-1">Total Custodiado</th>
                      <th className="pb-3 pt-1">Comisión</th>
                      <th className="pb-3 pt-1">Estado</th>
                      <th className="pb-3 pt-1 text-right">Operación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {todasLasOrdenes.map((o) => {
                      const comm = calculateOrderCommission(o);
                      const isEscrowPending = o.status === "PAGO_EN_CUSTODIA" || o.status === "EN_CAMINO";
                      const isEscrowCompleted = o.status === "COMPLETADO" || o.status === "completado";
                      const isEscrowDelivered = o.status === "ENTREGADO" || o.status === "entregado";

                      return (
                        <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-4">
                            <span className="font-bold text-foreground block text-xs font-mono">{o.id}</span>
                            <span className="text-xs text-muted-foreground">{o.tituloProducto}</span>
                          </td>
                          <td className="py-4 text-xs">
                            <span className="font-medium text-foreground block">{o.nombreComprador}</span>
                            <span className="text-[10px] text-muted-foreground">{o.telefonoComprador}</span>
                          </td>
                          <td className="py-4 text-xs">
                            {o.nombreTransportista ? (
                              <>
                                <span className="font-medium text-foreground block">{o.nombreTransportista}</span>
                                <span className="text-[10px] text-muted-foreground">{o.vehiculoPlaca}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No asignado</span>
                            )}
                          </td>
                          <td className="py-4">
                            {o.comprobanteUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVoucherUrl(o.comprobanteUrl || null)}
                                className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                              >
                                <Image className="w-3.5 h-3.5" />
                                <span>Ver Yape</span>
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Ninguno</span>
                            )}
                          </td>
                          <td className="py-4 font-bold text-foreground">{formatSoles(o.totalPagoProducto + o.totalPagoFlete)}</td>
                          <td className="py-4 text-xs text-success font-semibold">{formatSoles(comm)}</td>
                          <td className="py-4 capitalize">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isEscrowCompleted ? "bg-success/15 text-success" : isEscrowDelivered ? "bg-blue-100 text-blue-800 animate-pulse" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {isEscrowDelivered && (
                              <button
                                onClick={() => handleLiquidar(o)}
                                className="bg-success text-success-foreground px-3 py-1.5 rounded-lg text-xs font-black shadow-sm hover:opacity-90"
                              >
                                Liquidar Orden
                              </button>
                            )}
                            {isEscrowPending && (
                              <span className="text-xs text-muted-foreground italic">En ruta...</span>
                            )}
                            {isEscrowCompleted && (
                              <span className="text-xs text-success font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Liquidado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VOUCHER IMAGE INSPECTION MODAL */}
      {selectedVoucherUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedVoucherUrl(null)}
              className="absolute top-4 right-4 text-foreground font-black hover:text-muted-foreground text-sm cursor-pointer"
            >
              ✕
            </button>
            <h3 className="font-bold text-base text-foreground">Comprobante de Pago Yape</h3>
            <div className="border border-border rounded-xl overflow-hidden max-h-[500px]">
              <img src={selectedVoucherUrl} alt="Comprobante Yape" className="w-full h-auto object-contain" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedVoucherUrl(null)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
