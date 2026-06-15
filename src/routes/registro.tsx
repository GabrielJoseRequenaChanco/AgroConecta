import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Sprout, ShoppingBasket, Wrench, Upload, Loader2, CheckCircle2, ChevronRight, Mail } from "lucide-react";
import type { UserRole } from "@/context/types";
import type { RegistroPayload } from "@/context/types";
import { useAppStore } from "@/context/useAppStore";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/registro")({
  component: Onboarding,
});

const ROL_CONFIG = {
  agricultor: {
    icon: <Sprout className="w-6 h-6 text-success" />,
    color: "success",
    label: "Agricultor",
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
    icon: <Wrench className="w-6 h-6 text-earth" />,
    color: "earth",
    label: "Transportista",
    desc: "Realizo fletes en la región Junín",
    bg: "bg-earth/10 border-earth/30 hover:border-earth/60",
    active: "border-earth bg-earth/5",
  },
} as const;

type DatosForm = Partial<{
  email: string;
  password: string;
  nombre: string;
  ubicacion: string;
  telefono: string;
  documento: string;
  documentoUrl: string;
  verificacionEstado: "pendiente" | "aprobado" | "rechazado";
  local: string;
  ruc: string;
  vehiculoTipo: string;
  capacidad: string;
  placa: string;
  cultivos: string[];
  rutas: string[];
  hectareas: string;
}>;

