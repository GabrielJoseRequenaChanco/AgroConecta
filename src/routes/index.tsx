import { createFileRoute, Link } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { MLProductCard } from "@/components/marketplace/MLProductCard";
import {
  Shield,
  Coins,
  Truck,
  CreditCard,
  ChevronRight,
  Sprout,
  ShoppingBasket,
  Wrench,
} from "lucide-react";
import bannerAgr from "@/assets/banner-agricultor.jpg";
import bannerTra from "@/assets/banner-transportista.jpg";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

const banners = [
  {
    img: bannerAgr,
    eyebrow: "Cosechas de Aco",
    title: "Directo de la chacra a tu negocio. Sin intermediarios.",
    cta: "Ver cosechas disponibles",
    href: "/productos",
  },
  {
    img: bannerTra,
    eyebrow: "Bolsa de fletes",
    title: "¿Eres transportista? Asegura fletes fijos en Junín.",
    cta: "Regístrate aquí",
    href: "/registro",
  },
];

function Home() {
  const productos = useAppStore((s) => s.productos).filter(
    (p) => p.status !== "vendido"
  );
  const [bIdx, setBIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBIdx((i) => (i + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, []);

  const b = banners[bIdx];

  return (
    <div>
      {/* Banner */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-3">
          <div className="relative h-[220px] sm:h-[300px] md:h-[360px] rounded-md overflow-hidden">
            <img
              src={b.img}
              alt={b.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
            <div className="relative h-full flex flex-col justify-center p-5 sm:p-10 max-w-xl text-white">
              <span className="text-xs uppercase tracking-widest opacity-90">
                {b.eyebrow}
              </span>
              <h1 className="text-2xl sm:text-4xl font-bold mt-2 leading-tight">
                {b.title}
              </h1>
              <Link
                to={b.href}
                className="mt-4 inline-flex items-center gap-2 bg-success text-success-foreground px-5 py-3 rounded-md font-semibold tap-target w-fit hover:opacity-90"
              >
                {b.cta} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBIdx(i)}
                  className={`w-2 h-2 rounded-full ${i === bIdx ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Banner ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-white border-y border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Beneficio
            icon={<Shield className="w-6 h-6 text-success" />}
            title="100% Verificados"
            text="Productores con DNI validado"
          />
          <Beneficio
            icon={<Coins className="w-6 h-6 text-success" />}
            title="Precios justos de origen"
            text="Ahorra hasta 50% sin intermediarios"
          />
          <Beneficio
            icon={<Truck className="w-6 h-6 text-earth" />}
            title="Transportistas locales"
            text="Camiones certificados de Junín"
          />
          <Beneficio
            icon={<CreditCard className="w-6 h-6 text-primary" />}
            title="Trato seguro"
            text="Pago transparente Yape, Plin, Caja"
          />
        </div>
      </section>

      {/* Cosechas destacadas */}
      <section className="bg-background">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Cosechas destacadas de la semana
              </h2>
              <p className="text-xs text-muted-foreground">
                Origen directo desde Aco, Mito y Sincos
              </p>
            </div>
            <Link
              to="/productos"
              className="text-sm text-primary font-semibold hover:underline shrink-0"
            >
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {productos.slice(0, 4).map((p) => (
              <MLProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Tripartita roles */}
      <section className="bg-white border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground">
            ¿Cómo quieres operar hoy en AgroConecta?
          </h2>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Elige tu rol y empieza a mover tu cosecha, abastos o flete
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <RolCard
              icon={<Sprout className="w-8 h-8 text-success" />}
              titulo="Soy Agricultor"
              text="Quiero vender mi cosecha a precio justo, sin intermediarios."
              cta="Ingresar como Agricultor"
            />
            <RolCard
              icon={<ShoppingBasket className="w-8 h-8 text-primary" />}
              titulo="Soy Comprador / Mayorista"
              text="Quiero abastecer mi minimarket, restaurante o puesto al por mayor."
              cta="Ir al Marketplace"
              alt
            />
            <RolCard
              icon={<Wrench className="w-8 h-8 text-earth" />}
              titulo="Soy Transportista"
              text="Quiero tomar fletes seguros en la región Junín y ganar por viaje."
              cta="Ver Bolsa de Fletes"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Beneficio({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-semibold text-foreground leading-tight">
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function RolCard({
  icon,
  titulo,
  text,
  cta,
  alt,
}: {
  icon: React.ReactNode;
  titulo: string;
  text: string;
  cta: string;
  alt?: boolean;
}) {
  return (
    <div className="border border-border rounded-md p-5 bg-card flex flex-col items-start">
      {icon}
      <h3 className="mt-3 font-bold text-foreground text-lg">{titulo}</h3>
      <p className="text-sm text-muted-foreground mt-1 flex-1">{text}</p>
      <Link
        to="/registro"
        className={`mt-4 w-full text-center font-semibold py-3 rounded-md tap-target ${
          alt
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-success text-success-foreground hover:opacity-90"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
