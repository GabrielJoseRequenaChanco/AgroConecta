import { Link } from "@tanstack/react-router";

export function MLFooter() {
  return (
    <footer className="bg-white border-t border-border mt-12">
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-semibold text-foreground mb-2">AgroConecta</h4>
          <p className="text-muted-foreground text-xs leading-relaxed">
            La plataforma del agricultor peruano. Junín, 2026.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-foreground font-semibold">Compra</h4>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li>
              <Link to="/productos" className="hover:text-primary transition-colors hover:underline">
                Rubros agrícolas
              </Link>
            </li>
            <li>
              <Link to="/productos" className="hover:text-primary transition-colors hover:underline">
                Productores verificados
              </Link>
            </li>
            <li>
              <Link to="/productos" className="hover:text-primary transition-colors hover:underline">
                Precios justos
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-foreground font-semibold">Vende</h4>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li>
              <Link to="/registro" className="hover:text-primary transition-colors hover:underline">
                Publica tu cosecha
              </Link>
            </li>
            <li>
              <Link to="/registro" className="hover:text-primary transition-colors hover:underline">
                Sello MIDAGRI
              </Link>
            </li>
            <li>
              <Link to="/registro" className="hover:text-primary transition-colors hover:underline">
                Pago seguro
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-foreground font-semibold">Logística</h4>
          <ul className="space-y-1.5 text-muted-foreground text-xs">
            <li>
              <Link to="/fletes" className="hover:text-primary transition-colors hover:underline">
                Bolsa de fletes
              </Link>
            </li>
            <li>
              <Link to="/registro" className="hover:text-primary transition-colors hover:underline">
                Registra tu camión
              </Link>
            </li>
            <li>
              <Link to="/fletes" className="hover:text-primary transition-colors hover:underline">
                Rutas de Junín
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        © 2026 AgroConecta — Aco · Concepción · Huancayo
      </div>
    </footer>
  );
}
