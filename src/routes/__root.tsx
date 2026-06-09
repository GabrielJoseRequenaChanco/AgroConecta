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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background">
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
    </QueryClientProvider>
  );
}