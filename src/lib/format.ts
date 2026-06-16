export const formatSoles = (n?: number) =>
  n != null ? `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "S/ N/A";

export const formatKg = (n?: number) =>
  n != null
    ? n >= 1000
      ? `${(n / 1000).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`
      : `${n.toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kg`
    : "N/A";

export const calcularFlete = (destino: string, kg: number) => {
  const base: Record<string, number> = {
    Huancayo: 0.2,
    Concepción: 0.15,
    Jauja: 0.25,
    Lima: 0.55,
  };
  const tarifa = base[destino] ?? 0.3;
  return Math.round(kg * tarifa * 100) / 100;
};
