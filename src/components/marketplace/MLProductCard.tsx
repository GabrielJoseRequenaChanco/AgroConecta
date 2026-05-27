import { Link } from "@tanstack/react-router";
import { Star, Truck } from "lucide-react";
import type { Producto } from "@/context/types";
import { formatSoles, formatKg } from "@/lib/format";

export function MLProductCard({ p }: { p: Producto }) {
  return (
    <Link
      to="/producto/$id"
      params={{ id: p.id }}
      className="bg-card border border-border rounded-md overflow-hidden ml-card-hover block"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={p.imagenUrl}
          alt={p.titulo}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
          Origen directo
        </span>
        {p.status === "reservado" && (
          <span className="absolute top-2 right-2 bg-earth text-earth-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
            Reservado
          </span>
        )}
        {p.status === "vendido" && (
          <span className="absolute top-2 right-2 bg-muted-foreground text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
            Vendido
          </span>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="text-[11px] text-muted-foreground uppercase">
          {p.rubro} · {p.variedad}
        </div>
        <div className="text-xl font-bold text-foreground leading-tight">
          {formatSoles(p.precioPerKg)}
          <span className="text-xs font-normal text-muted-foreground"> / kg</span>
        </div>
        <h3 className="text-sm text-foreground line-clamp-2 leading-snug">
          {p.titulo}
        </h3>
        <div className="flex items-center gap-1 text-[11px] text-success font-medium pt-0.5">
          <Truck className="w-3 h-3" />
          <span>Transporte a Huancayo y Concepción</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
          <span className="text-[11px] text-muted-foreground truncate">
            {p.nombreAgricultor} · {p.distritoOrigen}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold">
            <Star className="w-3 h-3 fill-success text-success" />
            {p.reputacionAgricultor.toFixed(1)}
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground pt-0.5">
          Stock: <span className="font-semibold text-foreground">{formatKg(p.volumenDisponible)}</span>
        </div>
      </div>
    </Link>
  );
}
