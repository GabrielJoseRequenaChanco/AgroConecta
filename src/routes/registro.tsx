import { Link, useRouter, createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Sprout, ShoppingBasket, Truck, Upload, Loader2, CheckCircle2, ChevronRight, Eye, EyeOff } from "lucide-react";
import type { UserRole } from "@/context/types";
import { useAppStore, uploadFileToStorage } from "@/context/useAppStore";

export const Route = createFileRoute("/registro")({
  component: Onboarding,
});

const ROL_CONFIG = {
  agricultor: {
    icon: <Sprout className="w-6 h-6 text-success" />,
    color: "success",
    label: "Agricultor / Productor",
    desc: "Vendo mi cosecha directo al comprador",
    bg: "bg-success/10 border-success/30 hover:border-success/60",
    active: "border-success bg-success/5",
  },
  comprador: {
    icon: <ShoppingBasket className="w-6 h-6 text-primary" />,
    color: "primary",
    label: "Comprador / Mayorista",
    desc: "Abasto mi negocio al por mayor",
    bg: "bg-primary/10 border-primary/30 hover:border-primary/60",
    active: "border-primary bg-primary/5",
  },
  transportista: {
    icon: <Truck className="w-6 h-6 text-amber-700" />,
    color: "earth",
    label: "Transportista de Carga",
    desc: "Realizo fletes en la región Junín",
    bg: "bg-amber-800/10 border-amber-800/30 hover:border-amber-800/60",
    active: "border-amber-800 bg-amber-800/5",
  },
} as const;

const PROVINCIAS_DISTRITOS: Record<string, string[]> = {
  "Huancayo": [
    "Huancayo", "El Tambo", "Chilca", "Pilcomayo", "San Jerónimo de Tunán", "San Agustín", "Sicaya", "Sapallanga"
  ],
  "Concepción": [
    "Concepción", "Aco", "Mito", "Orcotuna", "Santa Rosa de Ocopa", "Heroínas Toledo"
  ],
  "Jauja": [
    "Jauja", "Apata", "Sincos", "El Mantaro", "Acolla", "Yauyos"
  ],
  "Chanchamayo": [
    "Chanchamayo", "Perené", "Pichanaqui", "San Ramón"
  ],
  "Tarma": [
    "Tarma", "Acobamba", "Huasahuasi", "Palca"
  ],
  "Satipo": [
    "Satipo", "Mazamari", "Pangoa"
  ],
};

type DatosForm = Partial<{
  email: string;
  password: string;
  nombre: string;
  ubicacion: string;
  telefono: string;
  documento: string;
  documentoUrl: string;
  breveteUrl: string;
  verificacionEstado: "pendiente" | "aprobado" | "rechazado" | "PENDIENTE_VERIFICACION";
  local: string;
  ruc: string;
  vehiculoTipo: string;
  capacidad: string;
  placa: string;
  cultivos: string[];
  rutas: string[];
  hectareas: string;
  tipoComprador: "minorista" | "mayorista";
}>;