function Onboarding() {
  const [rol, setRol] = useState<UserRole | null>(null);
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState<DatosForm>({});
  const [escaneando, setEscaneando] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // OTP verification state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const authSignUp = useAppStore((s) => s.authSignUp);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name);
    setEscaneando(true);
    setTimeout(() => {
      setEscaneando(false);
      setEscaneado(true);
      setDatos({
        ...datos,
        documentoUrl: file.name,
        verificacionEstado: "pendiente",
      });
    }, 2000);
  };

  /** Valida el paso 1 (datos de acceso) antes de avanzar */
  const validarPaso1 = (): string | null => {
    if (!datos.email?.trim()) return "Ingresa tu correo electrónico.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) return "El correo electrónico no tiene un formato válido.";
    if (!datos.password || datos.password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (!datos.nombre?.trim()) return "Ingresa tu nombre completo.";
    if (!datos.telefono?.trim()) return "Ingresa tu número de teléfono o WhatsApp.";
    if (!datos.ubicacion?.trim()) return "Ingresa tu ubicación (distrito o ciudad).";
    return null;
  };

  /** Valida el paso 2 (identidad) antes de avanzar */
  const validarPaso2 = (): string | null => {
    if (!datos.documento?.trim()) return "Debes ingresar tu documento de identidad (DNI o RUC).";
    if (rol === "comprador" && datos.documento.length !== 11) return "El RUC debe tener exactamente 11 dígitos.";
    if (rol !== "comprador" && datos.documento.length !== 8) return "El DNI debe tener exactamente 8 dígitos.";
    return null;
  };

  /** Valida el paso 3 (datos del rol) antes de finalizar */
  const validarPaso3 = (): string | null => {
    if (rol === "transportista") {
      if (!datos.vehiculoTipo) return "Selecciona el tipo de vehículo.";
      if (!datos.capacidad || Number(datos.capacidad) <= 0) return "Ingresa la capacidad de carga del vehículo.";
    }
    if (rol === "comprador") {
      if (!datos.local?.trim()) return "Ingresa el nombre de tu local comercial.";
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

    const payload: DatosForm & RegistroPayload = { ...datos };
    const { profile, error: apiError } = await authSignUp(
      datos.email!,
      datos.password!,
      rol,
      payload as any
    );
    if (apiError) { setError(apiError); return; }
    if (!profile) { setError("No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo."); return; }

    // After account creation, show OTP flow to confirm email
    setShowOtp(true);
    setOtpSent(true);
  };

  const verificarOtp = async () => {
    setOtpError(null);
    setOtpLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: datos.email!,
        token: otpCode.trim(),
        type: "signup",
      });
      if (error) {
        setOtpError("Código incorrecto o expirado. Revisa tu bandeja de entrada.");
      } else {
        setSuccess(true);
        setStatusMessage(
          "Tu correo fue confirmado correctamente. Tu cuenta está activa. Ya puedes iniciar sesión en AgroConecta."
        );
        setShowOtp(false);
      }
    } catch {
      setOtpError("Ocurrió un error al verificar el código. Intenta de nuevo.");
    } finally {
      setOtpLoading(false);
    }
  };

  const reenviarOtp = async () => {
    setOtpError(null);
    try {
      await supabase.auth.resend({ type: "signup", email: datos.email! });
      setOtpError("Se reenvió un nuevo código a tu correo.");
    } catch {
      setOtpError("No se pudo reenviar el código. Intenta más tarde.");
    }
  };

  // —— Pantalla: Selección de Rol ——
  if (!rol) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Crea tu cuenta en AgroConecta
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Elige el rol con el que vas a operar — puedes cambiarlo después
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(Object.entries(ROL_CONFIG) as any[]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setRol(key)}
              className={`flex items-center gap-4 border-2 rounded-xl p-5 text-left transition-all hover:shadow-md tap-target ${cfg.bg}`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
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

  // —— Pantalla: Ingreso de Código OTP ——
  if (showOtp) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Confirma tu correo</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enviamos un código de 6 dígitos a{" "}
              <strong className="text-foreground">{datos.email}</strong>.
              Ingrésalo aquí para activar tu cuenta.
            </p>
          </div>
          {otpSent && (
            <div className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
              ✓ Código enviado. Revisa tu bandeja de entrada (y carpeta de spam).
            </div>
          )}
          <input
            className="w-full border border-input rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest tap-target"
            placeholder="000000"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
          />
          {otpError && (
            <p className={`text-xs font-medium ${otpError.includes("reenvió") ? "text-success" : "text-destructive"}`}>
              {otpError}
            </p>
          )}
          <button
            onClick={verificarOtp}
            disabled={otpLoading || otpCode.length < 6}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {otpLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verificar y Activar Cuenta"}
          </button>
          <button onClick={reenviarOtp} className="text-xs text-muted-foreground hover:text-primary underline">
            ¿No llegó? Reenviar código
          </button>
        </div>
      </div>
    );
  }

  // —— Pantalla: Éxito ——
  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Cuenta activa</h2>
          <p className="text-sm text-muted-foreground">{statusMessage}</p>
          <button
            onClick={() => router.navigate({ to: "/login" as any })}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // —— Pantalla: Formulario multi-paso ——
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Progress header */}
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
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
          <span className={paso >= 1 ? "text-foreground font-medium" : ""}>Datos</span>
          <span className={paso >= 2 ? "text-foreground font-medium" : ""}>Identidad</span>
          <span className={paso >= 3 ? "text-foreground font-medium" : ""}>
            {rol === "agricultor" ? "Unidad de Producción" : rol === "comprador" ? "Negocio" : "Vehículo"}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── PASO 1: Datos de acceso ── */}
        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Datos de acceso</h2>
            <Field label="Correo electrónico">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="tucorreo@ejemplo.com"
                type="email"
                value={datos.email || ""}
                onChange={(e) => setDatos({ ...datos, email: e.target.value })}
              />
            </Field>
            <Field label="Nombre completo">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Nombres y apellidos"
                value={datos.nombre || ""}
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              />
            </Field>
            <Field label="Teléfono / WhatsApp">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Ej: 964123456"
                type="tel"
                value={datos.telefono || ""}
                onChange={(e) => setDatos({ ...datos, telefono: e.target.value })}
              />
            </Field>
            <Field label="Ubicación (distrito o ciudad)">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Ej: Huancayo, Junín"
                value={datos.ubicacion || ""}
                onChange={(e) => setDatos({ ...datos, ubicacion: e.target.value })}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Mínimo 6 caracteres"
                value={datos.password || ""}
                onChange={(e) => setDatos({ ...datos, password: e.target.value })}
              />
            </Field>
            <Nav onNext={irASiguientePaso} />
          </>
        )}

        {/* ── PASO 2: Validación de identidad ── */}
        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Validación de identidad</h2>
            <p className="text-sm text-muted-foreground -mt-2">
              Necesitamos verificar tu identidad para activar el{" "}
              <strong className="text-foreground">Sello de Confianza</strong> en tu perfil.
            </p>
            <Field label={rol === "comprador" ? "RUC (11 dígitos)" : "DNI (8 dígitos)"}>
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder={rol === "comprador" ? "20XXXXXXXXX" : "4XXXXXXX"}
                maxLength={rol === "comprador" ? 11 : 8}
                type="text"
                inputMode="numeric"
                value={datos.documento || ""}
                onChange={(e) => setDatos({ ...datos, documento: e.target.value.replace(/\D/g, "") })}
              />
            </Field>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={escaneando || escaneado}
              className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2.5 transition-colors tap-target ${escaneado
                  ? "border-success/40 bg-success/5"
                  : "border-input hover:border-muted-foreground hover:bg-muted/30"
                }`}
            >
              {escaneando ? (
                <>
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <span className="text-sm font-medium text-foreground">Subiendo documento...</span>
                  <span className="text-xs text-muted-foreground">Esto tarda unos segundos</span>
                </>
              ) : escaneado ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <span className="text-sm font-bold text-success">Documento cargado correctamente</span>
                  <span className="text-xs text-foreground font-semibold bg-success/10 px-2.5 py-1 rounded border border-success/25 max-w-[280px] truncate">{nombreArchivo}</span>
                  <span className="text-[10px] text-muted-foreground">Sello de Confianza en estado pendiente de aprobación</span>
                </>
              ) : (
                <>
                  <Upload className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Subir foto de {rol === "comprador" ? "RUC / Ficha RUC" : "DNI o Constancia de Productor"}
                  </span>
                  <span className="text-xs text-muted-foreground">JPG, PNG o PDF · máx. 5 MB</span>
                </>
              )}
            </button>

            <Nav onBack={() => { setError(null); setPaso(1); }} onNext={irASiguientePaso} />
          </>
        )}

        {/* ── PASO 3: Datos del rol ── */}
        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg text-foreground">
              {rol === "agricultor"
                ? "Datos de tu Unidad de Producción"
                : rol === "comprador"
                  ? "Datos de tu negocio"
                  : "Datos de tu vehículo"}
            </h2>
            {rol === "agricultor" && <CampoAgricultor datos={datos} setDatos={setDatos} />}
            {rol === "comprador" && <CampoComprador datos={datos} setDatos={setDatos} />}
            {rol === "transportista" && <CampoTransportista datos={datos} setDatos={setDatos} />}
            <Nav
              onBack={() => { setError(null); setPaso(2); }}
              onNext={finalizar}
              nextLabel="Crear cuenta e ingresar →"
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
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Ej: 1.5"
          onChange={(e) => setDatos({ ...datos, hectareas: e.target.value })}
        />
      </Field>
      {comision && (
        <div className="bg-muted/50 border border-border rounded-xl p-3.5 text-sm text-foreground">
          <p className="font-semibold text-foreground">Comisión de plataforma aplicada</p>
          <p className="text-muted-foreground text-xs mt-1">
            Para productores con{" "}
            {ha >= 5 ? "5 hectáreas o más" : "menos de 5 hectáreas"}: Comisión{" "}
            <strong className="text-foreground">{comision}</strong> sobre el valor de la venta.
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
                />{" "}
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
      <Field label="Nombre del local comercial">
        <input
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Minimarket Las Palmas, Restaurante El Huerto..."
          value={datos.local || ""}
          onChange={(e) => setDatos({ ...datos, local: e.target.value })}
        />
      </Field>
      <Field label="RUC del negocio (11 dígitos)">
        <input
          maxLength={11}
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="20XXXXXXXXX"
          value={datos.ruc || ""}
          onChange={(e) => setDatos({ ...datos, ruc: e.target.value })}
        />
      </Field>
    </>
  );
}

function CampoTransportista({ datos, setDatos }: { datos: DatosForm; setDatos: (d: DatosForm) => void }) {
  return (
    <>
      <Field label="Tipo de vehículo">
        <select
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target bg-white text-sm"
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
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Ej: 4"
          value={datos.capacidad || ""}
          onChange={(e) => setDatos({ ...datos, capacidad: e.target.value })}
        />
      </Field>
      <Field label="Placa del vehículo">
        <input
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm uppercase"
          placeholder="Ej: ABC-123"
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
                />{" "}
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
          onClick={onBack}
          className="flex-1 border border-input py-3 rounded-xl tap-target text-sm font-medium hover:bg-muted transition-colors"
        >
          Atrás
        </button>
      )}
      <button
        onClick={onNext}
        className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl tap-target hover:opacity-90 transition-opacity text-sm"
      >
        {nextLabel}
      </button>
    </div>
  );
}