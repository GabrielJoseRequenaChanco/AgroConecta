import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout, ShoppingBasket, Wrench, Upload, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import type { UserRole } from "@/context/types";
import { useAppStore } from "@/context/useAppStore";

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

function Onboarding() {
  const [rol, setRol] = useState<UserRole | null>(null);
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState<any>({});
  const [escaneando, setEscaneando] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const authSignUp = useAppStore((s) => s.authSignUp);
  const router = useRouter();

  const simularEscaneo = () => {
    setEscaneando(true);
    setTimeout(() => {
      setEscaneando(false);
      setEscaneado(true);
    }, 2200);
  };

  const finalizar = async () => {
    if (!rol) return;
    setError(null);
    setStatusMessage(null);

    if (!datos.email || !datos.password || !datos.nombre || !datos.ubicacion) {
      setError("Completa tu correo, contraseña, nombre y ubicación para continuar.");
      return;
    }

    if (datos.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (!datos.documento) {
      setError("Debes cargar o ingresar tu documento para continuar.");
      return;
    }

    const created = await authSignUp(datos.email, datos.password, rol, datos);
    if (!created) {
      setError("No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.");
      return;
    }

    setSuccess(true);
    setStatusMessage(
      "Tu cuenta fue creada. Revisa tu correo electrónico para confirmar tu cuenta y luego vuelve a iniciar sesión."
    );
  };

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
            )
          )}
        </div>
      </div>
    );
  }

  const cfg = (ROL_CONFIG as any)[rol];
  const progress = (paso / 3) * 100;

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
        {/* Step labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-0.5">
          <span className={paso >= 1 ? "text-foreground font-medium" : ""}>Datos</span>
          <span className={paso >= 2 ? "text-foreground font-medium" : ""}>Identidad</span>
          <span className={paso >= 3 ? "text-foreground font-medium" : ""}>Campo</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-4">
        {error && !success && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success ? (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Cuenta creada</h2>
            <p className="text-sm text-muted-foreground">
              {statusMessage}
            </p>
            <button
              onClick={() => router.navigate({ to: "/login" as any })}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:opacity-90"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : paso === 1 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Datos de acceso</h2>
            <Field label="Correo electrónico">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="tucorreo@ejemplo.com"
                type="email"
                onChange={(e) => setDatos({ ...datos, email: e.target.value })}
              />
            </Field>
            <Field label="Nombre completo">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Nombres y apellidos"
                onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              />
            </Field>
            <Field label="Ubicación">
              <input
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Huancayo, Junín"
                onChange={(e) => setDatos({ ...datos, ubicacion: e.target.value })}
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
                placeholder="Mínimo 6 caracteres"
                onChange={(e) => setDatos({ ...datos, password: e.target.value })}
              />
            </Field>
            <Nav onNext={() => setPaso(2)} />
          </>
        )}

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
                onChange={(e) => setDatos({ ...datos, documento: e.target.value })}
              />
            </Field>

            <button
              onClick={simularEscaneo}
              disabled={escaneando || escaneado}
              className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2.5 transition-colors tap-target ${
                escaneado
                  ? "border-success/40 bg-success/5"
                  : "border-input hover:border-muted-foreground hover:bg-muted/30"
              }`}
            >
              {escaneando ? (
                <>
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <span className="text-sm font-medium text-foreground">Verificando documento...</span>
                  <span className="text-xs text-muted-foreground">Esto tarda unos segundos</span>
                </>
              ) : escaneado ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <span className="text-sm font-bold text-success">Documento validado correctamente</span>
                  <span className="text-xs text-muted-foreground">Sello de Confianza activado</span>
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

            <Nav onBack={() => setPaso(1)} onNext={() => setPaso(3)} />
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg text-foreground">
              {rol === "agricultor" ? "Datos de tu chacra" : rol === "comprador" ? "Datos de tu negocio" : "Datos de tu vehículo"}
            </h2>
            {rol === "agricultor" && <CampoAgricultor datos={datos} setDatos={setDatos} />}
            {rol === "comprador" && <CampoComprador datos={datos} setDatos={setDatos} />}
            {rol === "transportista" && <CampoTransportista datos={datos} setDatos={setDatos} />}
            <Nav
              onBack={() => setPaso(2)}
              onNext={finalizar}
              nextLabel="Crear cuenta e ingresar →"
            />
          </>
        )}
      </div>
    </div>
  );
}

function CampoAgricultor({ datos, setDatos }: any) {
  const ha = Number(datos.hectareas) || 0;
  const elegible = ha > 0 && ha < 2;
  const cultivos = ["Papa", "Maíz", "Alcachofa", "Zanahoria", "Habas", "Olluco"];
  return (
    <>
      <Field label="¿Cuántas hectáreas cultivas?">
        <input
          type="number"
          step="0.1"
          min="0.1"
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Ej: 1.5"
          onChange={(e) => setDatos({ ...datos, hectareas: e.target.value })}
        />
      </Field>
      {elegible && (
        <div className="bg-success/5 border border-success/20 rounded-xl p-3.5 text-sm text-foreground">
          <p className="font-bold text-success">🌱 ¡Bienvenido al programa familiar!</p>
          <p className="text-muted-foreground text-xs mt-1">
            Elegible para Agricultura Familiar de Aco. Comisión de plataforma:{" "}
            <strong className="text-foreground">0%</strong>
          </p>
        </div>
      )}
      <Field label="Cultivos principales">
        <div className="grid grid-cols-2 gap-2">
          {cultivos.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" className="accent-primary w-4 h-4" /> {c}
            </label>
          ))}
        </div>
      </Field>
    </>
  );
}

function CampoComprador({ datos, setDatos }: any) {
  return (
    <>
      <Field label="Nombre del local comercial">
        <input
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Minimarket Las Palmas, Restaurante El Huerto..."
          onChange={(e) => setDatos({ ...datos, local: e.target.value })}
        />
      </Field>
      <Field label="RUC del negocio (11 dígitos)">
        <input
          maxLength={11}
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="20XXXXXXXXX"
          onChange={(e) => setDatos({ ...datos, ruc: e.target.value })}
        />
      </Field>
      <Field label="Dirección comercial">
        <input
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Jr. Ancash 123, Huancayo"
          onChange={(e) => setDatos({ ...datos, direccion: e.target.value })}
        />
      </Field>
    </>
  );
}

function CampoTransportista({ datos, setDatos }: any) {
  return (
    <>
      <Field label="Tipo de vehículo">
        <select
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target bg-white text-sm"
          onChange={(e) => setDatos({ ...datos, vehiculo: e.target.value })}
        >
          <option value="">Selecciona el tipo...</option>
          <option>Camión Baranda</option>
          <option>Furgón refrigerado</option>
          <option>Pick-up</option>
        </select>
      </Field>
      <Field label="Capacidad máxima de carga (toneladas)">
        <input
          type="number"
          step="0.5"
          min="0.5"
          className="w-full border border-input rounded-lg px-3 py-2.5 tap-target text-sm"
          placeholder="Ej: 4"
          onChange={(e) => setDatos({ ...datos, capacidad: e.target.value })}
        />
      </Field>
      <Field label="Rutas que cubres en Junín">
        <div className="grid grid-cols-2 gap-2">
          {["Aco–Huancayo", "Mito–Jauja", "Sincos–Huancayo", "Concepción–Lima"].map(
            (r) => (
              <label key={r} className="flex items-center gap-2 text-sm py-1 cursor-pointer">
                <input type="checkbox" className="accent-primary w-4 h-4" /> {r}
              </label>
            )
          )}
        </div>
      </Field>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-foreground mb-1.5">
        {label}
      </label>
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