function Onboarding() {
  const [rol, setRol] = useState<UserRole | null>(null);
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState<DatosForm>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [skipEmailValidation, setSkipEmailValidation] = useState<boolean>(false);
  const [subiendoDni, setSubiendoDni] = useState(false);
  const [dniCargado, setDniCargado] = useState(false);
  const [subiendoBrevete, setSubiendoBrevete] = useState(false);
  const [breveteCargado, setBreveteCargado] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
  const [distritoSeleccionado, setDistritoSeleccionado] = useState("");

  const { authSignUp, user } = useAppStore();
  const router = useRouter();

  const dniInputRef = useRef<HTMLInputElement>(null);
  const breveteInputRef = useRef<HTMLInputElement>(null);

  const uploadDni = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSubiendoDni(true);
    try {
      const url = await uploadFileToStorage("dni_documents", file);
      if (url) {
        setDatos((prev) => ({ ...prev, documentoUrl: url }));
        setDniCargado(true);
      } else {
        setError("Error al subir el DNI a Supabase Storage.");
      }
    } catch (err) {
      console.error(err);
      setError("Error en la subida del archivo.");
    } finally {
      setSubiendoDni(false);
    }
  };

  const uploadBrevete = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSubiendoBrevete(true);
    try {
      const url = await uploadFileToStorage("dni_documents", file);
      if (url) {
        setDatos((prev) => ({ ...prev, breveteUrl: url }));
        setBreveteCargado(true);
      } else {
        setError("Error al subir la licencia de conducir a Supabase.");
      }
    } catch (err) {
      console.error(err);
      setError("Error en la subida de la licencia.");
    } finally {
      setSubiendoBrevete(false);
    }
  };

  const validarPaso1 = (): string | null => {
    if (!datos.email?.trim()) return "Ingresa tu correo electrónico.";
    if (!skipEmailValidation && !datos.email.includes("@")) return "El correo electrónico debe contener un '@'.";
    if (!datos.password || datos.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
if (!/^\d+$/.test(datos.password)) return "La contraseña debe ser numérica sin caracteres especiales.";
if (datos.password !== confirmPassword) return "Las contraseñas no coinciden.";
    if (!datos.nombre?.trim()) return "Ingresa tu nombre completo.";
    if (!datos.telefono?.trim()) return "Ingresa tu número de teléfono o WhatsApp.";
    if (!datos.ubicacion?.trim()) return "Selecciona tu ubicación (provincia y distrito).";
    return null;
  };

  const validarPaso2 = (): string | null => {
    if (!datos.documento?.trim()) return "Debes ingresar tu documento de identidad (DNI).";
    if (datos.documento.length !== 8) return "El DNI debe tener exactamente 8 dígitos.";
    if (!datos.documentoUrl) return "Debes subir la foto nítida de tu DNI.";
    if (rol === "transportista" && !datos.breveteUrl) {
      return "Los transportistas deben subir la foto de su Licencia de Conducir (Brevete).";
    }
    return null;
  };

  const validarPaso3 = (): string | null => {
    if (rol === "transportista") {
      if (!datos.vehiculoTipo) return "Selecciona el tipo de vehículo.";
      if (!datos.capacidad || Number(datos.capacidad) <= 0) return "Ingresa la capacidad de carga.";
      if (!datos.placa?.trim()) return "Ingresa la placa de tu vehículo.";
    }
    if (rol === "comprador" && datos.tipoComprador === "mayorista") {
      if (!datos.local?.trim()) return "Ingresa el nombre del local o Razón Social.";
    }
    return null;
  };

  const irASiguientePaso = () => {
    setError(null);
    let err: string | null = null;
    if (paso === 1) err = validarPaso1();
    else if (paso === 2) err = validarPaso2();
    if (err) { setError(err); return; }
    setPaso(paso + 1);
  };

  const finalizar = async () => {
    setError(null);
    const err3 = validarPaso3();
    if (err3) { setError(err3); return; }
    if (!rol) return;

    setLoading(true);
    
    // Normalización de datos
    const payload: DatosForm = {
      ...datos,
      verificacionEstado: "PENDIENTE_VERIFICACION"
    };

    if (rol === "comprador" && datos.tipoComprador === "minorista") {
      payload.local = undefined;
      payload.ruc = undefined;
    } else if (rol === "comprador" && datos.tipoComprador === "mayorista") {
      payload.ruc = datos.documento;
      payload.local = datos.local;
    }

    try {
      const { profile, error: apiError } = await authSignUp(
        datos.email!,
        datos.password!,
        rol,
        payload as any
      );
      if (apiError) {
        setError(apiError);
      } else if (profile) {
        router.navigate({ to: "/" as any });
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión durante el registro.");
    } finally {
      setLoading(false);
    }
  };

  if (!rol) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Crea tu cuenta en AgroConecta
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Elige tu rol para comenzar en la plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(Object.entries(ROL_CONFIG) as any[]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                setRol(key);
                if (key === "comprador") {
                  setDatos((prev) => ({ ...prev, tipoComprador: "minorista" }));
                }
              }}
              className={`flex items-center gap-4 border border-border rounded-xl p-5 text-left transition-all hover:shadow-md ${cfg.bg}`}
            >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                {cfg.icon}
              </div>
              <div className="flex-1">
                <div className="font-bold text-foreground">{cfg.label}</div>
                <div className="text-sm text-muted-foreground">{cfg.desc}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const cfg = (ROL_CONFIG as any)[rol];
  const progress = (paso / 3) * 100;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            Registro como{" "}
            <button
              onClick={() => { setRol(null); setPaso(1); }}
              className="text-primary font-semibold hover:underline"
            >
              {cfg.label}
            </button>
          </span>
          <span className="text-muted-foreground">Paso {paso} de 3</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-success transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Datos de acceso</h2>
            <Field label="Correo electrónico">
              <div className="relative">
                <input
                  className="w-full border border-input rounded-lg px-3 py-2.5 pr-10 text-sm"
                  placeholder="tucorreo@ejemplo.com"
                  type="email"
                  value={datos.email || ""}
                  onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                />
                {user?.rol === "admin" && (
                  <button
                    type="button"
                    onClick={() => setSkipEmailValidation(true)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary underline"
                  >
                    Omitir validación
                  </button>
                )}
              </div>
            </Field>
            <Field label="Nombre completo">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
                placeholder="Nombres y apellidos"
                value={datos.nombre || ""}
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
                placeholder="Ej: 964123456"
                type="tel"
                value={datos.telefono || ""}
                onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Provincia (Junín)">
                <select
                  className="w-full border border-input rounded-lg px-3 py-2.5 bg-white text-sm"
                  value={provinciaSeleccionada}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setProvinciaSeleccionada(prov);
                    setDistritoSeleccionado("");
                    setDatos((prev) => ({ ...prev, ubicacion: "" }));
                  }}
                >
                  <option value="">Selecciona...</option>
                  {Object.keys(PROVINCIAS_DISTRITOS).map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Distrito">
                <select
                  disabled={!provinciaSeleccionada}
                  className="w-full border border-input rounded-lg px-3 py-2.5 bg-white text-sm disabled:opacity-50"
                  value={distritoSeleccionado}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setDistritoSeleccionado(dist);
                    if (dist) {
                      setDatos((prev) => ({ ...prev, ubicacion: `${dist}, ${provinciaSeleccionada} — Junín` }));
                    } else {
                      setDatos((prev) => ({ ...prev, ubicacion: "" }));
                    }
                  }}
                >
                  <option value="">Selecciona...</option>
                  {provinciaSeleccionada &&
                    PROVINCIAS_DISTRITOS[provinciaSeleccionada].map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            <Field label="Contraseña">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-input rounded-lg px-3 py-2.5 pr-10 text-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={datos.password || ""}
                  onChange={(e) => setDatos({ ...datos, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Confirmar Contraseña">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full border border-input rounded-lg px-3 py-2.5 pr-10 text-sm"
                  placeholder="Repite la contraseña"
                  value={confirmPassword || ""}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Nav onNext={irASiguientePaso} />
          </>
        )}

        {/* PASO 2: Validación KYC de Identidad */}
        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Proceso KYC (Know Your Customer)</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Sube tus documentos obligatorios para seguridad en transacciones de AgroConecta.
            </p>

            <Field label="Número de DNI (8 dígitos)">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
                placeholder="4XXXXXXX"
                maxLength={8}
                type="text"
                inputMode="numeric"
                value={datos.documento || ""}
                onChange={(e) => setDatos({ ...datos, documento: e.target.value.replace(/\D/g, "") })}
              />
            </Field>

            {/* Subida del DNI */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Foto nítida del DNI (Anverso/Reverso)</label>
              <input
                type="file"
                ref={dniInputRef}
                onChange={uploadDni}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => dniInputRef.current?.click()}
                disabled={subiendoDni}
                className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-colors ${
                  dniCargado ? "border-success/40 bg-success/5" : "border-input hover:border-muted-foreground hover:bg-muted/30"
                }`}
              >
                {subiendoDni ? (
                  <>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Subiendo DNI...</span>
                  </>
                ) : dniCargado ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <span className="text-xs font-bold text-success">¡DNI subido correctamente!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Haga clic para cargar foto de DNI</span>
                  </>
                )}
              </button>
            </div>

            {/* Subida del Brevete (Solo Transportistas) */}
            {rol === "transportista" && (
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-semibold text-foreground">Foto nítida de tu Licencia de Conducir (Brevete)</label>
                <input
                  type="file"
                  ref={breveteInputRef}
                  onChange={uploadBrevete}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => breveteInputRef.current?.click()}
                  disabled={subiendoBrevete}
                  className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-colors ${
                    breveteCargado ? "border-success/40 bg-success/5" : "border-input hover:border-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  {subiendoBrevete ? (
                    <>
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      <span className="text-xs font-semibold text-foreground">Subiendo Brevete...</span>
                    </>
                  ) : breveteCargado ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-success" />
                      <span className="text-xs font-bold text-success">¡Licencia de conducir subida!</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Haga clic para cargar foto de Brevete</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <Nav onBack={() => setPaso(1)} onNext={irASiguientePaso} />
          </>
        )}

        {/* PASO 3: Datos de rol */}
        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg text-foreground">
              {rol === "agricultor" ? "Datos de tu Unidad de Producción" : rol === "comprador" ? "Datos de tu negocio" : "Datos de tu vehículo"}
            </h2>
            {rol === "agricultor" && <CampoAgricultor datos={datos} setDatos={setDatos} />}
            {rol === "comprador" && <CampoComprador datos={datos} setDatos={setDatos} />}
            {rol === "transportista" && <CampoTransportista datos={datos} setDatos={setDatos} />}
            <Nav
              onBack={() => setPaso(2)}
              onNext={finalizar}
              nextLabel={loading ? "Registrando..." : "Crear cuenta e ingresar →"}
            />
          </>
        )}
      </div>
    </div>
  );
}

function CampoAgricultor({ datos, setDatos }: { datos: DatosForm; setDatos: (d: DatosForm) => void }) {
  const ha = Number(datos.hectareas) || 0;
  const comision = ha > 0 ? (ha >= 5 ? "5%" : "3%") : null;
  const cultivos = ["Papa", "Maíz", "Alcachofa", "Zanahoria", "Habas", "Olluco"];

  return (
    <>
      <Field label="¿Cuántas hectáreas cultivas?">
        <input
          type="number"
          step="0.1"
          min="0.1"
          value={datos.hectareas || ""}
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
          placeholder="Ej: 1.5"
          onChange={(e) => setDatos({ ...datos, hectareas: e.target.value })}
        />
      </Field>
      {comision && (
        <div className="bg-muted/50 border border-border rounded-xl p-3.5 text-sm text-foreground">
          <p className="font-semibold text-foreground">Comisión de plataforma aplicada</p>
          <p className="text-muted-foreground text-xs mt-1">
            Para productores con {ha >= 5 ? "5 hectáreas o más" : "menos de 5 hectáreas"}: Comisión <strong className="text-foreground">{comision}</strong> sobre el valor de la venta.
          </p>
        </div>
      )}
      <Field label="Cultivos principales">
        <div className="grid grid-cols-2 gap-2">
          {cultivos.map((c) => {
            const currentCultivos = datos.cultivos || [];
            const checked = currentCultivos.includes(c);
            return (
              <label key={c} className="flex items-center gap-2 text-sm py-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...currentCultivos, c]
                      : currentCultivos.filter((x) => x !== c);
                    setDatos({ ...datos, cultivos: next });
                  }}
                />
                {c}
              </label>
            );
          })}
        </div>
      </Field>
    </>
  );
}

function CampoComprador({ datos, setDatos }: { datos: DatosForm; setDatos: (d: DatosForm) => void }) {
  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-foreground mb-1.5">Tipo de Comprador</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDatos({ ...datos, tipoComprador: "minorista" })}
            className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all text-xs font-semibold ${
              datos.tipoComprador === "minorista" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Minorista (Boleta)
          </button>
          <button
            type="button"
            onClick={() => setDatos({ ...datos, tipoComprador: "mayorista" })}
            className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all text-xs font-semibold ${
              datos.tipoComprador === "mayorista" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/30"
            }`}
          >
            Mayorista (Factura/RUC)
          </button>
        </div>
      </div>
      {datos.tipoComprador === "mayorista" && (
        <>
          <Field label="Nombre Comercial / Razón Social">
            <input
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
              placeholder="Minimarket Las Palmas, Restaurante El Huerto..."
              value={datos.local || ""}
              onChange={(e) => setDatos({ ...datos, local: e.target.value })}
            />
          </Field>
          <Field label="RUC de tu Negocio (11 dígitos)">
            <input
              maxLength={11}
              className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
              placeholder="20XXXXXXXXX"
              value={datos.ruc || ""}
              onChange={(e) => setDatos({ ...datos, ruc: e.target.value.replace(/\D/g, "") })}
            />
          </Field>
        </>
      )}
    </>
  );
}

