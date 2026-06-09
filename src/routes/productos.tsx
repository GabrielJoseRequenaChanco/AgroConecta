import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppStore } from "@/context/useAppStore";
import {
  MLFilterSidebar,
  type Filtros,
} from "@/components/marketplace/MLFilterSidebar";
import { MLProductCard } from "@/components/marketplace/MLProductCard";
import { SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/productos")({
  validateSearch: searchSchema,
  component: Marketplace,
});

function Marketplace() {
  const { q } = Route.useSearch();
  const productos = useAppStore((s) => s.productos);
  const [filtros, setFiltros] = useState<Filtros>({
    distrito: "todos",
    rubro: "todos",
    soloVerificados: false,
    precioMin: "",
    precioMax: "",
  });
  const [orden, setOrden] = useState<"relevancia" | "menor" | "reputacion">(
    "relevancia"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtrados = useMemo(() => {
    let r = productos.filter((p) => p.status !== "vendido");
    if (q) {
      const ql = q.toLowerCase();
      r = r.filter(
        (p) =>
          p.titulo.toLowerCase().includes(ql) ||
          p.variedad.toLowerCase().includes(ql) ||
          p.rubro.toLowerCase().includes(ql)
      );
    }
    if (filtros.distrito !== "todos")
      r = r.filter((p) => p.distritoOrigen === filtros.distrito);
    if (filtros.rubro !== "todos")
      r = r.filter((p) => p.rubro === filtros.rubro);
    if (filtros.soloVerificados)
      r = r.filter((p) => p.reputacionAgricultor >= 4.5);
    if (filtros.precioMin)
      r = r.filter((p) => p.precioPerKg >= Number(filtros.precioMin));
    if (filtros.precioMax)
      r = r.filter((p) => p.precioPerKg <= Number(filtros.precioMax));
    if (orden === "menor")
      r = [...r].sort((a, b) => a.precioPerKg - b.precioPerKg);
    if (orden === "reputacion")
      r = [...r].sort((a, b) => b.reputacionAgricultor - a.reputacionAgricultor);
    return r;
  }, [productos, q, filtros, orden]);

  const hayFiltrosActivos =
    filtros.distrito !== "todos" ||
    filtros.rubro !== "todos" ||
    filtros.soloVerificados ||
    !!filtros.precioMin ||
    !!filtros.precioMax;

  const resetFiltros = () =>
    setFiltros({
      distrito: "todos",
      rubro: "todos",
      soloVerificados: false,
      precioMin: "",
      precioMax: "",
    });

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Inicio</Link>
        {" › "}
        <span className="text-foreground">Marketplace de cosechas</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        {/* Sidebar desktop */}
        <div className="hidden md:block">
          <MLFilterSidebar
            filtros={filtros}
            setFiltros={setFiltros}
            totalResultados={filtrados.length}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-background overflow-y-auto shadow-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-foreground">Filtros</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MLFilterSidebar
                filtros={filtros}
                setFiltros={setFiltros}
                totalResultados={filtrados.length}
              />
            </div>
          </div>
        )}

        <section>
          {/* Toolbar */}
          <div className="bg-card border border-border rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Mobile filter button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-muted"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
                {hayFiltrosActivos && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    ●
                  </span>
                )}
              </button>

              <div className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{filtrados.length}</span>{" "}
                cosechas disponibles en Junín
                {q && (
                  <> · búsqueda: "<span className="text-foreground font-medium">{q}</span>"</>
                )}
              </div>

              {hayFiltrosActivos && (
                <button
                  onClick={resetFiltros}
                  className="text-xs text-primary underline hover:no-underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden sm:inline">Ordenar:</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as typeof orden)}
                className="border border-input rounded-lg px-2 py-1.5 bg-white text-foreground text-sm tap-target"
              >
                <option value="relevancia">Más relevantes</option>
                <option value="menor">Menor precio</option>
                <option value="reputacion">Mayor reputación</option>
              </select>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground text-sm">
                No encontramos cosechas con esos filtros.
              </p>
              <button
                onClick={resetFiltros}
                className="mt-3 text-sm text-primary font-semibold hover:underline"
              >
                Limpiar filtros y ver todo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {filtrados.map((p) => (
                <MLProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}