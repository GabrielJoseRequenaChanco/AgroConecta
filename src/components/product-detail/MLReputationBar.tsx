interface Props {
  nivel: 1 | 2 | 3 | 4 | 5;
}

const colores = ["#c0392b", "#e67e22", "#f1c40f", "#7fb069", "#316e2b"];
const labels = ["Nuevo", "Regular", "Bueno", "Muy bueno", "Excelente"];

export function MLReputationBar({ nivel }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 relative pt-4">
        {colores.map((c, i) => {
          const activo = i + 1 === nivel;
          return (
            <div key={i} className="flex-1 relative">
              {activo && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `7px solid ${c}`,
                  }}
                />
              )}
              <div
                style={{ backgroundColor: c }}
                className={`h-2.5 rounded-sm ${activo ? "h-4" : "opacity-60"}`}
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-center text-foreground font-semibold">
        Reputación: {labels[nivel - 1]}
      </p>
    </div>
  );
}
