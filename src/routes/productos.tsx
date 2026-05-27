import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useAppStore } from "@/context/useAppStore";
import {
  MLFilterSidebar,
  type Filtros,
} from "@/components/marketplace/MLFilterSidebar";
import { MLProductCard } from "@/components/marketplace/MLProductCard";
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

    if (orden === "menor") r = [...r].sort((a, b) => a.precioPerKg - b.precioPerKg);
    if (orden === "reputacion")
      r = [...r].sort((a, b) => b.reputacionAgricultor - a.reputacionAgricultor);
    return r;
  }, [productos, q, filtros, orden]);

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4">
        <MLFilterSidebar
          filtros={filtros}
          setFiltros={setFiltros}
          totalResultados={filtrados.length}
        />

        <section>
          <div className="bg-card border border-border rounded-md px-4 py-3 mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filtrados.length}
              </span>{" "}
              cosechas en Junín
              {q && (
                <>
                  {" "}
                  para "<span className="text-foreground">{q}</span>"
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ordenar por:</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as any)}
                className="border border-input rounded-sm px-2 py-1.5 bg-white text-foreground tap-target"
              >
                <option value="relevancia">Más relevantes</option>
                <option value="menor">Menor precio</option>
                <option value="reputacion">Mayor reputación</option>
              </select>
            </div>
          </div>

          {filtrados.length === 0 ? (
            <div className="bg-card border border-border rounded-md p-10 text-center text-muted-foreground">
              No encontramos cosechas con esos filtros. Prueba con otro distrito o rubro.
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
