import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Sprout, ShoppingBasket, Wrench, Upload, Loader2 } from "lucide-react";
import type { UserRole } from "@/context/types";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/registro")({
  component: Onboarding,
});

function Onboarding() {
  const [rol, setRol] = useState<UserRole | null>(null);
  const [paso, setPaso] = useState(1);
  const [datos, setDatos] = useState<any>({});
  const [escaneando, setEscaneando] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const setRolActivo = useAppStore((s) => s.setRolActivo);
  const router = useRouter();

  const simularEscaneo = () => {
    setEscaneando(true);
    setTimeout(() => {
      setEscaneando(false);
      setEscaneado(true);
    }, 2000);
  };

  const finalizar = () => {
    if (!rol) return;
    setRolActivo(rol);
    router.navigate({ to: `/dashboard/${rol}` as any });
  };

  if (!rol) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-center">Crea tu cuenta en AgroConecta</h1>
        <p className="text-center text-muted-foreground text-sm mt-1">
          Elige el rol con el que vas a operar
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <RolPick
            icon={<Sprout className="w-8 h-8 text-success" />}
            titulo="Agricultor"
            text="Vendo mi cosecha directo"
            onClick={() => setRol("agricultor")}
          />
          <RolPick
            icon={<ShoppingBasket className="w-8 h-8 text-primary" />}
            titulo="Comprador"
            text="Abasto mi negocio al por mayor"
            onClick={() => setRol("comprador")}
          />
          <RolPick
            icon={<Wrench className="w-8 h-8 text-earth" />}
            titulo="Transportista"
            text="Realizo fletes en Junín"
            onClick={() => setRol("transportista")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="text-xs text-muted-foreground mb-2">
        Registro como{" "}
        <span className="text-primary font-semibold capitalize">{rol}</span> · Paso {paso} de 3
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-success transition-all"
          style={{ width: `${(paso / 3) * 100}%` }}
        />
      </div>

      <div className="bg-card border border-border rounded-md p-5 space-y-4">
        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg">1. Datos de acceso</h2>
            <Field label="Celular">
              <div className="flex">
                <span className="border border-input border-r-0 rounded-l-sm px-3 inline-flex items-center bg-muted text-sm">
                  +51
                </span>
                <input
                  className="flex-1 border border-input rounded-r-sm px-3 py-2 tap-target"
                  placeholder="9XX XXX XXX"
                  onChange={(e) =>
                    setDatos({ ...datos, celular: e.target.value })
                  }
                />
              </div>
            </Field>
            <Field label="Nombre completo">
              <input
                className="w-full border border-input rounded-sm px-3 py-2 tap-target"
                placeholder="Nombres y apellidos"
                onChange={(e) =>
                  setDatos({ ...datos, nombre: e.target.value })
                }
              />
            </Field>
            <Field label="Contraseña">
              <input
                type="password"
                className="w-full border border-input rounded-sm px-3 py-2 tap-target"
                placeholder="Mínimo 6 caracteres"
                onChange={(e) =>
                  setDatos({ ...datos, clave: e.target.value })
                }
              />
            </Field>
            <Nav onNext={() => setPaso(2)} />
          </>
        )}

        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg">2. Validación de identidad</h2>
            <Field label={rol === "comprador" ? "RUC (11 dígitos)" : "DNI (8 dígitos)"}>
              <input
                className="w-full border border-input rounded-sm px-3 py-2 tap-target"
                placeholder={rol === "comprador" ? "20XXXXXXXXX" : "4XXXXXXX"}
                onChange={(e) =>
                  setDatos({ ...datos, documento: e.target.value })
                }
              />
            </Field>
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Sube foto nítida de tu DNI o Constancia de Productor para activar
                el Sello de Confianza
              </p>
              <button
                onClick={simularEscaneo}
                disabled={escaneando || escaneado}
                className="w-full border-2 border-dashed border-input rounded-md py-6 flex flex-col items-center gap-2 hover:bg-muted/50 tap-target"
              >
                {escaneando ? (
                  <>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-sm">Verificando documento...</span>
                  </>
                ) : escaneado ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center">
                      ✓
                    </div>
                    <span className="text-sm text-success font-semibold">
                      Documento validado
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm">Subir documento</span>
                  </>
                )}
              </button>
            </div>
            <Nav onBack={() => setPaso(1)} onNext={() => setPaso(3)} />
          </>
        )}

        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg">3. Datos de campo / logística</h2>
            {rol === "agricultor" && <CampoAgricultor datos={datos} setDatos={setDatos} />}
            {rol === "comprador" && <CampoComprador datos={datos} setDatos={setDatos} />}
            {rol === "transportista" && (
              <CampoTransportista datos={datos} setDatos={setDatos} />
            )}
            <Nav
              onBack={() => setPaso(2)}
              onNext={finalizar}
              nextLabel="Crear cuenta e ingresar"
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
  const cultivos = ["Papa", "Maíz", "Alcachofa", "Zanahoria", "Habas"];
  return (
    <>
      <Field label="Hectáreas que cultivas">
        <input
          type="number"
          step="0.1"
          className="w-full border border-input rounded-sm px-3 py-2 tap-target"
          placeholder="Ej: 1.5"
          onChange={(e) => setDatos({ ...datos, hectareas: e.target.value })}
        />
      </Field>
      {elegible && (
        <div className="bg-accent border border-success/30 text-accent-foreground rounded-md p-3 text-sm">
          <strong>¡Bienvenido!</strong> Elegible para el programa de Agricultura
          Familiar de Aco. Comisión de plataforma: <strong>0%</strong>.
        </div>
      )}
      <Field label="Cultivos principales">
        <div className="grid grid-cols-2 gap-2">
          {cultivos.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
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
      <Field label="RUC del negocio (11 dígitos)">
        <input
          maxLength={11}
          className="w-full border border-input rounded-sm px-3 py-2 tap-target"
          placeholder="20XXXXXXXXX"
          onChange={(e) => setDatos({ ...datos, ruc: e.target.value })}
        />
      </Field>
      <Field label="Nombre del local comercial">
        <input
          className="w-full border border-input rounded-sm px-3 py-2 tap-target"
          placeholder="Minimarket, restaurante, puesto..."
          onChange={(e) => setDatos({ ...datos, local: e.target.value })}
        />
      </Field>
      <Field label="Dirección comercial">
        <input
          className="w-full border border-input rounded-sm px-3 py-2 tap-target"
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
          className="w-full border border-input rounded-sm px-3 py-2 tap-target bg-white"
          onChange={(e) => setDatos({ ...datos, vehiculo: e.target.value })}
        >
          <option value="">Selecciona...</option>
          <option>Camión Baranda</option>
          <option>Furgón</option>
          <option>Pick-up</option>
        </select>
      </Field>
      <Field label="Capacidad máxima de carga (toneladas)">
        <input
          type="number"
          step="0.5"
          className="w-full border border-input rounded-sm px-3 py-2 tap-target"
          placeholder="Ej: 4"
          onChange={(e) => setDatos({ ...datos, capacidad: e.target.value })}
        />
      </Field>
      <Field label="Rutas comunes que cubres en Junín">
        <div className="grid grid-cols-2 gap-2">
          {["Aco-Huancayo", "Mito-Jauja", "Sincos-Huancayo", "Concepción-Lima"].map(
            (r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
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
      <label className="block text-sm font-medium text-foreground mb-1">
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
          className="flex-1 border border-input py-3 rounded-md tap-target"
        >
          Atrás
        </button>
      )}
      <button
        onClick={onNext}
        className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-md tap-target"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function RolPick({
  icon,
  titulo,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  titulo: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="border border-border bg-card rounded-md p-5 text-left hover:border-primary hover:shadow-md transition tap-target"
    >
      {icon}
      <div className="font-bold mt-2">{titulo}</div>
      <div className="text-xs text-muted-foreground">{text}</div>
    </button>
  );
}
