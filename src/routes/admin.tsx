import { createFileRoute } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ShieldCheck, UserCheck, UserX, Clock, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

function Admin() {
  const usuario = useAppStore((s) => s.usuarioActivo);
  const users = useAppStore((s) => s.users).filter(u => u.rol !== "anon");
  const approveUser = useAppStore((s) => s.approveUser);
  const rejectUser = useAppStore((s) => s.rejectUser);
  const router = useRouter();
  const [tab, setTab] = useState<"pendientes" | "aprobados" | "todos">("pendientes");

  useEffect(() => {
    if (usuario.rol !== "admin") {
      router.navigate({ to: "/registro" as any });
    }
  }, [usuario, router]);

  const handleApprove = async (userId: string, userName: string) => {
    await approveUser(userId);
    toast.success(`Cuenta de ${userName} aprobada con éxito.`, {
      description: "Se ha activado el Sello de Confianza.",
    });
  };

  const handleReject = async (userId: string, userName: string) => {
    await rejectUser(userId);
    toast.warning(`Solicitud de ${userName} rechazada.`);
  };

  // Filter users based on tab
  const pendientes = users.filter(u => u.verificacionEstado === "pendiente" || (!u.isMidagriVerified && u.documentoUrl));
  const aprobados = users.filter(u => u.verificacionEstado === "aprobado" || u.isMidagriVerified);
  
  const filteredUsers = 
    tab === "pendientes" ? pendientes :
    tab === "aprobados" ? aprobados : users;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground font-title">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Panel de Control del Staff
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mesa de aprobación de documentos de identidad y Sello de Confianza
          </p>
        </div>
        <span className="text-xs font-semibold bg-[#f5f3f0] px-3 py-1.5 rounded-full border border-border/40 text-foreground">
          Sesión: {usuario.nombre || "Mesa de Control"} (Staff)
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border/60 pb-px">
        <button
          onClick={() => setTab("pendientes")}
          className={`pb-3 text-sm font-semibold relative px-2 transition-all bg-transparent border-none cursor-pointer ${
            tab === "pendientes" ? "text-primary border-b-2 border-primary!" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pendientes de Aprobación
          {pendientes.length > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("aprobados")}
          className={`pb-3 text-sm font-semibold relative px-2 transition-all bg-transparent border-none cursor-pointer ${
            tab === "aprobados" ? "text-primary border-b-2 border-primary!" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Cuentas Verificadas
        </button>
        <button
          onClick={() => setTab("todos")}
          className={`pb-3 text-sm font-semibold relative px-2 transition-all bg-transparent border-none cursor-pointer ${
            tab === "todos" ? "text-primary border-b-2 border-primary!" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos los Usuarios
        </button>
      </div>

      {/* Content */}
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center justify-center">
            <Clock className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-foreground">No hay solicitudes en esta sección</p>
            <p className="text-xs text-muted-foreground/75 mt-0.5">El sistema se encuentra al día.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3 pt-1">Usuario / Razón Social</th>
                  <th className="pb-3 pt-1">Rol</th>
                  <th className="pb-3 pt-1">Ubicación</th>
                  <th className="pb-3 pt-1">Documento (RUC/DNI)</th>
                  <th className="pb-3 pt-1">Adjunto Cargado</th>
                  <th className="pb-3 pt-1 text-right">Acciones de Verificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredUsers.map((u) => {
                  const hasAttachment = !!u.documentoUrl;
                  const isPending = u.verificacionEstado === "pendiente" || (!u.isMidagriVerified && hasAttachment);
                  
                  return (
                    <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-4 font-bold text-foreground">
                        {u.nombre || u.id}
                        {u.razonSocial && <span className="block text-xs font-normal text-muted-foreground">{u.razonSocial}</span>}
                      </td>
                      <td className="py-4 capitalize">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.rol === "agricultor" ? "bg-success/10 text-success" :
                          u.rol === "transportista" ? "bg-amber-800/10 text-amber-800" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">{u.ubicacion || "No declarada"}</td>
                      <td className="py-4 font-mono text-xs">{u.ruc || u.documentoUrl ? (u.ruc || "Registrado") : "N/A"}</td>
                      <td className="py-4">
                        {hasAttachment ? (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]" title={u.documentoUrl}>{u.documentoUrl}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ninguno</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {isPending ? (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleReject(u.id, u.nombre)}
                              className="px-3 py-1.5 text-xs font-semibold border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleApprove(u.id, u.nombre)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-success hover:opacity-90 rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              Aprobar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-xs text-success font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            Verificado
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
