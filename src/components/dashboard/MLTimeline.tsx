import { Check, Dot } from "lucide-react";

/**
 * Interfaz extendida que define la estructura síncrona de cada nodo en la línea de tiempo.
 */
interface Step {
  /** Nombre descriptivo del hito comercial o logístico */
  label: string;
  /** Determina si el camión ya superó físicamente esta fase */
  done: boolean;
  /** Indica si la carga se encuentra bajo esta condición en el tiempo presente */
  active?: boolean;
}

interface MLTimelineProps {
  /** Colección indexada de hitos que componen la cadena de suministro de AgroConecta */
  steps: Step[];
}

/**
 * Componente de Trazabilidad Logística Modular e Hiper-Detallado.
 * Implementa una arquitectura fluida y responsiva que previene el solapamiento de texto
 * al reestructurar la orientación de los 6 pasos críticos de acuerdo al viewport.
 */
export function MLTimeline({ steps }: MLTimelineProps) {
  return (
    <div className="w-full py-2">
      {/* 
        VISTA DE ESCRITORIO (md:flex)
        Se renderiza de forma horizontal únicamente cuando el ancho de pantalla garantiza 
        que las 6 etiquetas cuenten con espacio suficiente sin colisionar textualmente.
      */}
      <ol className="hidden md:flex items-start w-full relative">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;

          return (
            <li 
              key={`desktop-step-${i}`} 
              className={`flex items-center relative ${!isLast ? "flex-1" : "flex-none"}`}
            >
              {/* Contenedor del Nodo Estructural */}
              <div className="flex flex-col items-center flex-1 min-w-0 group relative">
                
                {/* Esfera indicadora del Hito */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 shadow-2xs z-10 ${
                    s.done
                      ? "bg-success text-success-foreground border-success scale-100"
                      : s.active
                        ? "bg-card text-success border-success ring-4 ring-success/10 animate-pulse scale-105"
                        : "bg-muted text-muted-foreground border-border"
                  }`}
                  title={`${s.label} — ${s.done ? "Completado" : s.active ? "En Curso" : "Pendiente"}`}
                >
                  {s.done ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="font-mono">{i + 1}</span>
                  )}
                </div>

                {/* Etiqueta Textual Principal del Hito */}
                <span
                  className={`mt-2 text-[11px] text-center leading-tight max-w-[105px] px-1 transition-colors duration-200 select-none ${
                    s.done || s.active 
                      ? "text-foreground font-bold tracking-tight" 
                      : "text-muted-foreground font-medium"
                  }`}
                >
                  {s.label}
                </span>

                {/* Meta-información extendida debajo de cada hito para dar densidad visual */}
                <span className="text-[9px] text-muted-foreground/60 font-mono mt-0.5 tracking-tighter">
                  {s.done ? "✓ Verificado" : s.active ? "• Procesando" : "- Espera"}
                </span>
              </div>

              {/* 
                Línea de Conexión Fluvial entre Nodos (Desktop)
                Se posiciona de forma absoluta detrás de las esferas para evitar cortes visuales.
              */}
              {!isLast && (
                <div className="absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 -translate-y-1/2 pointer-events-none z-0">
                  <div
                    className={`h-full w-full transition-all duration-500 rounded-full ${
                      s.done 
                        ? "bg-success shadow-xs shadow-success/20" 
                        : "bg-border"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* 
        VISTA MÓVIL / TABLET VERTICAL (md:hidden)
        Evita el apiñamiento horizontal transformando el flujo en una lista ordenada vertical.
        Asegura legibilidad óptima para los transportistas y compradores usando smartphones en campo.
      */}
      <ol className="flex md:hidden flex-col w-full space-y-0.5 pl-2">
        {steps.map((s, i) => {
          const isLast = i === steps.length - 1;

          return (
            <li 
              key={`mobile-step-${i}`} 
              className="flex items-stretch gap-4 relative min-h-[56px]"
            >
              {/* 
                Línea de Conexión Fluvial Vertical
                Une las esferas de arriba a abajo simulando una tubería de procesos logísticos.
              */}
              {!isLast && (
                <div className="absolute top-8 left-4 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none z-0">
                  <div
                    className={`w-full h-full transition-all duration-500 rounded-full ${
                      s.done ? "bg-success" : "bg-border"
                    }`}
                  />
                </div>
              )}

              {/* Indicador Esférico del Nodo Izquierdo */}
              <div className="relative shrink-0 z-10 flex items-center justify-center h-8">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 shadow-2xs ${
                    s.done
                      ? "bg-success text-success-foreground border-success"
                      : s.active
                        ? "bg-card text-success border-success ring-4 ring-success/10 animate-pulse scale-105"
                        : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {s.done ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="font-mono">{i + 1}</span>
                  )}
                </div>
              </div>

              {/* Bloque Informativo Derecho del Hito */}
              <div className="flex-1 min-w-0 flex flex-col justify-center pb-3 pt-1 border-b border-border/30 last:border-0 pl-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs transition-colors duration-200 ${
                      s.done || s.active 
                        ? "text-foreground font-bold tracking-tight" 
                        : "text-muted-foreground font-semibold"
                    }`}
                  >
                    {s.label}
                  </span>
                  
                  {/* Badge de Estado Dinámico de Soporte */}
                  <div>
                    {s.done && (
                      <span className="text-[9px] bg-success/10 text-success px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-success/10">
                        Completado
                      </span>
                    )}
                    {s.active && (
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-primary/10 animate-pulse">
                        Actual
                      </span>
                    )}
                    {!s.done && !s.active && (
                      <span className="text-[9px] bg-muted text-muted-foreground/70 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border border-border/60">
                        En Espera
                      </span>
                    )}
                  </div>
                </div>

                {/* Texto explicativo pormenorizado según la fase real de la orden */}
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal max-w-md">
                  {i === 0 && "El comprador y el agricultor pactaron el precio base por kilo."}
                  {i === 1 && "Un transportista aceptó los términos de la bolsa y viaja al origen."}
                  {i === 2 && "Los estibadores están subiendo los sacos de la cosecha al camión."}
                  {i === 3 && "La unidad se desplaza por las carreteras de la región Junín."}
                  {i === 4 && "El camión llegó al destino; listo para validación y descarga de mercadería."}
                  {i === 5 && "Carga recibida a conformidad. Fondos transferidos con éxito."}
                </p>
              </div>

            </li>
          );
        })}
      </ol>
    </div>
  );
}