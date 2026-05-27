import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";
import { ChevronUp, User, ShoppingBasket, Truck } from "lucide-react";
import type { UserRole } from "@/context/types";

const opciones: { rol: UserRole; label: string; icon: React.ReactNode }[] = [
  { rol: "agricultor", label: "Don Tomás (Agricultor)", icon: <User className="w-4 h-4" /> },
  { rol: "comprador", label: "Valeria (Comprador)", icon: <ShoppingBasket className="w-4 h-4" /> },
  { rol: "transportista", label: "Lucho (Transportista)", icon: <Truck className="w-4 h-4" /> },
];

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const usuario = useAppStore((s) => s.usuarioActivo);
  const setRol = useAppStore((s) => s.setRolActivo);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 bg-white border border-border rounded-md shadow-lg w-64 overflow-hidden">
          <div className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground border-b border-border">
            Modo demo · Cambiar sesión
          </div>
          {opciones.map((o) => (
            <button
              key={o.rol}
              onClick={() => {
                setRol(o.rol);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-3 text-sm hover:bg-accent text-left tap-target ${
                usuario.rol === o.rol ? "bg-accent text-accent-foreground font-semibold" : ""
              }`}
            >
              {o.icon}
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-primary text-primary-foreground rounded-full px-4 py-3 shadow-lg flex items-center gap-2 text-sm font-medium tap-target"
      >
        <span>Ver como: {usuario.nombre.split(" ")[0]}</span>
        <ChevronUp
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
