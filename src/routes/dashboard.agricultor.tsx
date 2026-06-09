import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { MLMetricsCard } from "@/components/dashboard/MLMetricsCard";
import { formatSoles, formatKg } from "@/lib/format";
import { 
  Plus, 
  ShieldCheck, 
  ShieldAlert,
  MapPin, 
  TrendingUp, 
  Package, 
  Phone, 
  Truck, 
  Calendar, 
  User, 
  Layers, 
  Info,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock
} from "lucide-react";
import type { UserRole } from "@/context/types";

// Definición de la ruta para TanStack Router
export const Route = createFileRoute("/dashboard/agricultor")({
  component: AgricultorDashboard,
});

/**
 * Diccionario de Estados Logísticos e Históricos de una publicación de cosecha.
 * Mapea directamente cada fase de nuestra máquina de estados central a estilos semánticos y comprensibles.
 */
const STATUS_BADGE: Record<
  "disponible" | "pendiente_flete" | "flete_asignado" | "cargando_chacra" | "en_transito" | "por_confirmar" | "entregado", 
  { txt: string; cls: string }
> = {
  disponible: { 
    txt: "Disponible · Buscando comprador", 
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
  },
  pendiente_flete: { 
    txt: "Reservado · Esperando transportista en bolsa", 
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20" 
  },
  flete_asignado: { 
    txt: "Flete Asignado · Camión en camino a la chacra", 
    cls: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20" 
  },
  cargando_chacra: { 
    txt: "Logística · Cargando mercadería en chacra", 
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20" 
  },
  en_transito: { 
    txt: "En Ruta · Camión transitando carretera", 
    cls: "bg-orange-500/10 text-orange-600 border border-orange-500/20" 
  },
  por_confirmar: { 
    txt: "En Destino · Esperando conformidad de entrega", 
    cls: "bg-purple-500/10 text-purple-600 border border-purple-500/20" 
  },
  entregado: { 
    txt: "Trato Cerrado · Venta finalizada con éxito", 
    cls: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20" 
  },
};