function CampoTransportista({ datos, setDatos }: { datos: DatosForm; setDatos: (d: DatosForm) => void }) {
  return (
    <>
      <Field label="Tipo de vehículo">
        <select
          className="w-full border border-input rounded-lg px-3 py-2.5 bg-white text-sm"
          value={datos.vehiculoTipo || ""}
          onChange={(e) => setDatos({ ...datos, vehiculoTipo: e.target.value })}
        >
          <option value="">Selecciona el tipo...</option>
          <option value="Camión Baranda">Camión Baranda</option>
          <option value="Furgón Refrigerado">Furgón Refrigerado</option>
          <option value="Pick-up">Pick-up</option>
          <option value="Camión Plataforma">Camión Plataforma</option>
        </select>
      </Field>
      <Field label="Capacidad máxima de carga (toneladas)">
        <input
          type="number"
          step="0.5"
          min="0.5"
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm"
          placeholder="Ej: 4"
          value={datos.capacidad || ""}
          onChange={(e) => setDatos({ ...datos, capacidad: e.target.value })}
        />
      </Field>
      <Field label="Placa del vehículo">
        <input
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm uppercase"
          placeholder="Ej: JUN-845"
          value={datos.placa || ""}
          onChange={(e) => setDatos({ ...datos, placa: e.target.value.toUpperCase() })}
        />
      </Field>
      <Field label="Rutas que cubres en Junín">
        <div className="grid grid-cols-2 gap-2">
          {["Aco–Huancayo", "Mito–Jauja", "Sincos–Huancayo", "Concepción–Lima"].map((r) => {
            const currentRutas = datos.rutas || [];
            const checked = currentRutas.includes(r);
            return (
              <label key={r} className="flex items-center gap-2 text-sm py-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-primary w-4 h-4"
                  checked={checked}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...currentRutas, r]
                      : currentRutas.filter((x) => x !== r);
                    setDatos({ ...datos, rutas: next });
                  }}
                />
                {r}
              </label>
            );
          })}
        </div>
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Nav({
  onBack,
  onNext,
  nextLabel = "Continuar",
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-input py-3 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
        >
          Atrás
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity text-sm"
      >
        {nextLabel}
      </button>
    </div>
  );
}