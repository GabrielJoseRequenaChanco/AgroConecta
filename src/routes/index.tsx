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
  ArrowRight,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import bannerAgr from "@/assets/banner-agricultor.jpg";
import bannerTra from "@/assets/banner-transportista.jpg";
import bannerCom from "@/assets/banner-comprador.jpg";
import { useState, useEffect, useCallback } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

const banners = [
  {
    img: bannerAgr,
    eyebrow: "Cosechas de Aco",
    title: "Directo de la chacra a tu negocio.",
    subtitle: "Sin intermediarios, sin comisiones ocultas.",
    cta: "Ver cosechas disponibles",
    href: "/productos",
  },
  {
    img: bannerTra,
    eyebrow: "Bolsa de fletes",
    title: "¿Eres transportista?",
    subtitle: "Asegura fletes fijos en toda la región Junín.",
    cta: "Regístrate aquí",
    href: "/registro",
  },
  {
    img: bannerCom,
    eyebrow: "Ganancia justa",
    title: "Tu cosecha, tu precio.",
    subtitle: "Vende directo y llévate lo que mereces.",
    cta: "Agregar mi cosecha",
    href: "/registro",
  },
];

const beneficios = [
  {
    icon: <Shield className="w-5 h-5 text-success" />,
    title: "100% Verificados",
    text: "Productores con DNI validado",
  },
  {
    icon: <Coins className="w-5 h-5 text-success" />,
    title: "Precios de origen",
    text: "Ahorra hasta 50% comprando directo",
  },
  {
    icon: <Truck className="w-5 h-5 text-earth" />,
    title: "Transportistas locales",
    text: "Camiones certificados en Junín",
  },
  {
    icon: <CreditCard className="w-5 h-5 text-primary" />,
    title: "Pago seguro",
    text: "Yape · Plin · PagoEfectivo · Transferencia",
  },
];

const stats = [
  { icon: <Users className="w-5 h-5" />, value: "320+", label: "Agricultores activos" },
  { icon: <TrendingUp className="w-5 h-5" />, value: "S/ 1.2M", label: "En cosechas movidas" },
  { icon: <Star className="w-5 h-5" />, value: "4.9/5", label: "Satisfacción del comprador" },
  { icon: <Truck className="w-5 h-5" />, value: "85+", label: "Transportistas certificados" },
];

const roles = [
  {
    icon: <Sprout className="w-7 h-7" />,
    titulo: "Soy Agricultor",
    text: "Vende tu cosecha a precio justo, sin intermediarios ni comisiones. Accede a compradores mayoristas de toda la región.",
    cta: "Ingresar como Agricultor",
    accent: "success" as const,
    badge: "Para productores",
    beneficios: ["0% comisión para pequeños agricultores", "Pagos directos y transparentes", "Flete gestionado por la plataforma"],
  },
  {
    icon: <ShoppingBasket className="w-7 h-7" />,
    titulo: "Soy Comprador",
    text: "Abastece tu minimarket, restaurante o puesto al por mayor con cosechas frescas directo del campo.",
    cta: "Ir al Marketplace",
    accent: "primary" as const,
    badge: "Más popular",
    featured: true,
    beneficios: ["Precios hasta 50% más bajos", "Productores verificados con DNI", "Flete incluido hasta tu puerta"],
  },
  {
    icon: <Wrench className="w-7 h-7" />,
    titulo: "Soy Transportista",
    text: "Toma fletes seguros en la región Junín y gana por cada viaje con tarifas fijas garantizadas.",
    cta: "Ver Bolsa de Fletes",
    accent: "earth" as const,
    badge: "Fletes disponibles",
    beneficios: ["Tarifas fijas sin regateo", "Pagos confirmados al entregar", "Rutas de Aco, Mito y Sincos"],
  },
];

const accentStyles = {
  success: {
    icon: "text-success bg-success/10",
    btn: "bg-success text-success-foreground",
    border: "border-success/30",
    badge: "bg-success/10 text-success",
    check: "text-success",
  },
  primary: {
    icon: "text-primary bg-primary/10",
    btn: "bg-primary text-primary-foreground",
    border: "border-primary/40",
    badge: "bg-primary/10 text-primary",
    check: "text-primary",
  },
  earth: {
    icon: "text-earth bg-earth/10",
    btn: "bg-earth text-earth-foreground",
    border: "border-earth/30",
    badge: "bg-earth/10 text-earth",
    check: "text-earth",
  },
};

