import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppStore } from "@/context/useAppStore";
import { MLMetricsCard } from "@/components/dashboard/MLMetricsCard";
import { formatSoles, formatKg } from "@/lib/format";
import { Plus, ShieldCheck, MapPin } from "lucide-react";
import type { Distrito, Rubro } from "@/context/types";

export const Route = createFileRoute("/dashboard/agricultor")({
  component: AgricultorDashboard,
});

function AgricultorDashboard() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const productos = useAppStore((s) => s.productos);
  const ordenes = useAppStore((s) => s.ordenes);
  const addProducto = useAppStore((s) => s.addProducto);
  const [modal, setModal] = useState(false);

  const mis = productos.filter((p) => p.agricultorId === usuario.id);
  const misOrdenes = ordenes.filter((o) => o.agricultorId === usuario.id);

  const ganancias = useMemo(
    () =>
      misOrdenes
        .filter((o) => o.status !== "pendiente_flete")
        .reduce((s, o) => s + o.totalPagoProducto, 0),
    [misOrdenes]
  );
  const kilosVendidos = misOrdenes.reduce(
    (s, o) => s + o.cantidadComprada,
    0
  );

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-5 space-y-5">
      <header className="bg-card border border-border rounded-md p-5 flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-2xl font-bold text-success">
          {usuario.nombre[4] ?? "T"}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold">{usuario.nombre}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {usuario.ubicacion}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 bg-success text-success-foreground text-xs font-bold px-3 py-2 rounded-md">
          <ShieldCheck className="w-4 h-4" />
          Productor Auténtico MIDAGRI Verificado
        </span>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MLMetricsCard
          label="Ganancias del mes"
          value={formatSoles(ganancias)}
          hint="Cierres confirmados"
          accent="success"
        />
        <MLMetricsCard
          label="Kilos vendidos"
          value={formatKg(kilosVendidos)}
          hint="En cosechas cerradas"
          accent="earth"
        />
        <MLMetricsCard
          label="Cosechas en vitrina"
          value={String(mis.filter((p) => p.status === "disponible").length)}
          hint="Activas en marketplace"
          accent="primary"
        />
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Mis publicaciones</h2>
        <button
          onClick={() => setModal(true)}
          className="bg-success text-success-foreground font-bold px-4 py-3 rounded-md inline-flex items-center gap-2 tap-target"
        >
          <Plus className="w-4 h-4" /> Publicar nueva cosecha
        </button>
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Cosecha</th>
              <th className="text-left p-3 hidden sm:table-cell">Precio</th>
              <th className="text-left p-3 hidden md:table-cell">Stock</th>
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {mis.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  Aún no has publicado cosechas. Usa "Publicar nueva cosecha".
                </td>
              </tr>
            )}
            {mis.map((p) => {
              const orden = misOrdenes.find((o) => o.productoId === p.id);
              const estado =
                p.status === "vendido"
                  ? { txt: "Vendido y entregado", color: "bg-muted text-muted-foreground" }
                  : p.status === "reservado"
                    ? orden?.status === "en_transito"
                      ? { txt: "Transportista en camino", color: "bg-earth text-earth-foreground" }
                      : { txt: "Reservado · esperando transportista", color: "bg-yellow-100 text-yellow-900" }
                    : { txt: "Activo · buscando comprador", color: "bg-accent text-accent-foreground" };
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <div className="flex gap-3 items-center">
                      <img
                        src={p.imagenUrl}
                        alt=""
                        className="w-12 h-12 object-cover rounded-sm"
                      />
                      <div>
                        <div className="font-medium">{p.titulo}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.distritoOrigen}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {formatSoles(p.precioPerKg)}/kg
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {formatKg(p.volumenDisponible)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-1 rounded-sm ${estado.color}`}
                    >
                      {estado.txt}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <PublicarModal
          onClose={() => setModal(false)}
          onSave={(p) => {
            addProducto(p);
            setModal(false);
          }}
          agricultor={usuario}
        />
      )}
    </div>
  );
}

function PublicarModal({
  onClose,
  onSave,
  agricultor,
}: {
  onClose: () => void;
  onSave: (p: any) => void;
  agricultor: any;
}) {
  const [f, setF] = useState({
    titulo: "",
    rubro: "Tubérculos" as Rubro,
    variedad: "",
    volumenDisponible: "1000",
    precioPerKg: "1.50",
    distritoOrigen: "Aco" as Distrito,
    fechaCosecha: new Date().toISOString().slice(0, 10),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      agricultorId: agricultor.id,
      nombreAgricultor: agricultor.nombre,
      reputacionAgricultor: 5,
      titulo: f.titulo || `${f.rubro} ${f.variedad}`,
      rubro: f.rubro,
      variedad: f.variedad,
      volumenDisponible: Number(f.volumenDisponible),
      precioPerKg: Number(f.precioPerKg),
      distritoOrigen: f.distritoOrigen,
      imagenUrl:
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=800&q=80",
      fechaCosecha: f.fechaCosecha,
      descripcion: `Cosecha fresca de ${f.variedad} cultivada en ${f.distritoOrigen}, lista para entrega.`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-3">
      <form
        onSubmit={submit}
        className="bg-card rounded-md w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold">Publicar nueva cosecha</h3>
          <button type="button" onClick={onClose} className="text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <Input label="Título" value={f.titulo} onChange={(v) => setF({ ...f, titulo: v })} placeholder="Ej: Papa Huayro fresca" />
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Rubro"
              value={f.rubro}
              onChange={(v) => setF({ ...f, rubro: v as Rubro })}
              options={["Tubérculos", "Hortalizas", "Legumbres", "Cereales"]}
            />
            <Input label="Variedad" value={f.variedad} onChange={(v) => setF({ ...f, variedad: v })} placeholder="Camotillo, Huayro..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Volumen (kg)"
              type="number"
              value={f.volumenDisponible}
              onChange={(v) => setF({ ...f, volumenDisponible: v })}
            />
            <Input
              label="Precio (S/. por kg)"
              type="number"
              value={f.precioPerKg}
              onChange={(v) => setF({ ...f, precioPerKg: v })}
            />
          </div>
          <Select
            label="Distrito de origen"
            value={f.distritoOrigen}
            onChange={(v) => setF({ ...f, distritoOrigen: v as Distrito })}
            options={["Aco", "Concepción", "Orcotuna", "Mito", "Sincos"]}
          />
          <Input
            label="Fecha estimada de cosecha"
            type="date"
            value={f.fechaCosecha}
            onChange={(v) => setF({ ...f, fechaCosecha: v })}
          />
          <div className="border-2 border-dashed border-input rounded-md py-4 text-center text-xs text-muted-foreground">
            Adjunta fotos de la chacra (simulado)
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-input py-3 rounded-md tap-target"
          >
            Cancelar
          </button>
          <button className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-md tap-target">
            Publicar al mercado
          </button>
        </div>
      </form>
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}
function Input({ label, value, onChange, type = "text", placeholder }: InputProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-input rounded-sm px-3 py-2 tap-target"
      />
    </div>
  );
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}
function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-input rounded-sm px-3 py-2 bg-white tap-target"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
