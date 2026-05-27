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
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La cosecha que buscas no existe o ya fue vendida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
      { property: "og:title", content: "AgroConecta - Cosechas de Junín directo del productor" },
      {
        property: "og:description",
        content: "Productores verificados, precios justos, fletes seguros en Junín.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AgroConecta - Cosechas de Junín directo del productor" },
      { name: "description", content: "Agro Conecta Marketplace connects Peruvian farmers, buyers, and transporters." },
      { property: "og:description", content: "Agro Conecta Marketplace connects Peruvian farmers, buyers, and transporters." },
      { name: "twitter:description", content: "Agro Conecta Marketplace connects Peruvian farmers, buyers, and transporters." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/687b0bcc-a874-4dfb-aa60-8f12f6c2cf10/id-preview-7a834ac1--d668ad32-6b88-4c43-9251-6ed51a369c59.lovable.app-1779817519996.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/687b0bcc-a874-4dfb-aa60-8f12f6c2cf10/id-preview-7a834ac1--d668ad32-6b88-4c43-9251-6ed51a369c59.lovable.app-1779817519996.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
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
          <header className="bg-primary text-primary-foreground py-3 px-4 text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-bold">
              <span className="bg-white text-primary rounded w-7 h-7 inline-flex items-center justify-center">
                A
              </span>
              AgroConecta · Pasarela segura
            </Link>
          </header>
        ) : (
          <MLHeader />
        )}
        <main className="flex-1">
          <Outlet />
        </main>
        {!minimal && <MLFooter />}
        <RoleSwitcher />
      </div>
    </QueryClientProvider>
  );
}