function Home() {
  const productos = useAppStore((s) => s.productos).filter(
    (p) => p.status !== "vendido"
  );
  const [bIdx, setBIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      if (i === bIdx) return;
      setTransitioning(true);
      setTimeout(() => {
        setBIdx(i);
        setTransitioning(false);
      }, 200);
    },
    [bIdx]
  );

  useEffect(() => {
    const t = setInterval(() => goTo((bIdx + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [bIdx, goTo]);

  const b = banners[bIdx];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Banner ── */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-3">
          <div className="relative h-[240px] sm:h-[320px] md:h-[420px] rounded-xl overflow-hidden">
            {banners.map((banner, i) => (
              <img
                key={i}
                src={banner.img}
                alt=""
                aria-hidden={i !== bIdx}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: i === bIdx ? 1 : 0 }}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            <div
              className="relative h-full flex flex-col justify-center px-6 sm:px-12 max-w-2xl text-white"
              style={{
                opacity: transitioning ? 0 : 1,
                transform: transitioning ? "translateY(8px)" : "translateY(0)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
              }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/75 mb-3">
                <span className="w-5 h-px bg-white/50" />
                {b.eyebrow}
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight">
                {b.title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-white/70 leading-relaxed">
                {b.subtitle}
              </p>
              <Link
                to={b.href}
                className="mt-6 inline-flex items-center gap-2 bg-success text-success-foreground px-6 py-3 rounded-lg font-bold text-sm w-fit hover:opacity-90 active:scale-95 transition-all shadow-lg"
              >
                {b.cta}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Ir al banner ${i + 1}`}
                  className="transition-all duration-400"
                  style={{
                    width: i === bIdx ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: i === bIdx ? "white" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Beneficios ── */}
      <section className="bg-white border-y border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
            {beneficios.map((b, i) => (
              <div
                key={b.title}
                className={`flex gap-3 items-center py-1.5 ${
                  i < 3 ? "md:border-r md:border-border md:pr-4" : ""
                }`}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  {b.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {b.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {b.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cosechas destacadas ── */}
      <section className="bg-background">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Cosechas más pedidas esta semana
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Origen directo desde Aco, Mito y Sincos · Junín
              </p>
            </div>
            <Link
              to="/productos"
              className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline shrink-0"
            >
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {productos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {productos.slice(0, 4).map((p) => (
                <MLProductCard key={p.id} p={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              No hay cosechas disponibles en este momento.
            </div>
          )}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="flex justify-center mb-2 opacity-80">{s.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
                <div className="text-xs sm:text-sm opacity-75 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="bg-white border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="text-center max-w-lg mx-auto mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              ¿Cómo quieres operar hoy?
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Elige tu rol y empieza a mover tu cosecha, abastos o flete en AgroConecta
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map((r) => {
              const styles = accentStyles[r.accent];
              return (
                <div
                  key={r.titulo}
                  className={`relative border rounded-xl p-6 bg-card flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    r.featured ? `border-2 ${styles.border}` : "border-border"
                  }`}
                >
                  {r.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${styles.badge} border ${styles.border}`}>
                        ★ {r.badge}
                      </span>
                    </div>
                  )}
                  {!r.featured && (
                    <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
                      {r.badge}
                    </span>
                  )}

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${styles.icon}`}>
                    {r.icon}
                  </div>

                  <h3 className="font-bold text-foreground text-xl leading-snug">
                    {r.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {r.text}
                  </p>

                  <ul className="mt-4 space-y-1.5 flex-1">
                    {r.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className={`mt-0.5 font-bold ${styles.check}`}>✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/registro"
                    className={`mt-6 w-full text-center font-bold text-sm py-3 rounded-xl transition-all hover:opacity-90 active:scale-98 ${styles.btn}`}
                  >
                    {r.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}