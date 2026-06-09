import { Link, useRouter } from "@tanstack/react-router";
import { Search, MapPin, Bell, ShoppingBag, Truck, Menu } from "lucide-react";
import { useAppStore } from "@/context/useAppStore";
import { useState } from "react";

export function MLHeader() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const authSignOut = useAppStore((s) => s.authSignOut);
  const router = useRouter();
  const [q, setQ] = useState("");
  const destino = usuario.ubicacion?.trim() || "Huancayo, Junín";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/productos", search: { q } as any });
  };

  return (
    <header className="w-full bg-primary text-primary-foreground sticky top-0 z-40 shadow-sm">
      {/* Fila 1 */}
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-white text-primary rounded-md w-9 h-9 flex items-center justify-center font-bold text-lg">
            A
          </div>
          <span className="hidden sm:block font-bold text-lg leading-none">
            AgroConecta
          </span>
        </Link>

        <form
          onSubmit={onSearch}
          className="flex-1 flex items-center bg-white rounded-sm overflow-hidden tap-target"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Busca papas nativas, maíz, alcachofa, rubros..."
            className="flex-1 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none min-h-[44px]"
          />
          <button
            type="submit"
            className="px-3 text-muted-foreground hover:text-foreground"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>

        <Link
          to="/registro"
          className="hidden md:flex items-center gap-1 text-xs hover:underline shrink-0"
        >
          <Truck className="w-4 h-4" />
          Registra tu camión
        </Link>
      </div>

      {/* Fila 2 */}
      <div className="border-t border-white/15">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-3 sm:gap-5 text-xs sm:text-sm overflow-x-auto">
          <div className="flex items-center gap-1 shrink-0">
            <MapPin className="w-3.5 h-3.5" />
            <span className="opacity-90">Enviar a</span>
            <span className="font-semibold">{destino}</span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link to="/categorias" className="hover:underline">
              Categorías
            </Link>
            <Link to="/ofertas" className="hover:underline hidden sm:inline">
              Ofertas
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 sm:gap-4 shrink-0">
            {usuario.rol === "anon" ? (
              <>
                <Link to="/registro" className="hover:underline hidden sm:inline">
                  Crea tu cuenta
                </Link>
                <Link to="/login" className="hover:underline font-medium">
                  Ingresar
                </Link>
              </>
            ) : (
              <>
                {/* logged-in: no create account link */}
                <Link
                  to={
                    usuario.rol === "agricultor"
                      ? "/dashboard/agricultor"
                      : usuario.rol === "transportista"
                      ? "/dashboard/transportista"
                      : "/dashboard/comprador"
                  }
                  className="hover:underline font-medium"
                >
                  {usuario.nombre.split(" ")[0] || "Perfil"}
                </Link>

                {/* Role specific quick action */}
                {usuario.rol === "agricultor" && (
                  <Link to="/agregar-producto" className="hover:underline hidden md:inline">
                    Vender
                  </Link>
                )}
                {usuario.rol === "admin" && (
                  <Link to="/admin" className="hover:underline hidden md:inline">Admin</Link>
                )}
                {usuario.rol === "transportista" && (
                  <Link to="/fletes" className="hover:underline hidden md:inline">
                    Buscar flete
                  </Link>
                )}
                {usuario.rol === "comprador" && (
                  <Link to="/perfil" className="hover:underline hidden md:inline">
                    Perfil
                  </Link>
                )}

                <Link to="/carrito" className="relative">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="sr-only">Carrito</span>
                </Link>
                <Bell className="w-4 h-4" />
                <button onClick={async () => { await authSignOut(); router.navigate({ to: "/" as any }); }} className="text-sm hover:underline hidden sm:inline">Salir</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
