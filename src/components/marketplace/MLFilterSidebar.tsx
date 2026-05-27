import type { Distrito, Rubro } from "@/context/types";

export interface Filtros {
  distrito: Distrito | "todos";
  rubro: Rubro | "todos";
  soloVerificados: boolean;
  precioMin: string;
  precioMax: string;
}

interface Props {
  filtros: Filtros;
  setFiltros: (f: Filtros) => void;
  totalResultados: number;
}

const distritos: (Distrito | "todos")[] = [
  "todos",
  "Aco",
  "Concepción",
  "Orcotuna",
  "Mito",
  "Sincos",
];
const rubros: (Rubro | "todos")[] = [
  "todos",
  "Tubérculos",
  "Hortalizas",
  "Legumbres",
  "Cereales",
];

export function MLFilterSidebar({ filtros, setFiltros, totalResultados }: Props) {
  return (
    <aside className="bg-card border border-border rounded-md p-4 text-sm space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Cosechas en Junín</h2>
        <p className="text-xs text-muted-foreground">
          {totalResultados} cosechas encontradas
        </p>
      </div>

      <FilterBlock title="Distrito">
        {distritos.map((d) => (
          <button
            key={d}
            onClick={() => setFiltros({ ...filtros, distrito: d })}
            className={`block text-left text-xs py-1.5 px-1 w-full hover:text-primary ${
              filtros.distrito === d
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {d === "todos" ? "Todos los distritos" : d}
          </button>
        ))}
      </FilterBlock>

      <FilterBlock title="Rubro agrícola">
        {rubros.map((r) => (
          <button
            key={r}
            onClick={() => setFiltros({ ...filtros, rubro: r })}
            className={`block text-left text-xs py-1.5 px-1 w-full hover:text-primary ${
              filtros.rubro === r
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {r === "todos" ? "Todos los rubros" : r}
          </button>
        ))}
      </FilterBlock>

      <FilterBlock title="Certificación">
        <label className="flex items-center gap-2 text-xs cursor-pointer py-1">
          <input
            type="checkbox"
            checked={filtros.soloVerificados}
            onChange={(e) =>
              setFiltros({ ...filtros, soloVerificados: e.target.checked })
            }
            className="accent-primary w-4 h-4"
          />
          Solo productores verificados (DNI/RUC)
        </label>
      </FilterBlock>

      <FilterBlock title="Rango de precio (S/. por kg)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={filtros.precioMin}
            onChange={(e) =>
              setFiltros({ ...filtros, precioMin: e.target.value })
            }
            className="w-full border border-input rounded-sm px-2 py-1.5 text-xs"
          />
          <span className="text-muted-foreground">—</span>
          <input
            type="number"
            placeholder="Máx"
            value={filtros.precioMax}
            onChange={(e) =>
              setFiltros({ ...filtros, precioMax: e.target.value })
            }
            className="w-full border border-input rounded-sm px-2 py-1.5 text-xs"
          />
        </div>
      </FilterBlock>
    </aside>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-4 border-b border-border last:border-b-0 last:pb-0">
      <h3 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
