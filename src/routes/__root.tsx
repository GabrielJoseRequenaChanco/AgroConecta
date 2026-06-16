import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { MLHeader } from "@/components/shared/MLHeader";
import { MLFooter } from "@/components/shared/MLFooter";
import logo from "@/assets/logo.png";
import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAppStore } from "@/context/useAppStore";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-foreground">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La cosecha que buscas no existe o ya fue vendida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta recargar la página.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgroConecta - Cosechas de Junín directo del productor" },
      {
        name: "description",
        content:
          "Compra papas nativas, maíz y hortalizas directamente del agricultor en Aco, Concepción y Huancayo. Sin intermediarios, con transporte certificado.",
      },
      {
        property: "og:title",
        content: "AgroConecta - Cosechas de Junín directo del productor",
      },
      {
        property: "og:description",
        content: "Productores verificados, precios justos, fletes seguros en Junín.",
      },
      { property: "og:type", content: "website" },
      {
        name: "twitter:title",
        content: "AgroConecta - Cosechas de Junín directo del productor",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const minimal = pathname.startsWith("/checkout");
  const loginUser = useAppStore((s) => s.loginUser);
  const router = useRouter();

  useEffect(() => {
    // 1. Escuchar posibles errores en la URL del callback (ej. link expirado)
    const hashStr = typeof window !== "undefined" ? window.location.hash : "";
    if (hashStr.includes("error_description")) {
      const params = new URLSearchParams(hashStr.replace("#", "?"));
      const errorMsg = params.get("error_description");
      if (errorMsg) {
        toast.error("Error de activación", {
          description: decodeURIComponent(errorMsg).replace(/\+/g, " "),
          duration: 8000,
        });
        if (window.history.replaceState) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }

    // 2. Escuchador global de autenticación con onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Sincronizar el perfil del usuario en el store global
        await loginUser(session.user.id);

        // Detectar si proviene de confirmar su correo electrónico
        const hash = typeof window !== "undefined" ? window.location.hash : "";
        const search = typeof window !== "undefined" ? window.location.search : "";
        const isEmailConfirmation =
          hash.includes("type=signup") ||
          hash.includes("type=invite") ||
          search.includes("code=") ||
          hash.includes("access_token");

        if (isEmailConfirmation) {
          // Limpiar parámetros de la URL por estética
          if (typeof window !== "undefined" && window.history.replaceState) {
            window.history.replaceState(null, "", window.location.pathname);
          }

          toast.success("¡Cuenta activada con éxito!", {
            description: "Te damos la bienvenida a AgroConecta. Tu correo ha sido verificado.",
            duration: 8000,
          });

          // Redirección automática al catálogo de productos
          router.navigate({ to: "/productos" as any });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loginUser, router]);

  const usuario = useAppStore((s) => s.usuarioActivo);
  const showKycBanner = usuario && usuario.rol !== "anon" && (usuario.verificacionEstado === "PENDIENTE_VERIFICACION" || usuario.verificacionEstado === "pendiente");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background">
        {showKycBanner && (
          <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs sm:text-sm py-2 px-4 text-center font-medium flex items-center justify-center gap-2 animate-pulse">
            <span className="shrink-0">⚠️</span>
            <span>Tu perfil está en proceso de verificación por nuestro Staff. Puedes explorar la plataforma, pero no podrás realizar transacciones hasta que sea aprobado.</span>
          </div>
        )}
        {minimal ? (
          <header className="bg-white border-b border-border py-3 px-4 text-center shadow-sm">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src={logo}
                alt="AgroConecta"
                className="h-8 w-auto"
              />
              <span className="text-xs text-muted-foreground font-medium border-l border-border pl-3">
                Pasarela segura
              </span>
            </Link>
          </header>
        ) : (
          <MLHeader />
        )}
        <main className="flex-1">
          <Outlet />
        </main>
        {!minimal && <MLFooter />}
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}