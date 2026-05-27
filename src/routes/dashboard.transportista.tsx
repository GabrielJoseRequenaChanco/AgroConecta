import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { formatSoles, formatKg } from "@/lib/format";
import { MapPin, Truck, Phone, Package } from "lucide-react";

export const Route = createFileRoute("/dashboard/transportista")({
  component: TransportistaDashboard,
});

function TransportistaDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const fletes = useAppStore((s) => s.fletes);
  const ordenes = useAppStore((s) => s.ordenes);
  const aceptar = useAppStore((s) => s.aceptarFlete);
  const completar = useAppStore((s) => s.completarEntrega);

  const [tab, setTab] = useState<"bolsa" | "activos">("bolsa");

  const disponibles = fletes.filter((f) => f.status === "disponible");
  const activos = fletes.filter(
    (f) =>
      f.status === "aceptado" &&
      ordenes.find((o) => o.id === f.ordenId)?.transportistaId === usuario.id
  );

  return (
    <div className="max-w-[1100px] mx-auto px-3 sm:px-4 py-5 space-y-5">
      <header className="bg-card border border-border rounded-md p-5 flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 bg-earth/10 rounded-full flex items-center justify-center">
          <Truck className="w-7 h-7 text-earth" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold">{usuario.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            Camión Baranda Mitsubishi 4 T · Placa W1X-728
          </p>
        </div>
        <span className="bg-success text-success-foreground text-xs font-bold px-3 py-1.5 rounded-md">
          Disponible para fletes
        </span>
      </header>

      <div className="flex border-b border-border">
        <Tab active={tab === "bolsa"} onClick={() => setTab("bolsa")}>
          Bolsa de fletes ({disponibles.length})
        </Tab>
        <Tab active={tab === "activos"} onClick={() => setTab("activos")}>
          Mis viajes activos ({activos.length})
        </Tab>
      </div>

      {tab === "bolsa" && (
        <div className="space-y-3">
          {disponibles.length === 0 ? (
            <Empty msg="No hay fletes disponibles en este momento. Te avisaremos en cuanto un comprador cierre un trato." />
          ) : (
            disponibles.map((f) => {
              const orden = ordenes.find((o) => o.id === f.ordenId);
              return (
                <article
                  key={f.id}
                  className="bg-card border border-border rounded-md p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <div className="font-bold">{f.productoDescripcion}</div>
                    <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                      Nuevo flete
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Row icon={<MapPin className="w-4 h-4 text-success" />} label="Carga" v={f.origen} />
                    <Row icon={<MapPin className="w-4 h-4 text-earth" />} label="Descarga" v={`Mercado Mayorista de ${f.destino}`} />
                    <Row icon={<Package className="w-4 h-4 text-primary" />} label="Carga" v={formatKg(f.pesoCarga)} />
                    <Row icon={<Truck className="w-4 h-4 text-primary" />} label="Pago neto" v={formatSoles(f.tarifaPropuesta)} bold />
                  </div>
                  <button
                    onClick={() => aceptar(f.id, usuario.id, usuario.nombre)}
                    className="mt-3 w-full bg-success text-success-foreground font-bold py-3 rounded-md tap-target"
                  >
                    Tomar este flete / Aceptar viaje
                  </button>
                </article>
              );
            })
          )}
        </div>
      )}

      {tab === "activos" && (
        <div className="space-y-3">
          {activos.length === 0 ? (
            <Empty msg="Aún no tienes viajes en curso." />
          ) : (
            activos.map((f) => {
              const orden = ordenes.find((o) => o.id === f.ordenId);
              return (
                <article
                  key={f.id}
                  className="bg-card border border-border rounded-md p-4 space-y-3"
                >
                  <div className="font-bold">{f.productoDescripcion}</div>
                  <div className="aspect-[16/6] bg-gradient-to-r from-success/20 via-earth/20 to-primary/20 rounded-md flex items-center justify-center text-sm text-foreground border border-border">
                    <span className="bg-white/80 px-3 py-1 rounded">
                      {f.origen} →→→ 🚚 →→→ {f.destino}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                      <Phone className="w-4 h-4 text-success" />
                      Agricultor: +51 964 123 456
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Comprador: +51 984 555 121
                    </div>
                  </div>
                  {orden && (
                    <button
                      onClick={() => completar(orden.id)}
                      className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-md tap-target"
                    >
                      Marcar entrega completada
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold border-b-2 tap-target ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Row({
  icon,
  label,
  v,
  bold,
}: {
  icon: React.ReactNode;
  label: string;
  v: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-muted-foreground">{label}:</span>
      <span className={bold ? "font-bold text-foreground" : "text-foreground"}>
        {v}
      </span>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-10 text-center text-muted-foreground text-sm">
      {msg}
    </div>
  );
}
