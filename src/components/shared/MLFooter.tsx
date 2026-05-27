export function MLFooter() {
  return (
    <footer className="bg-white border-t border-border mt-12">
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-semibold text-foreground mb-2">AgroConecta</h4>
          <p className="text-muted-foreground text-xs">
            La plataforma del agricultor peruano. Junín, 2026.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Compra</h4>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>Rubros agrícolas</li>
            <li>Productores verificados</li>
            <li>Precios justos</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Vende</h4>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>Publica tu cosecha</li>
            <li>Sello MIDAGRI</li>
            <li>Pago seguro</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Logística</h4>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>Bolsa de fletes</li>
            <li>Registra tu camión</li>
            <li>Rutas de Junín</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        © 2026 AgroConecta — Aco · Concepción · Huancayo
      </div>
    </footer>
  );
}
