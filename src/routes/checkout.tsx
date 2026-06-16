import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { z } from "zod";
import { useAppStore, uploadFileToStorage } from "@/context/useAppStore";
import { formatSoles, calcularFlete } from "@/lib/format";
import yapeQr from "@/assets/Yape_Requena.jpeg";
import confetti from "canvas-confetti";
import {
  Truck,
  CheckCircle2,
  Smartphone,
  ChevronRight,
  MapPin,
  Package,
  Shield,
  Upload,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  productoId: z.string().optional(),
  cantidad: z.string().optional(),
  destino: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  component: Checkout,
});

const STEPS = [
  { n: 1, label: "Pedido" },
  { n: 2, label: "Logística" },
  { n: 3, label: "Pago" },
];

function Checkout() {
  const { productoId, cantidad, destino } = Route.useSearch();
  const router = useRouter();
  
  const producto = useAppStore((s) =>
    s.productos.find((p) => p.id === productoId)
  );
  const usuario = useAppStore((s) => s.usuarioActivo);
  const createOrden = useAppStore((s) => s.createOrden);

  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [confirmado, setConfirmado] = useState<string | null>(null);
  
  // Voucher upload states
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [confirmandoOrden, setConfirmandoOrden] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = usuario.rol === "admin";

  if (!producto) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center">
        <p className="text-muted-foreground">
          No hay producto seleccionado.{" "}
          <Link to="/productos" className="text-primary font-semibold hover:underline">
            Ir al marketplace
          </Link>
        </p>
      </div>
    );
  }

  const kg = Math.max(1, Number(cantidad) || 50);
  const dest = (destino as string) || "Huancayo";
  const subtotal = producto.precioPerKg * kg;
  const flete = calcularFlete(dest, kg);
  const total = subtotal + flete;

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprobanteFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprobantePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const confirmar = async () => {
    setErrorPago(null);
    
    // Validation: Admin is allowed to skip uploading voucher
    if (!isAdmin && !comprobanteFile) {
      setErrorPago("Debes cargar la captura del comprobante de pago de Yape.");
      return;
    }

    setConfirmandoOrden(true);

    try {
      let finalVoucherUrl = "";
      if (comprobanteFile) {
        setSubiendoComprobante(true);
        const uploadedUrl = await uploadFileToStorage("payment_vouchers", comprobanteFile);
        setSubiendoComprobante(false);
        if (!uploadedUrl) {
          setErrorPago("Error al subir el comprobante de pago a la base de datos.");
          setConfirmandoOrden(false);
          return;
        }
        finalVoucherUrl = uploadedUrl;
      } else if (isAdmin) {
        finalVoucherUrl = "https://example.com/admin-bypass.jpg";
      }

      const ordenId = await createOrden(
        {
          productoId: producto.id,
          tituloProducto: producto.titulo,
          precioUnitario: producto.precioPerKg,
          cantidadComprada: kg,
          totalPagoProducto: subtotal,
          totalPagoFlete: flete,
          distritoOrigen: producto.distritoOrigen,
          distritoDestino: dest,
          agricultorId: producto.agricultorId,
          nombreAgricultor: producto.nombreAgricultor,
          telefonoAgricultor: producto.telefonoAgricultor,
          comprobanteUrl: finalVoucherUrl,
        },
        {
          origen: `Zona de producción del distrito de ${producto.distritoOrigen}`,
          destino: dest,
          tarifa: flete,
          descripcion: `${kg} kg de ${producto.titulo}`,
        }
      );

      if (ordenId) {
        setConfirmado(ordenId);
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.55 },
          colors: ["#316e2b", "#5e8c31", "#84602b", "#f1c40f", "#fff"],
        });
      } else {
        setErrorPago("Error al registrar la transacción. Intenta nuevamente.");
      }
    } catch (err) {
      console.error(err);
      setErrorPago("Ocurrió un error inesperado al procesar la orden.");
    } finally {
      setConfirmandoOrden(false);
    }
  };

  if (confirmado) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-success/10 rounded-full mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-2xl font-bold mt-5 text-foreground">¡Trato cerrado!</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Tu pago ha entrado en custodia segura. Hemos notificado al productor <strong className="text-foreground">{producto.nombreAgricultor}</strong> y el flete ya está disponible en la bolsa de transportistas de Junín.
        </p>

        <div className="bg-card border border-border rounded-xl p-5 mt-6 text-left text-sm space-y-2.5">
          <SummaryRow label="N° de orden" value={confirmado} mono />
          <SummaryRow label="Cosecha" value={producto.titulo} />
          <SummaryRow label="Cantidad" value={`${kg} kg`} />
          <SummaryRow label="Destino" value={dest} />
          <SummaryRow label="Estado" value="PAGO EN CUSTODIA" />
          <div className="border-t border-border pt-2.5">
            <SummaryRow label="Total en Custodia" value={formatSoles(total)} bold />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to="/dashboard/comprador"
            className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm tap-target hover:opacity-90 transition-opacity"
          >
            Ver mi panel
          </Link>
          <Link
            to="/productos"
            className="border border-primary text-primary px-5 py-3 rounded-xl font-semibold text-sm tap-target hover:bg-accent transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
      {/* Stepper */}
      <nav className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  paso > s.n
                    ? "bg-success text-success-foreground"
                    : paso === s.n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {paso > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
              </div>
              <span
                className={`text-sm font-medium ${paso === s.n ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-10 h-px transition-colors ${paso > s.n ? "bg-success" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </nav>

      <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
        {/* PASO 1: Detalle del pedido */}
        {paso === 1 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Detalle del pedido</h2>

            <div className="flex gap-4 border border-border rounded-xl p-4 bg-background">
              <img
                src={producto.imagenUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 text-sm min-w-0">
                <div className="font-bold text-foreground">{producto.titulo}</div>
                <div className="text-muted-foreground text-xs mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {producto.nombreAgricultor} · {producto.distritoOrigen}
                </div>
                <div className="mt-2 text-foreground">
                  {kg} kg × {formatSoles(producto.precioPerKg)} ={" "}
                  <strong>{formatSoles(subtotal)}</strong>
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {Math.ceil(kg / 50)} saco(s) de 50 kg · entrega a {dest}
                </div>
              </div>
            </div>

            <div className="bg-success/5 border border-success/20 rounded-xl p-3 flex gap-2 text-sm text-success">
              <Shield className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Compra protegida. El pago permanece en custodia hasta que el transportista entregue la mercadería física.
              </span>
            </div>

            <button
              onClick={() => setPaso(2)}
              className="w-full bg-success text-success-foreground font-bold py-3.5 rounded-xl tap-target hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Continuar a logística <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* PASO 2: Logística */}
        {paso === 2 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Logística y transporte</h2>

            <div className="border border-border rounded-xl p-4 flex gap-4 bg-background">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-sm flex-1">
                <div className="font-bold text-foreground">Asignación automática de flete regional</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Una vez realizado el pago, la orden se listará en la bolsa de fletes y un transportista certificado de Junín tomará el viaje.
                </p>
                <div className="mt-2 text-foreground flex items-center gap-2 text-xs">
                  <span className="font-medium">{producto.distritoOrigen}</span>
                  <span className="text-muted-foreground">→→→ 🚚 →→→</span>
                  <span className="font-medium">{dest}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tarifa estimada de flete:</span>
                  <span className="font-bold text-amber-700">{formatSoles(flete)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Tiempo de entrega</div>
                <div className="font-bold text-foreground">Coordinación directa</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Seguro de carga</div>
                <div className="font-bold text-success">Garantía Escrow ✓</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaso(1)}
                className="flex-1 border border-input py-3 rounded-xl tap-target text-sm font-medium hover:bg-muted transition-colors"
              >
                Atrás
              </button>
              <button
                onClick={() => setPaso(3)}
                className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl tap-target hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Continuar al pago <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* PASO 3: Pasarela Exclusiva Yape */}
        {paso === 3 && (
          <>
            <h2 className="font-bold text-lg text-foreground">Método de pago exclusivo</h2>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-2.5 text-xs text-primary font-semibold">
              <Smartphone className="w-4.5 h-4.5" />
              <span>El único medio de pago habilitado por el momento es Yape.</span>
            </div>

            {/* QR Section */}
            <div className="flex flex-col items-center justify-center p-4 border border-border rounded-xl bg-muted/10 space-y-3">
              <span className="text-xs font-semibold text-muted-foreground">Escanea el QR para yapear el total:</span>
              <div className="w-[260px] overflow-hidden border-2 border-primary/20 rounded-xl bg-white p-2 shadow-sm">
                <img
                  src={yapeQr}
                  alt="QR de Pago Yape"
                  className="w-full h-auto object-contain"
                  style={{ aspectRatio: "1131/1529" }}
                />
              </div>
              <div className="text-center space-y-0.5">
                <div className="text-xs font-bold text-foreground">Titular: Don Tomás Requena H.</div>
                <div className="text-[10px] text-muted-foreground">Celular asociado: 964 123 456</div>
              </div>
            </div>

            {/* Voucher Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-foreground">
                Subir captura del comprobante de Yape * {!isAdmin && <span className="text-destructive">(Requerido)</span>}
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleComprobanteChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendoComprobante}
                className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition-colors ${
                  comprobantePreview ? "border-success/40 bg-success/5" : "border-input hover:border-muted-foreground hover:bg-muted/30"
                }`}
              >
                {subiendoComprobante ? (
                  <>
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-foreground">Subiendo comprobante...</span>
                  </>
                ) : comprobantePreview ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-success" />
                    <span className="text-xs font-bold text-success">¡Comprobante cargado con éxito!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Haga clic para cargar captura del comprobante</span>
                  </>
                )}
              </button>
              {isAdmin && (
                <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Modo Administrador activado: Puedes saltarte la carga del comprobante para pruebas.
                </p>
              )}
            </div>

            {errorPago && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorPago}</span>
              </div>
            )}

            {/* Totales */}
            <div className="border border-border rounded-xl p-4 text-sm space-y-2 bg-background">
              <SummaryRow label="Subtotal cosecha" value={formatSoles(subtotal)} />
              <SummaryRow label={`Flete a ${dest}`} value={formatSoles(flete)} />
              <div className="border-t border-border pt-2">
                <SummaryRow label="Total a yapear" value={formatSoles(total)} bold />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaso(2)}
                className="flex-1 border border-input py-3 rounded-xl tap-target text-sm font-medium hover:bg-muted transition-colors"
                disabled={confirmandoOrden}
              >
                Atrás
              </button>
              <button
                onClick={confirmar}
                disabled={confirmandoOrden}
                className="flex-1 bg-success text-success-foreground font-bold py-3 rounded-xl tap-target hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {confirmandoOrden ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Procesando...
                  </>
                ) : (
                  "Confirmar y Yapear"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-primary" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}