import { Link, useRouter } from "@tanstack/react-router";
import { Search, MapPin, Bell, ShoppingBag, Truck } from "lucide-react";
import { useAppStore, getApproxLocation } from "@/context/useAppStore";
import { useState } from "react";
import logo from "@/assets/logo.png";

export function MLHeader() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const authSignOut = useAppStore((s) => s.authSignOut);
  const router = useRouter();
  const [q, setQ] = useState("");
  const esAnon = usuario.rol === "anon";
  const destino = !esAnon && usuario.ubicacion?.trim() ? usuario.ubicacion.split(",")[0] : "Perú";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({ to: "/productos", search: { q } as any });
  };

  return (
    <header className="w-full sticky top-0 z-40 shadow-sm bg-white border-b border-border">
      {/* Fila 1 (Principal - Fondo Blanco) */}
      <div className="bg-white border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src={logo}
              alt="AgroConecta"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <form
            onSubmit={onSearch}
            className="flex-1 flex items-center bg-[#f5f3f0] rounded-full border border-border/40 px-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Busca papas nativas, maíz, alcachofa..."
              className="flex-1 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent min-h-[40px]"
            />
            <button
              type="submit"
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors mr-1"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          <Link
            to="/registro"
            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-foreground/80 hover:text-primary transition-colors shrink-0"
          >
            <Truck className="w-4 h-4 text-primary" />
            Registra tu camión
          </Link>
        </div>
      </div>

      {/* Fila 2 (Sub-barra - Fondo Primary) */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-2 flex items-center gap-3 sm:gap-8 text-xs sm:text-sm overflow-x-auto">
          {destino === "Perú" ? (
            <Link
              to="/registro"
              className="flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 opacity-85 text-emerald-300" />
              <span className="opacity-75">Enviar a</span>
              <span className="font-bold underline text-white">Perú</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <MapPin className="w-3.5 h-3.5 opacity-85 text-emerald-300" />
              <span className="opacity-75">Enviar a</span>
              <span className="font-semibold">{destino}</span>
            </div>
          )}

          <nav className="flex items-center space-x-6 sm:space-x-8 shrink-0">
            <Link
              to="/categorias"
              className="opacity-90 hover:opacity-100 hover:underline transition-opacity font-medium"
            >
              Categorías
            </Link>
            <Link
              to="/ofertas"
              className="opacity-90 hover:opacity-100 hover:underline transition-opacity font-medium hidden sm:inline"
            >
              Ofertas
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3 sm:gap-6 shrink-0">
            {usuario.rol === "anon" ? (
              <>
                <Link
                  to="/registro"
                  className="opacity-90 hover:opacity-100 hover:underline transition-opacity hidden sm:inline"
                >
                  Crea tu cuenta
                </Link>
                <Link
                  to="/login"
                  className="bg-white/15 hover:bg-white/25 px-4 py-1.5 rounded-full font-bold transition-all text-xs"
                >
                  Ingresar
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={
                    usuario.rol === "agricultor"
                      ? "/dashboard/agricultor"
                      : usuario.rol === "transportista"
                        ? "/dashboard/transportista"
                        : "/dashboard/comprador"
                  }
                  className="hover:underline font-semibold flex items-center gap-1"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  {usuario.nombre.split(" ")[0] || "Perfil"}
                </Link>

                {usuario.rol === "agricultor" && (
                  <Link to="/agregar-producto" className="hover:underline hidden md:inline font-medium">
                    Vender
                  </Link>
                )}
                {usuario.rol === "admin" && (
                  <Link to="/admin" className="hover:underline hidden md:inline font-semibold">
                    Admin
                  </Link>
                )}
                {usuario.rol === "transportista" && (
                  <Link to="/fletes" className="hover:underline hidden md:inline font-medium">
                    Buscar flete
                  </Link>
                )}
                {usuario.rol === "comprador" && (
                  <Link to="/perfil" className="hover:underline hidden md:inline font-medium">
                    Perfil
                  </Link>
                )}

                <Link
                  to="/carrito"
                  className="relative p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="sr-only">Carrito</span>
                </Link>
                <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    await authSignOut();
                    router.navigate({ to: "/" as any });
                  }}
                  className="bg-white/15 hover:bg-white/25 px-3.5 py-1 rounded-full font-bold transition-all text-xs hidden sm:inline"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
