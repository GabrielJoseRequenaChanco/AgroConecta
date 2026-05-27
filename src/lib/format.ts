export const formatSoles = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatKg = (n: number) =>
  n >= 1000
    ? `${(n / 1000).toLocaleString("es-PE", { maximumFractionDigits: 2 })} t`
    : `${n.toLocaleString("es-PE")} kg`;

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
