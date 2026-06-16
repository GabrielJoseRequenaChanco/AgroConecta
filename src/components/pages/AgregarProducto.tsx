import { useState, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useAppStore, uploadFileToStorage } from "@/context/useAppStore";
import type { Rubro, Distrito } from "@/context/types";
import { Camera, Upload, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS: Rubro[] = [
  "Tubérculos",
  "Cereales",
  "Hortalizas",
  "Frutas",
  "Legumbres",
  "Agroindustria",
  "Granos Andinos",
  "Otro"
];

const DISTRITOS: Distrito[] = [
  "Aco",
  "Concepción",
  "Orcotuna",
  "Mito",
  "Sincos",
  "Huancayo",
  "Lima",
  "Satipo",
  "Chanchamayo"
];

export default function AgregarProducto() {
  const addProducto = useAppStore((s) => s.addProducto);
  const usuario = useAppStore((s) => s.usuarioActivo);
  const router = useRouter();

  // Form states
  const [titulo, setTitulo] = useState("");
  const [rubro, setRubro] = useState<Rubro>("Tubérculos");
  const [variedad, setVariedad] = useState("");
  const [volumenDisponible, setVolumenDisponible] = useState("");
  const [precioPerKg, setPrecioPerKg] = useState("");
  const [precioEscala, setPrecioEscala] = useState<"kg" | "ton">("kg");
  const [distritoOrigen, setDistritoOrigen] = useState<Distrito>("Aco");
  const [descripcion, setDescripcion] = useState("");
  
  // Image states
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification checks
  const isApproved = usuario.verificacionEstado === "aprobado" || usuario.isMidagriVerified;

  if (usuario.rol === "anon") {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 text-center">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Acceso denegado</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Debes iniciar sesión con una cuenta de Agricultor para acceder a esta sección.
          </p>
          <Link to="/login" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  if (usuario.rol !== "agricultor") {
    return (
      <div className="max-w-xl mx-auto my-12 px-4 text-center">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Función exclusiva de Agricultor</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Solo los usuarios con el rol "Agricultor" pueden publicar cosechas. Tu cuenta actual es de tipo "{usuario.rol}".
          </p>
          <Link to="/" className="text-primary font-semibold hover:underline">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // Handle local image selection & preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTempImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApproved) {
      toast.error("Publicación bloqueada", {
        description: "Tu perfil está en proceso de verificación por nuestro Staff. No podrás realizar publicaciones hasta que sea aprobado."
      });
      return;
    }

    if (!titulo.trim()) {
      setError("El título de la publicación es obligatorio.");
      return;
    }
    if (!variedad.trim()) {
      setError("La variedad de la cosecha es obligatoria.");
      return;
    }
    if (!volumenDisponible || Number(volumenDisponible) <= 0) {
      setError("El volumen disponible debe ser mayor a 0.");
      return;
    }
    if (!precioPerKg || Number(precioPerKg) <= 0) {
      setError("El precio unitario debe ser mayor a 0.");
      return;
    }
    if (!tempImageFile && !imagePreview) {
      setError("Debes cargar una foto real de tu cosecha.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      let finalImageUrl = "";
      if (tempImageFile) {
        setUploadingImage(true);
        const uploadedUrl = await uploadFileToStorage("product_images", tempImageFile);
        setUploadingImage(false);
        if (!uploadedUrl) {
          setError("Error al subir la imagen del producto a Supabase Storage.");
          setSaving(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      // Calculate price per kg if scale is ton (1 ton = 1000 kg)
      let pricePerKgNum = Number(precioPerKg);
      if (precioEscala === "ton") {
        pricePerKgNum = pricePerKgNum / 1000;
      }

      const res = await addProducto({
        titulo: titulo.trim(),
        rubro,
        variedad: variedad.trim(),
        volumenDisponible: Number(volumenDisponible),
        precioPerKg: pricePerKgNum,
        distritoOrigen,
        imagenUrl: finalImageUrl,
        fechaCosecha: new Date().toISOString(),
        descripcion: descripcion.trim(),
      });

      if (res) {
        toast.success("¡Publicación exitosa!", {
          description: `Tu cosecha "${titulo}" ha sido listada correctamente en el Marketplace.`
        });
        router.navigate({ to: "/dashboard/agricultor" as any });
      } else {
        setError("Error de base de datos al guardar la publicación.");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error inesperado al publicar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Verification Warning Lock */}
      {!isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-6 flex items-start gap-3.5">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="text-sm text-yellow-800">
            <h3 className="font-bold">Publicación Deshabilitada temporalmente</h3>
            <p className="mt-1 leading-relaxed">
              Tu cuenta de productor se encuentra en estado <strong>{usuario.verificacionEstado || "PENDIENTE_VERIFICACION"}</strong>. Nuestro Staff está validando la información provista. Una vez aprobada, podrás publicar tus cosechas sin restricciones.
            </p>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vender Cosecha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Completa los detalles de tu producción agrícola para listarla en el Marketplace.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm p-3.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Carga de Imagen */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">Fotos reales de la cosecha *</label>
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                disabled={!isApproved}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isApproved || uploadingImage}
                className="w-40 h-40 border-2 border-dashed border-input rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-muted-foreground transition-all bg-muted/10 shrink-0"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">Subir Foto</span>
              </button>

              {imagePreview && (
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-border group shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-bold">Cambiar foto</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Recomendado formato horizontal nítido bajo la luz solar.</p>
          </div>

          {/* Título */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-foreground">Título de la publicación *</label>
            <input
              type="text"
              required
              disabled={!isApproved}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Papa Canchán de Primera - Jauja"
              className="w-full border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">Sé claro y específico con la variedad y el calibre de la cosecha.</p>
          </div>

          {/* Fila: Rubro y Variedad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Rubro oficial *</label>
              <select
                disabled={!isApproved}
                value={rubro}
                onChange={(e) => setRubro(e.target.value as Rubro)}
                className="w-full border border-input bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Variedad de Cosecha *</label>
              <input
                type="text"
                required
                disabled={!isApproved}
                value={variedad}
                onChange={(e) => setVariedad(e.target.value)}
                placeholder="Ej. Canchán, Yungay, Blanco"
                className="w-full border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Fila: Precio y Escala */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-semibold text-foreground">Precio Unitario *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-muted-foreground text-sm">S/</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={!isApproved}
                  value={precioPerKg}
                  onChange={(e) => setPrecioPerKg(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-input rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Escala *</label>
              <select
                disabled={!isApproved}
                value={precioEscala}
                onChange={(e) => setPrecioEscala(e.target.value as "kg" | "ton")}
                className="w-full border border-input bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                <option value="kg">Precio por Kilogramo (Kg)</option>
                <option value="ton">Precio por Tonelada (Ton)</option>
              </select>
            </div>
          </div>

          {/* Fila: Stock y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Volumen o Stock Disponible (Kg) *</label>
              <input
                type="number"
                min="1"
                required
                disabled={!isApproved}
                value={volumenDisponible}
                onChange={(e) => setVolumenDisponible(e.target.value)}
                placeholder="Ej. 5000"
                className="w-full border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">Ubicación de origen exacta *</label>
              <select
                disabled={!isApproved}
                value={distritoOrigen}
                onChange={(e) => setDistritoOrigen(e.target.value as Distrito)}
                className="w-full border border-input bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              >
                {DISTRITOS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-foreground">Descripción detallada</label>
            <textarea
              disabled={!isApproved}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Indica las características de tu cosecha (textura, calibre, empaque en sacos de cuántos kilos, etc.)"
              rows={4}
              className="w-full border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => router.navigate({ to: "/dashboard/agricultor" as any })}
              className="flex-1 border border-input py-3.5 rounded-xl text-sm font-semibold hover:bg-muted transition-colors text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !isApproved}
              className="flex-1 bg-success text-success-foreground py-3.5 rounded-xl font-bold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Publicando..." : "Publicar Cosecha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
