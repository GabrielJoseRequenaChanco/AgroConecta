interface Props {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "success" | "earth";
}

const accentMap = {
  primary: "border-l-primary",
  success: "border-l-success",
  earth: "border-l-earth",
};

export function MLMetricsCard({ label, value, hint, accent = "primary" }: Props) {
  return (
    <div
      className={`bg-card border border-border ${accentMap[accent]} border-l-4 rounded-md p-4`}
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
