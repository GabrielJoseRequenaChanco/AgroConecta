interface Step {
  label: string;
  done: boolean;
  active?: boolean;
}

export function MLTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex items-center w-full">
      {steps.map((s, i) => (
        <li key={i} className="flex-1 flex items-center last:flex-none">
          <div className="flex flex-col items-center min-w-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                s.done
                  ? "bg-success text-white border-success"
                  : s.active
                    ? "bg-white text-success border-success"
                    : "bg-white text-muted-foreground border-border"
              }`}
            >
              {s.done ? "✓" : i + 1}
            </div>
            <span
              className={`mt-1 text-[10px] text-center leading-tight max-w-[80px] ${
                s.done || s.active ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1 mb-5 ${s.done ? "bg-success" : "bg-border"}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
