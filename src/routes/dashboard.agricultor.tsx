import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAppStore, uploadFileToStorage } from "@/context/useAppStore";
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
  CheckCircle2,
  Clock,
  X,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Upload,
  ImageIcon,
  Loader2,
  AlertCircle,
  Sprout,
  AlertTriangle,
} from "lucide-react";
import type { Distrito, Rubro } from "@/context/types";
import type { OrderStatus } from "@/context/types";

export const Route = createFileRoute("/dashboard/agricultor")({
  component: AgricultorDashboard,
});

// ─── Constantes ──────────────────────────────────────────────────────────────

const RUBROS: Rubro[] = ["Tubérculos", "Hortalizas", "Legumbres", "Cereales"];

const DISTRITOS_ORIGEN: Distrito[] = [
  "Aco",
  "Concepción",
  "Orcotuna",
  "Mito",
  "Sincos",
];

const STATUS_BADGE: Record<string, { txt: string; cls: string }> = {
  disponible: {
    txt: "Disponible · Buscando comprador",
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
  },
  vendido: {
    txt: "Inactivo · Fuera del catálogo",
    cls: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
  },
  reservado: {
    txt: "Reservado · Pago recibido",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  },
  PAGO_EN_CUSTODIA: {
    txt: "Reservado · Pago en custodia",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  },
  EN_CAMINO: {
    txt: "En Camino · Transportista asignado",
    cls: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
  },
  ENTREGADO: {
    txt: "Entregado · En espera de liquidación",
    cls: "bg-amber-500/10 text-amber-700 border border-amber-500/20",
  },
  COMPLETADO: {
    txt: "Vendido · Trato liquidado y cerrado",
    cls: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
  },
  pendiente_flete: {
    txt: "Reservado · Buscando transportista",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  },
  flete_asignado: {
    txt: "Flete Asignado",
    cls: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
  },
  cargando_origen: {
    txt: "Cargando en Origen",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
  },
  en_transito: {
    txt: "En Tránsito",
    cls: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
  },
  por_confirmar: {
    txt: "Llegó a Destino",
    cls: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
  },
  entregado: {
    txt: "Entregado",
    cls: "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20",
  },
};

// ─── Tipos del formulario de publicación / edición ────────────────────────────

interface HarvestForm {
  titulo: string;
  rubro: Rubro | "";
  variedad: string;
  volumenDisponible: string;
  precioPerKg: string;
  distritoOrigen: Distrito | "";
  fechaCosecha: string;
  descripcion: string;
  imagenFile: File | null;
}

const HARVEST_FORM_INICIAL: HarvestForm = {
  titulo: "",
  rubro: "",
  variedad: "",
  volumenDisponible: "",
  precioPerKg: "",
  distritoOrigen: "",
  fechaCosecha: "",
  descripcion: "",
  imagenFile: null,
};

// ─── Componente principal ─────────────────────────────────────────────────────

function AgricultorDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  // Redirigir si no es agricultor
  useEffect(() => {
    if (usuario.rol !== "agricultor") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);

  // ── Datos del store ───────────────────────────────────────────────────
  const productos = useAppStore((s) => s.productos);
  const ordenes = useAppStore((s) => s.ordenes);
  const addProducto = useAppStore((s) => s.addProducto);
  const updateProducto = useAppStore((s) => s.updateProducto);
  const eliminarProducto = useAppStore((s) => s.eliminarProducto);
  const desactivarProducto = useAppStore((s) => s.desactivarProducto);

  // ── Estado del detalle de orden ───────────────────────────────────────
  const [selectedOrdenId, setSelectedOrdenId] = useState<string | null>(null);

  // ── Estado del modal de publicar/editar ───────────────────────────────
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null); // null = nuevo, id = edición

  // ── Estado del formulario dentro del modal ────────────────────────────
  const [form, setForm] = useState<HarvestForm>(HARVEST_FORM_INICIAL);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [imagenUrl, setImagenUrl] = useState<string>("");
  const [imagenCargada, setImagenCargada] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ── Estado del diálogo de confirmación ───────────────────────────────
  const [confirmacion, setConfirmacion] = useState<{
    tipo: "eliminar" | "desactivar";
    productoId: string;
    titulo: string;
  } | null>(null);
  const [accionLoading, setAccionLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Datos derivados ────────────────────────────────────────────────────
  const misProductos = useMemo(() => {
    return productos.filter((p) => p.agricultorId === usuario.id);
  }, [productos, usuario.id]);

  const misOrdenes = useMemo(() => {
    return ordenes.filter((o) => o.agricultorId === usuario.id);
  }, [ordenes, usuario.id]);

  const gananciasTotales = useMemo(() => {
    return misOrdenes
      .filter(
        (o) =>
          o.status === "COMPLETADO" ||
          o.status === "completado" ||
          o.status === "ENTREGADO" ||
          o.status === "entregado"
      )
      .reduce((acc, o) => acc + o.totalPagoProducto, 0);
  }, [misOrdenes]);

  const totalKilosVendidos = useMemo(() => {
    return misOrdenes
      .filter(
        (o) =>
          o.status === "COMPLETADO" ||
          o.status === "completado" ||
          o.status === "ENTREGADO" ||
          o.status === "entregado"
      )
      .reduce((acc, o) => acc + o.cantidadComprada, 0);
  }, [misOrdenes]);

  const isApproved =
    usuario.verificacionEstado === "aprobado" || usuario.isMidagriVerified;

  // ── Helpers de estado del producto ────────────────────────────────────
  const getStatusKey = (p: typeof misProductos[0]): string => {
    if (p.status === "vendido") return "vendido";
    if (p.status === "reservado") {
      const ordenAsociada = misOrdenes.find((o) => o.productoId === p.id);
      if (ordenAsociada) return ordenAsociada.status;
      return "PAGO_EN_CUSTODIA";
    }
    return "disponible";
  };

  // ── Limpiar blob al desmontar ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Abrir modal para NUEVA publicación ────────────────────────────────
  const abrirModalNuevo = useCallback(() => {
    setForm(HARVEST_FORM_INICIAL);
    setPreviewUrl(null);
    setImagenUrl("");
    setImagenCargada(false);
    setFormError(null);
    setEditandoId(null);
    setModalAbierto(true);
  }, []);

  // ── Abrir modal para EDITAR publicación existente ─────────────────────
  const abrirModalEdicion = useCallback(
    (p: typeof misProductos[0]) => {
      setForm({
        titulo: p.titulo,
        rubro: p.rubro,
        variedad: p.variedad,
        volumenDisponible: String(p.volumenDisponible),
        precioPerKg: String(p.precioPerKg),
        distritoOrigen: p.distritoOrigen,
        fechaCosecha: p.fechaCosecha.split("T")[0], // normalizar fecha
        descripcion: p.descripcion.replace(/^\*|\*$/g, ""), // quitar cursiva guardada
        imagenFile: null,
      });
      setPreviewUrl(p.imagenUrl || null);
      setImagenUrl(p.imagenUrl || "");
      setImagenCargada(!!p.imagenUrl);
      setFormError(null);
      setEditandoId(p.id);
      setModalAbierto(true);
    },
    []
  );

  // ── Cerrar modal ──────────────────────────────────────────────────────
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setEditandoId(null);
    if (previewUrl && !imagenUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFormError(null);
  }, [previewUrl, imagenUrl]);

  // ── Actualizar campo del form ──────────────────────────────────────────
  const setField = useCallback(<K extends keyof HarvestForm>(key: K, value: HarvestForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }, []);

  // ── Subir imagen ──────────────────────────────────────────────────────
  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    const blob = URL.createObjectURL(file);
    setPreviewUrl(blob);
    setForm((prev) => ({ ...prev, imagenFile: file }));
    setImagenCargada(false);
    setImagenUrl("");
    setSubiendoImagen(true);

    try {
      const url = await uploadFileToStorage("product_images", file);
      if (url) {
        setImagenUrl(url);
        setImagenCargada(true);
      } else {
        setFormError("Error al subir la imagen. Intenta con otro archivo.");
        setPreviewUrl(null);
        setForm((prev) => ({ ...prev, imagenFile: null }));
      }
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      setFormError("Error de conexión al subir la imagen.");
      setPreviewUrl(null);
      setForm((prev) => ({ ...prev, imagenFile: null }));
    } finally {
      setSubiendoImagen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const eliminarImagen = () => {
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setImagenUrl("");
    setImagenCargada(false);
    setForm((prev) => ({ ...prev, imagenFile: null }));
  };

  // ── Validar formulario ────────────────────────────────────────────────
  const validarForm = (): string | null => {
    if (!form.titulo.trim()) return "El título es obligatorio.";
    if (!form.rubro) return "Selecciona el rubro del producto.";
    if (!form.variedad.trim()) return "Indica la variedad.";
    if (!form.volumenDisponible || Number(form.volumenDisponible) <= 0)
      return "El volumen debe ser mayor a 0.";
    if (!form.precioPerKg || Number(form.precioPerKg) <= 0)
      return "El precio por kg debe ser mayor a 0.";
    if (!form.distritoOrigen) return "Selecciona el distrito de origen.";
    if (!form.fechaCosecha) return "Indica la fecha de cosecha.";
    return null;
  };

  // ── Publicar nueva cosecha ────────────────────────────────────────────
  const handlePublicar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const err = validarForm();
    if (err) { setFormError(err); return; }

    setFormLoading(true);
    try {
      const urlFinal =
        imagenUrl ||
        `https://placehold.co/400x300/4ade80/ffffff?text=${encodeURIComponent(form.titulo.slice(0, 12))}`;

      const resultado = await addProducto({
        titulo: form.titulo.trim(),
        rubro: form.rubro as Rubro,
        variedad: form.variedad.trim(),
        volumenDisponible: Number(form.volumenDisponible),
        precioPerKg: Number(form.precioPerKg),
        distritoOrigen: form.distritoOrigen as Distrito,
        fechaCosecha: form.fechaCosecha,
        imagenUrl: urlFinal,
        descripcion: form.descripcion.trim()
          ? `*${form.descripcion.trim()}*`
          : "",
      });

      if (!resultado) {
        setFormError("No se pudo publicar. Verifica tu conexión e intenta de nuevo.");
        return;
      }

      cerrarModal();
    } catch (err) {
      console.error("Error publicando cosecha:", err);
      setFormError("Error inesperado al publicar la cosecha.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Guardar edición de cosecha ────────────────────────────────────────
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editandoId) return;

    const err = validarForm();
    if (err) { setFormError(err); return; }

    setFormLoading(true);
    try {
      const urlFinal =
        imagenUrl ||
        `https://placehold.co/400x300/4ade80/ffffff?text=${encodeURIComponent(form.titulo.slice(0, 12))}`;

      await updateProducto(editandoId, {
        titulo: form.titulo.trim(),
        rubro: form.rubro as Rubro,
        variedad: form.variedad.trim(),
        volumenDisponible: Number(form.volumenDisponible),
        precioPerKg: Number(form.precioPerKg),
        distritoOrigen: form.distritoOrigen as Distrito,
        fechaCosecha: form.fechaCosecha,
        imagenUrl: urlFinal,
        descripcion: form.descripcion.trim()
          ? `*${form.descripcion.trim()}*`
          : "",
      });

      cerrarModal();
    } catch (err) {
      console.error("Error editando cosecha:", err);
      setFormError("Error inesperado al actualizar la cosecha.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Confirmar eliminación / desactivación ─────────────────────────────
  const handleConfirmarAccion = async () => {
    if (!confirmacion) return;
    setAccionLoading(true);
    try {
      if (confirmacion.tipo === "eliminar") {
        await eliminarProducto(confirmacion.productoId);
      } else {
        await desactivarProducto(confirmacion.productoId);
      }
    } catch (err) {
      console.error("Error en acción de confirmación:", err);
    } finally {
      setAccionLoading(false);
      setConfirmacion(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-200">

      {/* ── SECCIÓN 1: CABECERA ── */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 flex-wrap shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-success shrink-0 border border-success/10 shadow-inner">
          {usuario.nombre ? usuario.nombre[0].toUpperCase() : "A"}
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {usuario.nombre}
            </h1>
            <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2 py-0.5 rounded-md border border-border">
              ID: {usuario.id}
            </span>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4 text-success" />
            {usuario.ubicacion || "Sin ubicación"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            {usuario.telefono || "Sin teléfono registrado"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:mt-0 mt-2">
          {isApproved ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-2 rounded-xl border border-emerald-500/20 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Productor Verificado Aprobado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-700 text-xs font-bold px-3 py-2 rounded-xl border border-yellow-500/20 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-yellow-600" />
              Perfil en Proceso de Verificación
            </span>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 2: MÉTRICAS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MLMetricsCard
          label="Ganancias Estimadas / Reales"
          value={formatSoles(gananciasTotales)}
          hint="Suma de ventas entregadas y liquidadas"
          accent="success"
        />
        <MLMetricsCard
          label="Volumen Despachado"
          value={formatKg(totalKilosVendidos)}
          hint="Volumen total despachado físicamente"
          accent="earth"
        />
        <MLMetricsCard
          label="Cosechas en Vitrina Abierta"
          value={String(misProductos.filter((p) => p.status === "disponible").length)}
          hint="Visible en catálogo para compradores"
          accent="primary"
        />
      </section>

      {/* ── SECCIÓN 3: GESTIÓN DE COSECHAS ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Gestión de Cosechas en Mercado
            </h2>
            <p className="text-xs text-muted-foreground">
              Tienes {misProductos.length} cosecha(s) registradas en AgroConecta.
            </p>
          </div>

          {/* Botón Publicar nueva cosecha (abre modal) */}
          <button
            type="button"
            onClick={abrirModalNuevo}
            className="bg-success text-success-foreground font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm hover:bg-success/90 transition-all text-sm active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Publicar nueva cosecha
          </button>
        </div>

        {/* Tabla de cosechas */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {misProductos.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-70">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1">
                Ninguna publicación activa
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                Aún no has registrado cosechas. Haz clic abajo para crear tu primera oferta.
              </p>
              <button
                type="button"
                onClick={abrirModalNuevo}
                className="text-success font-bold text-sm hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Sprout className="w-4 h-4" />
                Publicar mi primera cosecha ahora mismo →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[40%]">
                      Detalle del Producto / Variedad
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell w-[13%]">
                      Precio base / kg
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell w-[13%]">
                      Stock
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[20%]">
                      Estado
                    </th>
                    <th className="px-4 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[14%] text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {misProductos.map((p) => {
                    const statusKey = getStatusKey(p);
                    const badge = STATUS_BADGE[statusKey] || {
                      txt: "Desconocido",
                      cls: "bg-muted text-muted-foreground",
                    };
                    const editable = p.status === "disponible";

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* Columna: imagen + info */}
                        <td className="px-4 py-3.5">
                          <div className="flex gap-3 items-center">
                            <img
                              src={p.imagenUrl}
                              alt={p.titulo}
                              className="w-12 h-12 object-cover rounded-xl shrink-0 border border-border shadow-sm group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/48x48/e5e7eb/9ca3af?text=?";
                              }}
                            />
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-foreground leading-snug truncate max-w-[200px]">
                                {p.titulo}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                                  <Layers className="w-3 h-3" />
                                  {p.rubro}
                                </span>
                                <span className="text-zinc-300">•</span>
                                <span>Var: {p.variedad}</span>
                                <span className="text-zinc-300">•</span>
                                <span className="inline-flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {p.distritoOrigen}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna: precio */}
                        <td className="px-4 py-3.5 hidden sm:table-cell font-semibold text-foreground">
                          {formatSoles(p.precioPerKg)}
                        </td>

                        {/* Columna: stock */}
                        <td className="px-4 py-3.5 hidden md:table-cell font-medium text-muted-foreground">
                          {formatKg(p.volumenDisponible)}
                        </td>

                        {/* Columna: badge de estado */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm ${badge.cls}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
                            {badge.txt}
                          </span>
                        </td>

                        {/* Columna: acciones */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Editar (solo si está disponible) */}
                            <button
                              type="button"
                              title={editable ? "Editar publicación" : "No editable en este estado"}
                              disabled={!editable}
                              onClick={() => abrirModalEdicion(p)}
                              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Desactivar (solo si está disponible) */}
                            <button
                              type="button"
                              title={editable ? "Desactivar del catálogo" : "Ya no está activa"}
                              disabled={!editable}
                              onClick={() =>
                                setConfirmacion({
                                  tipo: "desactivar",
                                  productoId: p.id,
                                  titulo: p.titulo,
                                })
                              }
                              className="p-2 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>

                            {/* Eliminar */}
                            <button
                              type="button"
                              title="Eliminar permanentemente"
                              onClick={() =>
                                setConfirmacion({
                                  tipo: "eliminar",
                                  productoId: p.id,
                                  titulo: p.titulo,
                                })
                              }
                              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* ── HISTORIAL DE VENTAS ── */}
      {misOrdenes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <h2 className="font-bold text-foreground text-base tracking-tight">
                Historial de Transacciones Comerciales
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              Mostrando las últimas 5 operaciones
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {misOrdenes.slice(0, 5).map((o) => {
              const isSelected = selectedOrdenId === o.id;
              return (
                <div
                  key={o.id}
                  className={`border rounded-xl p-4 transition-all space-y-3 ${
                    isSelected
                      ? "border-success bg-success/5 shadow-sm"
                      : "border-border hover:border-zinc-300 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="font-bold text-foreground text-sm">
                        {o.tituloProducto}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-medium text-zinc-600">
                          Orden ID: {o.id}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {o.fechaCreacion
                            ? new Date(o.fechaCreacion).toLocaleDateString("es-PE")
                            : "N/A"}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-foreground">
                          {formatKg(o.cantidadComprada)}
                        </span>
                        <span>→ Destino: {o.distritoDestino}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-black text-success text-base leading-none">
                        {formatSoles(o.totalPagoProducto)}
                      </div>
                      <button
                        onClick={() =>
                          setSelectedOrdenId(isSelected ? null : o.id)
                        }
                        className="text-xs font-semibold text-success hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                      >
                        {isSelected ? "Ocultar detalles ▲" : "Ver traza completa ▼"}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-dashed border-border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-1 duration-150">
                      {/* Datos del comprador */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50">
                        <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          Datos del Comprador
                        </div>
                        <div className="font-semibold text-foreground text-sm">
                          {o.nombreComprador}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {o.telefonoComprador}
                        </div>
                      </div>

                      {/* Operador de flete */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50">
                        <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                          <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          Operador de Flete Asignado
                        </div>
                        {o.transportistaId ? (
                          <>
                            <div className="font-semibold text-foreground text-sm">
                              {o.nombreTransportista}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {o.telefonoTransportista}
                            </div>
                            <div className="mt-1 bg-card border border-border px-2 py-1 rounded text-[11px] font-medium text-foreground inline-block">
                              Placa:{" "}
                              <span className="font-mono font-bold text-success">
                                {o.vehiculoPlaca}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground italic py-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                            Buscando transportista libre...
                          </div>
                        )}
                      </div>

                      {/* Trazabilidad */}
                      <div className="space-y-1.5 p-3 bg-muted/40 rounded-xl border border-border/50 flex flex-col justify-between">
                        <div>
                          <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                            <Info className="w-3.5 h-3.5 text-zinc-400" />
                            Trazabilidad Escrow
                          </div>
                          <div className="mt-1.5">
                            <span className="inline-block bg-zinc-800 text-white font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                              {o.status}
                            </span>
                          </div>
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: PUBLICAR / EDITAR COSECHA                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cerrarModal}
          />

          {/* Panel del modal */}
          <div className="relative z-10 bg-background w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-border shadow-2xl overflow-y-auto max-h-[95dvh] animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-background z-10">
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  {editandoId ? "Editar cosecha" : "Publicar nueva cosecha"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editandoId
                    ? "Modifica los datos y guarda los cambios."
                    : "Completa el formulario para que los compradores encuentren tu producto."}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form
              onSubmit={editandoId ? handleGuardarEdicion : handlePublicar}
              className="p-5 space-y-5"
              noValidate
            >
              {/* Error del formulario */}
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Bloque: Identificación */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Identificación del Producto
                </p>

                {/* Título */}
                <ModalField label="Título de la publicación" required>
                  <input
                    type="text"
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                    placeholder='Ej: Papa Nativa Criolla — Cosecha Directa'
                    value={form.titulo}
                    onChange={(e) => setField("titulo", e.target.value)}
                    maxLength={120}
                  />
                </ModalField>

                {/* Rubro + Variedad */}
                <div className="grid grid-cols-2 gap-3">
                  <ModalField label="Rubro" required>
                    <select
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                      value={form.rubro}
                      onChange={(e) => setField("rubro", e.target.value as Rubro)}
                    >
                      <option value="">Selecciona...</option>
                      {RUBROS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </ModalField>

                  <ModalField label="Variedad" required>
                    <input
                      type="text"
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                      placeholder='Ej: Peruanita'
                      value={form.variedad}
                      onChange={(e) => setField("variedad", e.target.value)}
                    />
                  </ModalField>
                </div>
              </div>

              {/* Bloque: Volumen, precio y logística */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Volumen, Precio y Logística
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Volumen */}
                  <ModalField label="Volumen (kg)" required>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="w-full border border-input rounded-lg px-3 py-2.5 pr-9 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                        placeholder="Ej: 500"
                        value={form.volumenDisponible}
                        onChange={(e) => setField("volumenDisponible", e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                        kg
                      </span>
                    </div>
                  </ModalField>

                  {/* Precio */}
                  <ModalField label="Precio (S/./ kg)" required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                        S/.
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="w-full border border-input rounded-lg pl-9 pr-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                        placeholder="0.00"
                        value={form.precioPerKg}
                        onChange={(e) => setField("precioPerKg", e.target.value)}
                      />
                    </div>
                  </ModalField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Distrito */}
                  <ModalField label="Distrito de origen" required>
                    <select
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                      value={form.distritoOrigen}
                      onChange={(e) => setField("distritoOrigen", e.target.value as Distrito)}
                    >
                      <option value="">Selecciona...</option>
                      {DISTRITOS_ORIGEN.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </ModalField>

                  {/* Fecha cosecha */}
                  <ModalField label="Fecha de cosecha" required>
                    <input
                      type="date"
                      className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                      value={form.fechaCosecha}
                      onChange={(e) => setField("fechaCosecha", e.target.value)}
                    />
                  </ModalField>
                </div>

                {/* Valor estimado */}
                {form.volumenDisponible && form.precioPerKg && (
                  <div className="bg-success/5 border border-success/20 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor estimado:</span>
                    <span className="font-black text-success">
                      S/. {(Number(form.volumenDisponible) * Number(form.precioPerKg)).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Bloque: Imagen */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Foto del Producto
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagen}
                />

                {previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-full h-40 object-cover"
                    />
                    {subiendoImagen && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                        <span className="text-white text-xs font-semibold">Subiendo...</span>
                      </div>
                    )}
                    {imagenCargada && !subiendoImagen && (
                      <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 bg-success text-success-foreground text-xs font-bold px-2.5 py-0.5 rounded-full shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Subida
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={eliminarImagen}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={subiendoImagen}
                    className="w-full border-2 border-dashed border-input hover:border-success/50 hover:bg-success/5 rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-all"
                  >
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <Upload className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                      Haz clic para subir una foto
                    </span>
                  </button>
                )}
              </div>

              {/* Bloque: Descripción */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Descripción <span className="normal-case font-normal">(opcional)</span>
                </p>
                <textarea
                  rows={3}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                  placeholder="Características especiales, calidad, método de cultivo..."
                  value={form.descripcion}
                  onChange={(e) => setField("descripcion", e.target.value)}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground italic">
                    Se guardará en cursiva en la ficha del producto.
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {form.descripcion.length}/500
                  </span>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={formLoading}
                  className="flex-1 border border-input py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading || subiendoImagen}
                  className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editandoId ? "Guardando..." : "Publicando..."}
                    </>
                  ) : (
                    <>
                      <Sprout className="w-4 h-4" />
                      {editandoId ? "Guardar cambios" : "Publicar cosecha"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: CONFIRMACIÓN DE ELIMINAR / DESACTIVAR                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {confirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !accionLoading && setConfirmacion(null)}
          />

          <div className="relative z-10 bg-background w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            {/* Ícono de advertencia */}
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>

            <h3 className="font-bold text-foreground text-center text-lg">
              {confirmacion.tipo === "eliminar"
                ? "¿Eliminar esta cosecha?"
                : "¿Desactivar esta cosecha?"}
            </h3>

            <p className="text-sm text-muted-foreground text-center mt-2">
              {confirmacion.tipo === "eliminar" ? (
                <>
                  Se eliminará permanentemente{" "}
                  <strong className="text-foreground">"{confirmacion.titulo}"</strong>{" "}
                  y no podrá recuperarse.
                </>
              ) : (
                <>
                  <strong className="text-foreground">"{confirmacion.titulo}"</strong>{" "}
                  dejará de aparecer en el catálogo. Podrás publicarla nuevamente después.
                </>
              )}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={accionLoading}
                onClick={() => setConfirmacion(null)}
                className="flex-1 border border-input py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={accionLoading}
                onClick={handleConfirmarAccion}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 ${
                  confirmacion.tipo === "eliminar"
                    ? "bg-destructive hover:opacity-90"
                    : "bg-amber-600 hover:opacity-90"
                }`}
              >
                {accionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {confirmacion.tipo === "eliminar" ? "Eliminando..." : "Desactivando..."}
                  </>
                ) : confirmacion.tipo === "eliminar" ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, eliminar
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Sí, desactivar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente auxiliar de campo de modal ────────────────────────────────────

function ModalField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}