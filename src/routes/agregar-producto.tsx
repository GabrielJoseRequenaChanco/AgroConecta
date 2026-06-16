import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore, uploadFileToStorage } from "@/context/useAppStore";
import {
  Upload,
  Loader2,
  CheckCircle2,
  X,
  Sprout,
  ImageIcon,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import type { Distrito, Rubro } from "@/context/types";

export const Route = createFileRoute("/agregar-producto")({
  component: AgregarProducto,
});

// ─── Opciones de selects ────────────────────────────────────────────────────

const RUBROS: Rubro[] = ["Tubérculos", "Hortalizas", "Legumbres", "Cereales"];

const DISTRITOS_ORIGEN: Distrito[] = [
  "Aco",
  "Concepción",
  "Orcotuna",
  "Mito",
  "Sincos",
];

// ─── Tipos internos del formulario ──────────────────────────────────────────

interface FormState {
  titulo: string;
  rubro: Rubro | "";
  variedad: string;
  volumenDisponible: string; // string para binding del input, luego se convierte a number
  precioPerKg: string;       // ídem
  distritoOrigen: Distrito | "";
  fechaCosecha: string;
  descripcion: string;
  imagenFile: File | null;
}

const FORM_INICIAL: FormState = {
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

// ─── Componente ─────────────────────────────────────────────────────────────

function AgregarProducto() {
  const addProducto = useAppStore((s) => s.addProducto);
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  // ── Estado del formulario ──────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [imagenUrl, setImagenUrl] = useState<string>("");
  const [imagenCargada, setImagenCargada] = useState(false);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Limpieza del blob de preview al desmontar ──────────────────────────
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ── Actualizar campo genérico del form ────────────────────────────────
  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError(null);
    },
    []
  );

  // ── handleImagen: extrae File, genera preview, sube a Supabase Storage ─
  const handleImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limpiar preview previo si existe
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const blob = URL.createObjectURL(file);
    setPreviewUrl(blob);
    setForm((prev) => ({ ...prev, imagenFile: file }));
    setImagenCargada(false);
    setErrorImagen(null);
    setImagenUrl("");
    setSubiendoImagen(true);

    try {
      const url = await uploadFileToStorage("product_images", file);
      if (url) {
        setImagenUrl(url);
        setImagenCargada(true);
      } else {
        setErrorImagen("Error al subir la imagen. Intenta con otro archivo.");
        setPreviewUrl(null);
        setForm((prev) => ({ ...prev, imagenFile: null }));
      }
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      setErrorImagen("Error de conexión al subir la imagen.");
      setPreviewUrl(null);
      setForm((prev) => ({ ...prev, imagenFile: null }));
    } finally {
      setSubiendoImagen(false);
      // Reset el input para permitir volver a seleccionar el mismo archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ── Eliminar imagen seleccionada ───────────────────────────────────────
  const eliminarImagen = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setImagenUrl("");
    setImagenCargada(false);
    setErrorImagen(null);
    setForm((prev) => ({ ...prev, imagenFile: null }));
  };

  // ── Validación de campos obligatorios ────────────────────────────────
  const validar = (): string | null => {
    if (!form.titulo.trim()) return "El título de la publicación es obligatorio.";
    if (!form.rubro) return "Selecciona el rubro del producto.";
    if (!form.variedad.trim()) return "Indica la variedad del producto.";
    if (!form.volumenDisponible || Number(form.volumenDisponible) <= 0)
      return "El volumen disponible debe ser mayor a 0.";
    if (!form.precioPerKg || Number(form.precioPerKg) <= 0)
      return "El precio por kg debe ser mayor a 0.";
    if (!form.distritoOrigen) return "Selecciona el distrito de origen.";
    if (!form.fechaCosecha) return "Indica la fecha de la cosecha.";
    return null;
  };

  // ── handleSubmit: construye el objeto final y llama addProducto ────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validacionError = validar();
    if (validacionError) {
      setError(validacionError);
      return;
    }

    setLoading(true);

    try {
      // Construir la URL de imagen: usar la subida real o un fallback descriptivo
      const urlFinal =
        imagenUrl ||
        `https://placehold.co/400x300/4ade80/ffffff?text=${encodeURIComponent(form.titulo.slice(0, 15))}`;

      // Objeto final con la estructura exacta que espera addProducto
      const payload = {
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
      };

      const resultado = await addProducto(payload);

      if (!resultado) {
        setError("No se pudo publicar la cosecha. Verifica tu conexión e intenta de nuevo.");
        return;
      }

      // Limpiar estado y mostrar éxito
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setForm(FORM_INICIAL);
      setPreviewUrl(null);
      setImagenUrl("");
      setImagenCargada(false);
      setExitoso(true);

      // Redirigir al dashboard después de 1.5 s
      setTimeout(() => {
        router.navigate({ to: "/dashboard/agricultor" as any });
      }, 1500);
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      setError("Error inesperado al publicar la cosecha.");
    } finally {
      setLoading(false);
    }
  };

  // ── Guard: solo agricultores ──────────────────────────────────────────
  if (usuario.rol !== "agricultor") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Sprout className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-bold text-lg text-foreground mb-2">
          Acceso restringido
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Debes estar registrado como <strong>Agricultor</strong> para publicar cosechas.
        </p>
        <Link
          to="/registro"
          className="inline-flex items-center gap-2 bg-success text-success-foreground font-bold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <Sprout className="w-4 h-4" />
          Crear cuenta como Agricultor
        </Link>
      </div>
    );
  }

  // ── Pantalla de éxito ─────────────────────────────────────────────────
  if (exitoso) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-success/20">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="font-bold text-xl text-foreground mb-2">
          ¡Cosecha publicada con éxito!
        </h2>
        <p className="text-muted-foreground text-sm">
          Tu producto ya está visible en AgroConecta. Redirigiendo al dashboard...
        </p>
      </div>
    );
  }

  // ── Formulario principal ──────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Cabecera */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.navigate({ to: "/dashboard/agricultor" as any })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al dashboard
        </button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Publicar nueva cosecha
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Completa el formulario para que compradores de Junín encuentren tu producto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* Error global */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Bloque 1: Identificación del producto ── */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
            Identificación del Producto
          </h2>

          {/* Título */}
          <FormField label="Título de la publicación" required>
            <input
              type="text"
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
              placeholder='Ej: Papa Nativa Criolla — Cosecha Directa del Productor'
              value={form.titulo}
              onChange={(e) => setField("titulo", e.target.value)}
              maxLength={120}
            />
          </FormField>

          {/* Rubro + Variedad */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rubro / Categoría" required>
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
            </FormField>

            <FormField label="Variedad" required>
              <input
                type="text"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                placeholder='Ej: Peruanita, Huayro'
                value={form.variedad}
                onChange={(e) => setField("variedad", e.target.value)}
              />
            </FormField>
          </div>
        </div>

        {/* ── Bloque 2: Volumen, precio y logística ── */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
            Volumen, Precio y Logística
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Volumen disponible */}
            <FormField label="Volumen disponible (kg)" required>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="w-full border border-input rounded-lg px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                  placeholder="Ej: 500"
                  value={form.volumenDisponible}
                  onChange={(e) => setField("volumenDisponible", e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  kg
                </span>
              </div>
            </FormField>

            {/* Precio por kg */}
            <FormField label="Precio base (S/. / kg)" required>
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
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Distrito de origen */}
            <FormField label="Distrito de origen" required>
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
            </FormField>

            {/* Fecha de cosecha */}
            <FormField label="Fecha de cosecha" required>
              <input
                type="date"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
                value={form.fechaCosecha}
                onChange={(e) => setField("fechaCosecha", e.target.value)}
                max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </FormField>
          </div>
        </div>

        {/* ── Bloque 3: Foto del producto ── */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
            Foto del Producto
          </h2>

          {/* Input de archivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagen}
          />

          {/* Zona de carga / preview */}
          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={previewUrl}
                alt="Vista previa de la cosecha"
                className="w-full h-48 object-cover"
              />
              {/* Overlay de carga mientras sube a Supabase */}
              {subiendoImagen && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white text-xs font-semibold">Subiendo imagen...</span>
                </div>
              )}
              {/* Badge de éxito */}
              {imagenCargada && !subiendoImagen && (
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Imagen subida
                </div>
              )}
              {/* Botón para eliminar la imagen */}
              <button
                type="button"
                onClick={eliminarImagen}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoImagen}
              className="w-full border-2 border-dashed border-input hover:border-success/50 hover:bg-success/5 rounded-xl py-10 flex flex-col items-center justify-center gap-3 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-success/10 transition-colors">
                <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-success transition-colors" />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-foreground group-hover:text-success transition-colors">
                  <Upload className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
                  Haz clic para subir una foto
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  JPG, PNG, WEBP — Máx. 5 MB recomendado
                </div>
              </div>
            </button>
          )}

          {/* Error de imagen */}
          {errorImagen && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorImagen}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Una foto nítida aumenta hasta un <strong>3× las consultas</strong> de compradores.
            Si no subes foto, se usará un placeholder automático.
          </p>
        </div>

        {/* ── Bloque 4: Descripción ── */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">
            Descripción adicional <span className="normal-case font-normal">(opcional)</span>
          </h2>
          <textarea
            rows={4}
            className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-success/30 focus:border-success transition"
            placeholder="Describe características especiales, calidad, método de cultivo, condición de almacenamiento..."
            value={form.descripcion}
            onChange={(e) => setField("descripcion", e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground italic">
              Se guardará en cursiva en la ficha del producto.
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {form.descripcion.length}/500
            </span>
          </div>
        </div>

        {/* ── Resumen de precio estimado ── */}
        {form.volumenDisponible && form.precioPerKg && (
          <div className="bg-success/5 border border-success/20 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Valor estimado de la cosecha</div>
              <div className="text-xl font-black text-success mt-0.5">
                S/. {(Number(form.volumenDisponible) * Number(form.precioPerKg)).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>{Number(form.volumenDisponible).toLocaleString("es-PE")} kg</div>
              <div>× S/. {Number(form.precioPerKg).toFixed(2)} / kg</div>
            </div>
          </div>
        )}

        {/* ── Acciones ── */}
        <div className="flex gap-3 pb-4">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/dashboard/agricultor" as any })}
            className="flex-1 border border-input rounded-xl py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || subiendoImagen}
            className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Sprout className="w-4 h-4" />
                Publicar cosecha
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Componente auxiliar de campo ────────────────────────────────────────────

function FormField({
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
          <span className="text-destructive ml-1" aria-hidden="true">*</span>
        )}
      </label>
      {children}
    </div>
  );
}

export default AgregarProducto;