function AgricultorDashboard() {
  // Suscripción al store global descentralizado de Zustand
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  useEffect(() => {
    if (usuario.rol !== "agricultor") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);
  const productos = useAppStore((s) => s.productos);
  const ordenes = useAppStore((s) => s.ordenes);
  const addProducto = useAppStore((s) => s.addProducto);
  
  // Estado local para el control de apertura y cierre del panel modal de publicación
  const [modal, setModal] = useState<boolean>(false);
  
  // Estado local opcional para inspeccionar visualmente los detalles de un flete u orden específica en el historial
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(null);

  // Filtrado reactivo de datos correspondientes de manera unívoca al agricultor autenticado
  const misProductos = useMemo(() => {
    return productos.filter((p) => p.agricultorId === usuario.id);
  }, [productos, usuario.id]);

  const misOrdenes = useMemo(() => {
    return ordenes.filter((o) => o.agricultorId === usuario.id);
  }, [ordenes, usuario.id]);

  /**
   * Cálculo exhaustivo de ganancias confirmadas o en proceso logístico avanzado.
   * Excluye únicamente las órdenes pendientes de flete que no han iniciado ningún compromiso logístico real.
   */
  const gananciasTotales = useMemo(() => {
    return misOrdenes
      .filter((o) => o.status !== "pendiente_flete")
      .reduce((acumulador, ordenActual) => acumulador + ordenActual.totalPagoProducto, 0);
  }, [misOrdenes]);

  /**
   * Sumatoria total del volumen métrico en kilogramos despachados o comprometidos en transacciones comerciales.
   */
  const totalKilosVendidos = useMemo(() => {
    return misOrdenes
      .filter((o) => o.status === "entregado")
      .reduce((acumulador, ordenActual) => acumulador + ordenActual.cantidadComprada, 0);
  }, [misOrdenes]);

  /**
   * Evalúa de forma jerárquica el estado preciso de una publicación basándose tanto en el catálogo de productos
   * como en la traza viva de las órdenes de compra activas en el mercado.
   */
  const getStatusKey = (p: typeof misProductos[0]) => {
    if (p.status === "vendido") return "entregado";
    
    if (p.status === "reservado") {
      const ordenAsociada = misOrdenes.find((o) => o.productoId === p.id);
      if (ordenAsociada) {
        return ordenAsociada.status; // Retorna: pendiente_flete | flete_asignado | cargando_chacra | en_transito | por_confirmar
      }
      return "pendiente_flete";
    }
    
    return "disponible";
  };

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* SECCIÓN 1: CABECERA DE PERFIL AGRÓNOMO DEL VALLE DEL MANTARO */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 flex-wrap shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-success shrink-0 border border-success/10 shadow-inner">
          {usuario.nombre ? usuario.nombre[0] : "A"}
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">{usuario.nombre}</h1>
            <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md border border-border">
              ID: {usuario.id}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4 text-success" /> {usuario.ubicacion}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {usuario.telefono || "Sin teléfono registrado"}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:mt-0 mt-2">
          {usuario.isMidagriVerified ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/20 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Productor Auténtico MIDAGRI Certificado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold px-3 py-2 rounded-xl border border-amber-500/20 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Perfil en Proceso de Verificación
            </span>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: TARJETAS DE MÉTRICAS OPERATIVAS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MLMetricsCard
          label="Ganancias Estimadas / Reales"
          value={formatSoles(gananciasTotales)}
          hint="Incluye fletes asignados y en ruta"
          accent="success"
        />
        <MLMetricsCard
          label="Volumen Despachado"
          value={formatKg(totalKilosVendidos)}
          hint="Solo cosechas con entrega conforme"
          accent="earth"
        />
        <MLMetricsCard
          label="Cosechas en Vitrina Abierta"
          value={String(misProductos.filter((p) => p.status === "disponible").length)}
          hint="Visible en catálogo para compradores"
          accent="primary"
        />
      </section>

      {/* SECCIÓN 3: TABLA DE PUBLICACIONES Y COSECHAS PROPIAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Gestión de Cosechas en Mercado</h2>
            <p className="text-xs text-muted-foreground">
              Tienes {misProductos.length} cosecha(s) registradas bajo tu titularidad agrícola.
            </p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="bg-success text-success-foreground font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm hover:bg-success/90 transition-all text-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Publicar nueva cosecha
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {misProductos.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-70">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">Ninguna publicación activa</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                Aún no has registrado cosechas en el ecosistema. Publica para que los compradores de Junín puedan encontrarte.
              </p>
              <button
                onClick={() => setModal(true)}
                className="text-success font-bold text-sm hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Publicar mi primera cosecha ahora mismo →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[45%]">
                      Detalle del Producto / Variedad
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell w-[15%]">
                      Precio Base por kg
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell w-[15%]">
                      Stock de Cosecha
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[25%]">
                      Fase de Trazabilidad Comercial
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {misProductos.map((p) => {
                    const statusKey = getStatusKey(p);
                    const badge = STATUS_BADGE[statusKey] || { txt: "Desconocido", cls: "bg-muted text-muted-foreground" };
                    
                    return (
                      <tr key={p.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3.5">
                          <div className="flex gap-3 items-center">
                            <img
                              src={p.imagenUrl}
                              alt={p.titulo}
                              className="w-12 h-12 object-cover rounded-xl shrink-0 border border-border shadow-sm group-hover:scale-105 transition-transform"
                            />
                            <div className="space-y-0.5">
                              <div className="font-bold text-foreground leading-snug">
                                {p.titulo}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                                  <Layers className="w-3 h-3" /> {p.rubro}
                                </span>
                                <span className="text-zinc-300">•</span>
                                <span>Var: {p.variedad}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="inline-flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                  <MapPin className="w-2.5 h-2.5" /> {p.distritoOrigen}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell font-semibold text-foreground">
                          {formatSoles(p.precioPerKg)}
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell font-medium text-muted-foreground">
                          {formatKg(p.volumenDisponible)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm ${badge.cls}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
                            {badge.txt}
                          </span>
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

      {/* SECCIÓN 4: HISTORIAL DE VENTAS Y AUDITORÍA DE CONTRATOS LOGÍSTICOS */}
      {misOrdenes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="font-bold text-foreground text-base tracking-tight">Historial de Transacciones Comerciales</h2>
            </div>
            <span className="text-xs text-muted-foreground">Mostrando las últimas {Math.min(misOrdenes.length, 5)} operaciones</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {misOrdenes.slice(0, 5).map((o) => {
              const isSelected = selectedOrdenId === o.id;
              return (
                <div 
                  key={o.id}
                  className={`border rounded-xl p-4 transition-all space-y-3 ${
                    isSelected ? "border-success bg-success/5 shadow-sm" : "border-border hover:border-zinc-300 bg-card"
                  }`}
                >
                  {/* Fila Principal Resumida */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="font-bold text-foreground text-sm">{o.tituloProducto}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-medium text-zinc-600 dark:text-zinc-400">Orden ID: {o.id}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(o.fechaCreacion).toLocaleDateString("es-PE")}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">{formatKg(o.cantidadComprada)}</span>
                        <span>→ Destino: {o.distritoDestino}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-black text-success text-base leading-none">
                        {formatSoles(o.totalPagoProducto)}
                      </div>
                      <button
                        onClick={() => setSelectedOrdenId(isSelected ? null : o.id)}
                        className="text-xs font-semibold text-success hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        {isSelected ? "Ocultar detalles ▲" : "Ver traza completa ▼"}
                      </button>
                    </div>
                  </div>

                  {/* Bloque de Detalles Expandido (Cero Cableados, Lectura Viva del Store) */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
                      
                      {/* Sub-bloque 1: Comprador */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50">
                        <div className="font-bold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                          <User className="w-3.5 h-3.5 text-zinc-400" /> Datos del Comprador
                        </div>
                        <div className="font-semibold text-foreground text-sm">{o.nombreComprador}</div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" /> {o.telefonoComprador}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Registrado como: {o.compradorId}
                        </div>
                      </div>

                      {/* Sub-bloque 2: Operación Logística */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50">
                        <div className="font-bold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                          <Truck className="w-3.5 h-3.5 text-zinc-400" /> Operador de Flete Asignado
                        </div>
                        {o.transportistaId ? (
                          <>
                            <div className="font-semibold text-foreground text-sm">{o.nombreTransportista}</div>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" /> {o.telefonoTransportista}
                            </div>
                            <div className="mt-1 bg-card border border-border px-2 py-1 rounded text-[11px] font-medium text-foreground inline-block">
                              Placa Camión: <span className="font-mono font-bold text-success">{o.vehiculoPlaca}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground block truncate mt-0.5">
                              {o.vehiculoDescripcion}
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground italic py-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> Buscando transportista libre en la bolsa...
                          </div>
                        )}
                      </div>

                      {/* Sub-bloque 3: Auditoría Temporal y Flujo */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                            <Info className="w-3.5 h-3.5 text-zinc-400" /> Trazabilidad del Estado Técnico
                          </div>
                          <div className="mt-1.5">
                            <span className="inline-block bg-zinc-800 text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                              {o.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-0.5 text-[10px] text-muted-foreground border-t border-border/60 pt-1.5 mt-2">
                          {o.fechaAsignacionFlete && (
                            <div>• Asignado: {new Date(o.fechaAsignacionFlete).toLocaleTimeString("es-PE")}</div>
                          )}
                          {o.fechaInicioTransito && (
                            <div>• En carretera: {new Date(o.fechaInicioTransito).toLocaleTimeString("es-PE")}</div>
                          )}
                          {o.fechaCierreEfectivo && (
                            <div className="text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Cerrado con conformidad
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 5: RENDERIZADO DEL MODAL CONECTADO */}
      {modal && (
        <PublicarModal
          onClose={() => setModal(false)}
          onSave={(nuevoProductoFormulado) => { 
            addProducto(nuevoProductoFormulado); 
            setModal(false); 
          }}
          agricultor={usuario}
        />
      )}
    </div>
  );
}

/**
 * FORMULARIO COMPLETO: MODAL DE PUBLICACIÓN INTEGRAL DE COSECHAS
 */
function PublicarModal({
  onClose,
  onSave,
  agricultor,
}: {
  onClose: () => void;
  onSave: (p: any) => void;
  agricultor: any;
}) {
  // Inicialización de estados locales tipados mapeados a la lista de rubros oficial
  const [titulo, setTitulo] = useState<string>("");
  const [rubro, setRubro] = useState<"Tubérculos" | "Cereales" | "Hortalizas" | "Frutas">("Tubérculos");
  const [variedad, setVariedad] = useState<string>("");
  const [volumenDisponible, setVolumenDisponible] = useState<string>("1500");
  const [precioPerKg, setPrecioPerKg] = useState<string>("1.80");
  const [distritoOrigen, setDistritoOrigen] = useState<string>("Aco");
  const [fechaCosecha, setFechaCosecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const manejarEnvioFormulario = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    // Validaciones preventivas estrictas antes de inyectar en el store de Zustand
    if (!variedad.trim()) {
      setErrorValidacion("Por favor, especifica la variedad botánica de la cosecha (ej: Camotillo, Perricholi).");
      return;
    }

    const volumenNum = Number(volumenDisponible);
    const precioNum = Number(precioPerKg);

    if (isNaN(volumenNum) || volumenNum <= 0) {
      setErrorValidacion("El volumen total disponible debe ser un número estrictamente mayor a 0 kg.");
      return;
    }

    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorValidacion("El precio por kilogramo debe ser una tarifa comercial válida mayor a S/. 0.00.");
      return;
    }

    // Composición formal de la carga útil del producto
    onSave({
      titulo: titulo.trim() || `${rubro} Variedad ${variedad.trim()} — Origen ${distritoOrigen}`,
      rubro,
      variedad: variedad.trim(),
      volumenDisponible: volumenNum,
      precioPerKg: precioNum,
      distritoOrigen,
      // Asignamos una imagen aleatoria pero realista del sector agropecuario para pruebas visuales en Junín
      imagenUrl:
        rubro === "Tubérculos" 
          ? "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80" 
          : "https://images.unsplash.com/photo-1574325131876-a799961e2e5a?w=800&q=80",
      fechaCosecha,
      descripcion: `Cosecha fresca y seleccionada a mano de ${variedad.trim()} cultivada en tierras del distrito de ${distritoOrigen}. Cumple con los estándares sanitarios regionales del Valle del Mantaro. Canal directo de comunicación con ${agricultor.nombre} al teléfono ${agricultor.telefono}.`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <form
        onSubmit={manejarEnvioFormulario}
        className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-success" />
            <h3 className="font-bold text-foreground text-lg tracking-tight">Publicar Cosecha Comercial</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground text-xl font-light cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-5 space-y-4 text-sm flex-1">
          
          {errorValidacion && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs text-muted-foreground space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1">
              <User className="w-3 h-3 text-success" /> Vinculación Automática de Identidad
            </div>
            <p>Este lote figurará público bajo el nombre de <strong>{agricultor.nombre}</strong> y se usará tu teléfono <strong>{agricultor.telefono}</strong> para la trazabilidad telefónica directa del flete.</p>
          </div>

          <MInput
            label="Título comercial de la publicación"
            value={titulo}
            onChange={setTitulo}
            placeholder="Ej: Papa Nativa Camotillo limpia en sacos"
            icon={<Tag className="w-4 h-4 text-muted-foreground" />}
          />

          <div className="grid grid-cols-2 gap-3">
            <MSelect
              label="Rubro Oficial"
              value={rubro}
              onChange={(v) => setRubro(v as any)}
              options={["Tubérculos", "Cereales", "Hortalizas", "Frutas"]}
            />
            <MInput
              label="Variedad Botánica"
              value={variedad}
              onChange={setVariedad}
              placeholder="Camotillo, Perricholi..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MInput
              label="Volumen Total (kg)"
              type="number"
              value={volumenDisponible}
              onChange={setVolumenDisponible}
              icon={<Layers className="w-4 h-4 text-muted-foreground" />}
            />
            <MInput
              label="Precio por kg (S/.)"
              type="number"
              step="0.01"
              value={precioPerKg}
              onChange={setPrecioPerKg}
              icon={<DollarSign className="w-4 h-4 text-success" />}
            />
          </div>

          <MSelect
            label="Distrito de Origen (Centro de Acopio en Chacra)"
            value={distritoOrigen}
            onChange={setDistritoOrigen}
            options={["Aco", "Concepción", "Orcotuna", "Mito", "Sincos"]}
          />

          <MInput
            label="Fecha programada de recojo / cosecha"
            type="date"
            value={fechaCosecha}
            onChange={setFechaCosecha}
            icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
          />

          <div className="border-2 border-dashed border-input rounded-xl py-6 text-center text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer transition-colors space-y-1">
            <Package className="w-6 h-6 mx-auto opacity-40 text-success" />
            <div className="font-semibold text-foreground">Imágenes de la Parcela</div>
            <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto">El sistema cargará automáticamente una fotografía satelital del cultivo basada en el distrito de origen.</p>
          </div>
        </div>

        {/* Botones de Acción Inalterados */}
        <div className="p-5 border-t border-border flex gap-2 bg-card sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-input py-3 rounded-xl text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 bg-success text-success-foreground font-black py-3 rounded-xl shadow-sm hover:opacity-95 transition-opacity text-sm cursor-pointer"
          >
            Lanzar Publicación
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * COMPONENTE DE ABSTRACCIÓN: INPUT TEXT INTEGRAL
 */
function MInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  step?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-foreground tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-input rounded-xl py-2.5 text-sm font-medium bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-success/20 focus:border-success transition-all ${
            icon ? "pl-9 pr-3" : "px-3"
          }`}
        />
      </div>
    </div>
  );
}

/**
 * COMPONENTE DE ABSTRACCIÓN: SELECT OPTION INTEGRAL
 */
function MSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-foreground tracking-wide uppercase text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-input rounded-xl px-3 py-2.5 bg-card text-foreground text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-success/20 focus:border-success transition-all cursor-pointer"
      >
        {options.map((optionItem) => (
          <option key={optionItem} value={optionItem} className="bg-card text-foreground font-medium">
            {optionItem}
          </option>
        ))}
      </select>
    </div>
  );
}