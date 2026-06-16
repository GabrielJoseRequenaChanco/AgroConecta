import { create } from "zustand";
import type {
  AppRole,
  Distrito,
  Flete,
  FleteStatus,
  Orden,
  OrderStatus,
  Producto,
  ProductoStatus,
  RegistroPayload,
  UsuarioActivo,
  VehiculoConfig,
} from "@/context/types";
import { supabase } from "@/lib/supabase";

/**
 * Sube un archivo a un bucket específico en Supabase Storage
 * Genera un nombre único con UUID/Random para evitar colisiones
 */
export async function uploadFileToStorage(bucket: string, file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir archivo a Supabase Storage:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch (error) {
    console.error("Excepción en uploadFileToStorage:", error);
    return null;
  }
}

/**
 * Devuelve una ubicación aproximada basada en la zona horaria y el idioma
 * del navegador, sin solicitar permisos de geolocalización especiales.
 * Fallback a "Junín, Perú" si no hay señales disponibles.
 */
export function getApproxLocation(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "America/Lima") return "Perú";
    if (tz.startsWith("America/")) return "América";
    return tz.replace("_", " ") || "Junín, Perú";
  } catch {
    return "Junín, Perú";
  }
}

const anonUser: UsuarioActivo = {
  rol: "anon",
  id: "u-anon",
  nombre: "",
  telefono: "",
  ubicacion: "",
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface AppState {
  productos: Producto[];
  ordenes: Orden[];
  fletes: Flete[];
  usuarioActivo: UsuarioActivo;
  users: UsuarioActivo[];

  registerUser: (rol: AppRole, payload: Partial<UsuarioActivo>) => Promise<UsuarioActivo | null>;
  loginUser: (userId: string) => Promise<void>;
  logout: () => void;
  verifyUser: (userId: string) => Promise<void>;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  updateUserProfile: (userId: string, patch: Partial<UsuarioActivo>) => Promise<void>;
  authSignUp: (email: string, password: string, rol: AppRole, payload?: Partial<UsuarioActivo> & RegistroPayload) => Promise<{ profile: UsuarioActivo | null; error: string | null }>;
  authSignIn: (email: string, password: string) => Promise<UsuarioActivo | null>;
  authSignOut: () => Promise<void>;
  addProducto: (p: Omit<Producto, "id" | "status" | "agricultorId" | "nombreAgricultor" | "telefonoAgricultor" | "reputacionAgricultor" | "isMidagriVerified">) => Promise<Producto | null>;
  updateProducto: (productoId: string, patch: Partial<Pick<Producto, "titulo" | "rubro" | "variedad" | "volumenDisponible" | "precioPerKg" | "distritoOrigen" | "fechaCosecha" | "imagenUrl" | "descripcion">>) => Promise<void>;
  desactivarProducto: (productoId: string) => Promise<void>;
  eliminarProducto: (productoId: string) => Promise<void>;
  createOrden: (
    o: {
      productoId: string;
      tituloProducto: string;
      cantidadComprada: number;
      precioUnitario: number;
      totalPagoProducto: number;
      totalPagoFlete: number;
      distritoOrigen: Distrito;
      distritoDestino: string;
      agricultorId: string;
      nombreAgricultor: string;
      telefonoAgricultor: string;
      comprobanteUrl: string;
    },
    fleteInfo: { origen: string; destino: string; tarifa: number; descripcion: string }
  ) => Promise<string | null>;
  aceptarFlete: (fleteId: string, transportistaId: string, nombre: string, telefono: string, vehiculo: VehiculoConfig) => Promise<void>;
  marcarCargandoEnChacra: (ordenId: string) => Promise<void>;
  marcarEnTransito: (ordenId: string) => Promise<void>;
  solicitarConfirmacionEntrega: (ordenId: string) => Promise<void>;
  completarEntrega: (ordenId: string) => Promise<void>;
  liquidarOrden: (ordenId: string) => Promise<void>;
  resetStore: () => void;
}

export const useAppStore = create<AppState>()((set, get) => {
  const initialState = {
    productos: [] as Producto[],
    ordenes: [] as Orden[],
    fletes: [] as Flete[],
    usuarioActivo: anonUser,
    users: [] as UsuarioActivo[],
  };

  const store = {
    ...initialState,

    registerUser: async (rol: AppRole, payload: Partial<UsuarioActivo>) => {
      const newUser: UsuarioActivo = {
        rol,
        id: uid("u"),
        email: payload.email,
        nombre: payload.nombre || "",
        telefono: payload.telefono || "",
        ubicacion: payload.ubicacion || "",
        isMidagriVerified: payload.isMidagriVerified || false,
        vehiculo: payload.vehiculo,
        ruc: payload.ruc,
        razonSocial: payload.razonSocial,
        documentoUrl: payload.documentoUrl,
        breveteUrl: payload.breveteUrl,
        verificacionEstado: payload.verificacionEstado || "PENDIENTE_VERIFICACION",
      };

      try {
        const { error } = await supabase.from("users").insert([
          {
            id: newUser.id,
            rol: newUser.rol,
            email: newUser.email || null,
            nombre: newUser.nombre,
            telefono: newUser.telefono,
            ubicacion: newUser.ubicacion,
            is_midagri_verified: newUser.isMidagriVerified || false,
            vehiculo: newUser.vehiculo ? JSON.stringify(newUser.vehiculo) : null,
            ruc: newUser.ruc || null,
            razon_social: newUser.razonSocial || null,
            documento_url: newUser.documentoUrl || null,
            brevete_url: newUser.breveteUrl || null,
            verificacion_estado: newUser.verificacionEstado || "PENDIENTE_VERIFICACION",
          },
        ]);
        if (error) {
          console.error("Error inserting user to Supabase:", error);
          return null;
        }
      } catch (err) {
        console.error("Supabase insert user error:", err);
        return null;
      }

      set((s) => ({ users: [newUser, ...s.users], usuarioActivo: newUser }));
      return newUser;
    },

    loginUser: async (userId: string) => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
        if (!error && data) {
          const fetched: UsuarioActivo = {
            id: data.id,
            rol: data.rol,
            email: data.email || undefined,
            nombre: data.nombre || "",
            telefono: data.telefono || "",
            ubicacion: data.ubicacion || "",
            isMidagriVerified: data.is_midagri_verified || false,
            vehiculo: data.vehiculo || undefined,
            ruc: data.ruc || undefined,
            razonSocial: data.razon_social || undefined,
            documentoUrl: data.documento_url || undefined,
            breveteUrl: data.brevete_url || undefined,
            verificacionEstado: data.verificacion_estado || undefined,
          };
          set(() => ({ usuarioActivo: fetched } as any));
          return;
        }
      } catch (err) {
        console.error("Supabase login fetch error:", err);
      }
      set({ usuarioActivo: anonUser });
    },

    logout: () => {
      supabase.auth.signOut().catch((err) => console.error("Auth logout error:", err));
      set({ usuarioActivo: anonUser });
    },

    verifyUser: async (userId: string) => {
      try {
        const { error } = await supabase.from("users").update({ is_midagri_verified: true, verificacion_estado: "aprobado" }).eq("id", userId);
        if (error) {
          console.error("Error updating user verification:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase verify error:", err);
      }
      set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, isMidagriVerified: true, verificacionEstado: "aprobado" } : u)) }));
    },

    approveUser: async (userId: string) => {
      try {
        const { error } = await supabase
          .from("users")
          .update({ is_midagri_verified: true, verificacion_estado: "aprobado" })
          .eq("id", userId);
        if (error) {
          console.error("Error approving user:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase approve error:", err);
      }
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, isMidagriVerified: true, verificacionEstado: "aprobado" } : u
        ),
        usuarioActivo:
          s.usuarioActivo.id === userId
            ? { ...s.usuarioActivo, isMidagriVerified: true, verificacionEstado: "aprobado" }
            : s.usuarioActivo,
      }));
    },

    rejectUser: async (userId: string) => {
      try {
        const { error } = await supabase
          .from("users")
          .update({ is_midagri_verified: false, verificacion_estado: "rechazado" })
          .eq("id", userId);
        if (error) {
          console.error("Error rejecting user:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase reject error:", err);
      }
      set((s) => ({
        users: s.users.map((u) =>
          u.id === userId ? { ...u, isMidagriVerified: false, verificacionEstado: "rechazado" } : u
        ),
        usuarioActivo:
          s.usuarioActivo.id === userId
            ? { ...s.usuarioActivo, isMidagriVerified: false, verificacionEstado: "rechazado" }
            : s.usuarioActivo,
      }));
    },

    updateUserProfile: async (userId: string, patch: Partial<UsuarioActivo>) => {
      try {
        const dbPatch: Record<string, any> = {
          nombre: patch.nombre,
          telefono: patch.telefono,
          ubicacion: patch.ubicacion,
          is_midagri_verified: patch.isMidagriVerified,
          vehiculo: patch.vehiculo ? JSON.stringify(patch.vehiculo) : patch.vehiculo === null ? null : undefined,
          ruc: patch.ruc,
          razon_social: patch.razonSocial,
          email: patch.email,
          documento_url: patch.documentoUrl,
          brevete_url: patch.breveteUrl,
          verificacion_estado: patch.verificacionEstado,
        };
        Object.keys(dbPatch).forEach((key) => dbPatch[key] === undefined && delete dbPatch[key]);

        const { error } = await supabase.from("users").update(dbPatch).eq("id", userId);
        if (error) {
          console.error("Error updating user profile:", error);
        }
      } catch (err) {
        console.error("Supabase update user error:", err);
      }

      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
        usuarioActivo: s.usuarioActivo.id === userId ? { ...s.usuarioActivo, ...patch } : s.usuarioActivo,
      }));
    },

    authSignUp: async (email: string, password: string, rol: AppRole, payload?: Partial<UsuarioActivo> & RegistroPayload) => {
      try {
        if (!email.includes("@")) {
          return { profile: null, error: "El correo electrónico no es válido (debe contener '@')." };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: rol || "comprador",
              nombre: payload?.nombre || "",
              ubicacion: payload?.ubicacion || "",
            },
          },
        });

        if (error) {
          console.error("Auth signUp error:", error);
          let friendlyMsg = error.message;
          if (error.message.includes("User already registered") || error.status === 422) {
            friendlyMsg = "El correo electrónico ya está registrado.";
          } else if (error.message.includes("should be at least")) {
            friendlyMsg = "La contraseña es muy corta. Debe tener al menos 6 caracteres.";
          }
          return { profile: null, error: friendlyMsg };
        }

        const user = data?.user;
        if (!user) {
          return { profile: null, error: "No se pudo crear la cuenta de usuario." };
        }

        let vehiculoObj: VehiculoConfig | undefined = undefined;
        if (payload?.vehiculo && typeof payload.vehiculo === "object") {
          vehiculoObj = payload.vehiculo;
        } else if (payload?.vehiculoTipo) {
          vehiculoObj = {
            marca: "Genérico",
            modelo: payload.vehiculoTipo,
            tipoCarroceria: payload.vehiculoTipo.includes("Furgón") ? "Furgón" : "Baranda",
            capacidadToneladas: Number(payload.capacidad) || 0,
            placa: payload.placa || "REG-123",
          };
        }

        const profile: UsuarioActivo = {
          id: user.id,
          rol,
          email,
          nombre: payload?.nombre || "",
          telefono: payload?.telefono || "",
          ubicacion: payload?.ubicacion || "",
          isMidagriVerified: payload?.isMidagriVerified || false,
          vehiculo: vehiculoObj,
          ruc: payload?.ruc || payload?.documento || undefined,
          razonSocial: payload?.razonSocial || payload?.local || undefined,
          documentoUrl: payload?.documentoUrl || undefined,
          breveteUrl: payload?.breveteUrl || undefined,
          verificacionEstado: payload?.verificacionEstado || "PENDIENTE_VERIFICACION",
        };

        try {
          const { error: upsertErr } = await supabase.from("users").upsert([
            {
              id: profile.id,
              rol: profile.rol,
              email: profile.email || null,
              nombre: profile.nombre,
              telefono: profile.telefono,
              ubicacion: profile.ubicacion,
              is_midagri_verified: profile.isMidagriVerified || false,
              vehiculo: profile.vehiculo ? JSON.stringify(profile.vehiculo) : null,
              ruc: profile.ruc || null,
              razon_social: profile.razonSocial || null,
              documento_url: profile.documentoUrl || null,
              brevete_url: profile.breveteUrl || null,
              verificacion_estado: profile.verificacionEstado || "PENDIENTE_VERIFICACION",
            },
          ]);
          if (upsertErr) {
            console.error("Error upserting profile:", upsertErr);
            return { profile: null, error: "Error al registrar el perfil en la base de datos: " + upsertErr.message };
          }
        } catch (err: any) {
          console.error("Supabase upsert profile error:", err);
          return { profile: null, error: "Error de conexión al registrar el perfil en la base de datos." };
        }

        // Fricción Cero: Autenticar inmediatamente en el estado del frontend sin requerir verificación por correo
        set((s) => ({ users: [profile, ...s.users], usuarioActivo: profile }));
        return { profile, error: null };
      } catch (err: any) {
        console.error("authSignUp error:", err);
        return { profile: null, error: err?.message || "Ocurrió un error inesperado al registrar la cuenta." };
      }
    },

    authSignIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("Auth signIn error:", error);
          return null;
        }
        const user = data?.user;
        if (!user) return null;

        try {
          const { data: profileData, error: pErr } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
          if (!pErr && profileData) {
            const profile: UsuarioActivo = {
              id: profileData.id,
              rol: profileData.rol,
              email: profileData.email || undefined,
              nombre: profileData.nombre || "",
              telefono: profileData.telefono || "",
              ubicacion: profileData.ubicacion || "",
              isMidagriVerified: profileData.is_midagri_verified || false,
              vehiculo: profileData.vehiculo || undefined,
              ruc: profileData.ruc || undefined,
              razonSocial: profileData.razon_social || undefined,
              documentoUrl: profileData.documento_url || undefined,
              breveteUrl: profileData.brevete_url || undefined,
              verificacionEstado: profileData.verificacion_estado || undefined,
            };
            set(() => ({ usuarioActivo: profile } as any));
            return profile;
          }
        } catch (err) {
          console.error("Error fetching profile after signIn:", err);
        }

        return null;
      } catch (err) {
        console.error("authSignIn error:", err);
        return null;
      }
    },

    authSignOut: async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Error signing out:", err);
      }
      set({ usuarioActivo: anonUser });
    },

    addProducto: async (p: Omit<Producto, "id" | "status" | "agricultorId" | "nombreAgricultor" | "telefonoAgricultor" | "reputacionAgricultor" | "isMidagriVerified">) => {
      const usuario = get().usuarioActivo;
      if (usuario.rol === "anon") return null;

      const nuevoProducto: Producto = {
        id: uid("p"),
        titulo: p.titulo,
        rubro: p.rubro,
        variedad: p.variedad,
        volumenDisponible: p.volumenDisponible,
        precioPerKg: p.precioPerKg,
        distritoOrigen: p.distritoOrigen,
        imagenUrl: p.imagenUrl,
        status: "disponible",
        fechaCosecha: p.fechaCosecha,
        descripcion: p.descripcion,
        agricultorId: usuario.id,
        nombreAgricultor: usuario.nombre,
        telefonoAgricultor: usuario.telefono,
        reputacionAgricultor: usuario.isMidagriVerified ? 5.0 : 4.0,
        isMidagriVerified: usuario.isMidagriVerified || false,
      };

      try {
        const { error } = await supabase.from("productos").insert([{
          id: nuevoProducto.id,
          agricultor_id: nuevoProducto.agricultorId,
          nombre_agricultor: nuevoProducto.nombreAgricultor,
          telefono_agricultor: nuevoProducto.telefonoAgricultor,
          reputacion_agricultor: nuevoProducto.reputacionAgricultor,
          is_midagri_verified: nuevoProducto.isMidagriVerified,
          titulo: nuevoProducto.titulo,
          rubro: nuevoProducto.rubro,
          variedad: nuevoProducto.variedad,
          volumen_disponible: nuevoProducto.volumenDisponible,
          precio_per_kg: nuevoProducto.precioPerKg,
          distrito_origen: nuevoProducto.distritoOrigen,
          imagen_url: nuevoProducto.imagenUrl,
          status: nuevoProducto.status,
          fecha_cosecha: nuevoProducto.fechaCosecha,
          descripcion: nuevoProducto.descripcion,
        }]);
        if (error) {
          console.error("Error inserting producto:", error);
          return null;
        }
      } catch (err) {
        console.error("Supabase insert producto error:", err);
        return null;
      }

      set((s) => ({ productos: [nuevoProducto, ...s.productos] }));
      return nuevoProducto;
    },

    updateProducto: async (productoId: string, patch: Partial<Pick<Producto, "titulo" | "rubro" | "variedad" | "volumenDisponible" | "precioPerKg" | "distritoOrigen" | "fechaCosecha" | "imagenUrl" | "descripcion">>) => {
      try {
        // Construir el objeto con nombres de columnas de Supabase (snake_case)
        const dbPatch: Record<string, unknown> = {};
        if (patch.titulo !== undefined) dbPatch.titulo = patch.titulo;
        if (patch.rubro !== undefined) dbPatch.rubro = patch.rubro;
        if (patch.variedad !== undefined) dbPatch.variedad = patch.variedad;
        if (patch.volumenDisponible !== undefined) dbPatch.volumen_disponible = patch.volumenDisponible;
        if (patch.precioPerKg !== undefined) dbPatch.precio_per_kg = patch.precioPerKg;
        if (patch.distritoOrigen !== undefined) dbPatch.distrito_origen = patch.distritoOrigen;
        if (patch.fechaCosecha !== undefined) dbPatch.fecha_cosecha = patch.fechaCosecha;
        if (patch.imagenUrl !== undefined) dbPatch.imagen_url = patch.imagenUrl;
        if (patch.descripcion !== undefined) dbPatch.descripcion = patch.descripcion;

        const { error } = await supabase
          .from("productos")
          .update(dbPatch)
          .eq("id", productoId);

        if (error) {
          console.error("Error updating producto:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase update producto error:", err);
        return;
      }
      // Actualizar en el store local
      set((s) => ({
        productos: s.productos.map((p) =>
          p.id === productoId ? { ...p, ...patch } : p
        ),
      }));
    },

    desactivarProducto: async (productoId: string) => {
      try {
        // Cambiar el status a 'vendido' equivale a desactivarlo del catálogo
        const { error } = await supabase
          .from("productos")
          .update({ status: "vendido" })
          .eq("id", productoId);

        if (error) {
          console.error("Error desactivando producto:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase desactivar producto error:", err);
        return;
      }
      // Reflejar en el store local
      set((s) => ({
        productos: s.productos.map((p) =>
          p.id === productoId ? { ...p, status: "vendido" as const } : p
        ),
      }));
    },

    eliminarProducto: async (productoId: string) => {
      try {
        const { error } = await supabase.from("productos").delete().eq("id", productoId);
        if (error) {
          console.error("Error deleting producto:", error);
          return;
        }
      } catch (err) {
        console.error("Supabase delete producto error:", err);
      }
      set((s) => ({ productos: s.productos.filter((p) => p.id !== productoId) }));
    },

    createOrden: async (
      o: {
        productoId: string;
        tituloProducto: string;
        cantidadComprada: number;
        precioUnitario: number;
        totalPagoProducto: number;
        totalPagoFlete: number;
        distritoOrigen: Distrito;
        distritoDestino: string;
        agricultorId: string;
        nombreAgricultor: string;
        telefonoAgricultor: string;
        comprobanteUrl: string;
      },
      fleteInfo: { origen: string; destino: string; tarifa: number; descripcion: string }
    ) => {
      const ordenId = uid("o");
      const fleteId = uid("f");
      const comprador = get().usuarioActivo;

      const nuevaOrden: Orden = {
        id: ordenId,
        fechaCreacion: new Date().toISOString(),
        productoId: o.productoId,
        tituloProducto: o.tituloProducto,
        cantidadComprada: o.cantidadComprada,
        precioUnitario: o.precioUnitario,
        totalPagoProducto: o.totalPagoProducto,
        totalPagoFlete: o.totalPagoFlete,
        status: "PAGO_EN_CUSTODIA",
        distritoOrigen: o.distritoOrigen,
        distritoDestino: o.distritoDestino,
        agricultorId: o.agricultorId,
        nombreAgricultor: o.nombreAgricultor,
        telefonoAgricultor: o.telefonoAgricultor,
        compradorId: comprador.id,
        nombreComprador: comprador.nombre,
        telefonoComprador: comprador.telefono,
        comprobanteUrl: o.comprobanteUrl,
      };

      const nuevoFlete: Flete = {
        id: fleteId,
        ordenId,
        origen: fleteInfo.origen,
        destino: fleteInfo.destino,
        pesoCarga: o.cantidadComprada,
        tarifaPropuesta: fleteInfo.tarifa,
        productoDescripcion: fleteInfo.descripcion,
        status: "disponible",
      };

      try {
        const { error: ordenError } = await supabase.from("ordenes").insert([{
          id: nuevaOrden.id,
          fecha_creacion: nuevaOrden.fechaCreacion,
          producto_id: nuevaOrden.productoId,
          titulo_producto: nuevaOrden.tituloProducto,
          cantidad_comprada: nuevaOrden.cantidadComprada,
          precio_unitario: nuevaOrden.precioUnitario,
          total_pago_producto: nuevaOrden.totalPagoProducto,
          total_pago_flete: nuevaOrden.totalPagoFlete,
          status: nuevaOrden.status,
          distrito_origen: nuevaOrden.distritoOrigen,
          distrito_destino: nuevaOrden.distritoDestino,
          agricultor_id: nuevaOrden.agricultorId,
          nombre_agricultor: nuevaOrden.nombreAgricultor,
          telefono_agricultor: nuevaOrden.telefonoAgricultor,
          comprador_id: nuevaOrden.compradorId,
          nombre_comprador: nuevaOrden.nombreComprador,
          telefono_comprador: nuevaOrden.telefonoComprador,
          comprobante_url: nuevaOrden.comprobanteUrl,
        }]);
        if (ordenError) throw ordenError;

        const { error: fleteError } = await supabase.from("fletes").insert([{
          id: nuevoFlete.id,
          orden_id: nuevoFlete.ordenId,
          origen: nuevoFlete.origen,
          destino: nuevoFlete.destino,
          peso_carga: nuevoFlete.pesoCarga,
          tarifa_propuesta: nuevoFlete.tarifaPropuesta,
          producto_descripcion: nuevoFlete.productoDescripcion,
          status: nuevoFlete.status,
        }]);
        if (fleteError) throw fleteError;

        const { error: productoStatusError } = await supabase.from("productos").update({ status: "reservado" }).eq("id", o.productoId);
        if (productoStatusError) {
          console.error("Error updating producto status:", productoStatusError);
        }
      } catch (err) {
        console.error("Error creating order/flete in Supabase:", err);
      }

      set((s) => ({
        ordenes: [...s.ordenes, nuevaOrden],
        fletes: [...s.fletes, nuevoFlete],
        productos: s.productos.map((p) => (p.id === o.productoId ? { ...p, status: "reservado" } : p)),
      }));

      return ordenId;
    },

    aceptarFlete: async (
      fleteId: string,
      transportistaId: string,
      nombre: string,
      telefono: string,
      vehiculo: VehiculoConfig
    ) => {
      const flete = get().fletes.find((f) => f.id === fleteId);
      if (!flete) return;

      const updatesForFlete = {
        status: "aceptado" as FleteStatus,
        transportistaId,
        nombreTransportista: nombre,
        telefonoTransportista: telefono,
        vehiculoPlaca: vehiculo.placa,
      };

      const updatesForOrden = {
        status: "EN_CAMINO" as OrderStatus,
        transportistaId,
        nombreTransportista: nombre,
        telefonoTransportista: telefono,
        vehiculoPlaca: vehiculo.placa,
        vehiculoDescripcion: `${vehiculo.marca} ${vehiculo.modelo}`,
        fechaAsignacionFlete: new Date().toISOString(),
      };

      try {
        const { error: fleteErr } = await supabase.from("fletes").update({
          status: updatesForFlete.status,
          transportista_id: updatesForFlete.transportistaId,
          nombre_transportista: updatesForFlete.nombreTransportista,
          telefono_transportista: updatesForFlete.telefonoTransportista,
          vehiculo_placa: updatesForFlete.vehiculoPlaca,
        }).eq("id", fleteId);
        if (fleteErr) throw fleteErr;

        const { error: ordenErr } = await supabase.from("ordenes").update({
          status: updatesForOrden.status,
          transportista_id: updatesForOrden.transportistaId,
          nombre_transportista: updatesForOrden.nombreTransportista,
          telefono_transportista: updatesForOrden.telefonoTransportista,
          vehiculo_placa: updatesForOrden.vehiculoPlaca,
          vehiculo_descripcion: updatesForOrden.vehiculoDescripcion,
          fecha_asignacion_flete: updatesForOrden.fechaAsignacionFlete,
        }).eq("id", flete.ordenId);
        if (ordenErr) throw ordenErr;
      } catch (err) {
        console.error("Error updating flete/orden in Supabase:", err);
      }

      set((s) => ({
        fletes: s.fletes.map((f) => (f.id === fleteId ? { ...f, ...updatesForFlete } : f)),
        ordenes: s.ordenes.map((o) => (o.id === flete.ordenId ? { ...o, ...updatesForOrden } : o)),
      }));
    },

    marcarCargandoEnChacra: async (ordenId: string) => {
      try {
        const { error } = await supabase.from("ordenes").update({ status: "cargando_origen" }).eq("id", ordenId);
        if (error) console.error("Error updating orden status:", error);
      } catch (err) {
        console.error("Supabase update orden error:", err);
      }
      set((s) => ({
        ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, status: "cargando_origen" as OrderStatus } : o)),
      }));
    },

    marcarEnTransito: async (ordenId: string) => {
      try {
        const { error: ordenErr } = await supabase.from("ordenes").update({ status: "en_transito", fecha_inicio_transito: new Date().toISOString() }).eq("id", ordenId);
        if (ordenErr) console.error("Error updating orden status to en_transito:", ordenErr);
        const { error: fleteErr } = await supabase.from("fletes").update({ status: "en_ruta" }).eq("orden_id", ordenId);
        if (fleteErr) console.error("Error updating flete status to en_ruta:", fleteErr);
      } catch (err) {
        console.error("Supabase update transito error:", err);
      }
      set((s) => ({
        ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, status: "en_transito", fechaInicioTransito: new Date().toISOString() } : o)),
        fletes: s.fletes.map((f) => (f.ordenId === ordenId ? { ...f, status: "en_ruta" } : f)),
      }));
    },

    solicitarConfirmacionEntrega: async (ordenId: string) => {
      try {
        const { error: ordenErr } = await supabase.from("ordenes").update({ status: "ENTREGADO", fecha_solicitud_entrega: new Date().toISOString() }).eq("id", ordenId);
        if (ordenErr) console.error("Error updating orden status to ENTREGADO:", ordenErr);
        const { error: fleteErr } = await supabase.from("fletes").update({ status: "descargado" }).eq("orden_id", ordenId);
        if (fleteErr) console.error("Error updating flete status to descargado:", fleteErr);
      } catch (err) {
        console.error("Supabase update confirmacion error:", err);
      }
      set((s) => ({
        ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, status: "ENTREGADO", fechaSolicitudEntrega: new Date().toISOString() } : o)),
        fletes: s.fletes.map((f) => (f.ordenId === ordenId ? { ...f, status: "descargado" } : f)),
      }));
    },

    completarEntrega: async (ordenId: string) => {
      const orden = get().ordenes.find((o) => o.id === ordenId);
      if (!orden) return;
      try {
        const { error: ordenErr } = await supabase.from("ordenes").update({ status: "ENTREGADO", fecha_cierre_efectivo: new Date().toISOString() }).eq("id", ordenId);
        if (ordenErr) console.error("Error updating orden status to ENTREGADO:", ordenErr);
        const { error: fleteErr } = await supabase.from("fletes").update({ status: "completado" }).eq("orden_id", ordenId);
        if (fleteErr) console.error("Error updating flete status to completado:", fleteErr);
        const { error: productoErr } = await supabase.from("productos").update({ status: "vendido" }).eq("id", orden.productoId);
        if (productoErr) console.error("Error updating producto status to vendido:", productoErr);
      } catch (err) {
        console.error("Supabase complete delivery error:", err);
      }
      set((s) => ({
        ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, status: "ENTREGADO", fechaCierreEfectivo: new Date().toISOString() } : o)),
        fletes: s.fletes.map((f) => (f.ordenId === ordenId ? { ...f, status: "completado" } : f)),
        productos: s.productos.map((p) => (p.id === orden.productoId ? { ...p, status: "vendido" } : p)),
      }));
    },

    liquidarOrden: async (ordenId: string) => {
      const orden = get().ordenes.find((o) => o.id === ordenId);
      if (!orden) return;
      try {
        const { error: ordenErr } = await supabase
          .from("ordenes")
          .update({ status: "COMPLETADO", fecha_cierre_efectivo: new Date().toISOString() })
          .eq("id", ordenId);
        if (ordenErr) throw ordenErr;

        const { error: fleteErr } = await supabase
          .from("fletes")
          .update({ status: "completado" })
          .eq("orden_id", ordenId);
        if (fleteErr) throw fleteErr;

        const { error: prodErr } = await supabase
          .from("productos")
          .update({ status: "vendido" })
          .eq("id", orden.productoId);
        if (prodErr) throw prodErr;
      } catch (err) {
        console.error("Error liquidating order in Supabase:", err);
      }

      set((s) => ({
        ordenes: s.ordenes.map((o) => (o.id === ordenId ? { ...o, status: "COMPLETADO", fechaCierreEfectivo: new Date().toISOString() } : o)),
        fletes: s.fletes.map((f) => (f.ordenId === ordenId ? { ...f, status: "completado" } : f)),
        productos: s.productos.map((p) => (p.id === orden.productoId ? { ...p, status: "vendido" } : p)),
      }));
    },

    resetStore: () => set({ productos: [], ordenes: [], fletes: [], usuarioActivo: anonUser, users: [] }),
  };

  (async () => {
    try {
      const [{ data: productosData, error: pErr }, { data: ordenesData, error: oErr }, { data: fletesData, error: fErr }, { data: usersData, error: uErr }, { data: sessionData, error: sessionErr }] = await Promise.all([
        supabase.from("productos").select("*"),
        supabase.from("ordenes").select("*"),
        supabase.from("fletes").select("*"),
        supabase.from("users").select("*"),
        supabase.auth.getSession(),
      ]);

      if (!pErr && productosData) {
        set(() => ({ productos: productosData as Producto[] }));
      }
      if (!oErr && ordenesData) {
        set(() => ({ ordenes: ordenesData as Orden[] }));
      }
      if (!fErr && fletesData) {
        set(() => ({ fletes: fletesData as Flete[] }));
      }
      if (!uErr && usersData) {
        const mapped = (usersData as any[]).map((d) => ({
          id: d.id,
          rol: d.rol,
          email: d.email || undefined,
          nombre: d.nombre || "",
          telefono: d.telefono || "",
          ubicacion: d.ubicacion || "",
          isMidagriVerified: d.is_midagri_verified || false,
          vehiculo: d.vehiculo || undefined,
          ruc: d.ruc || undefined,
          razonSocial: d.razon_social || undefined,
          documentoUrl: d.documento_url || undefined,
          breveteUrl: d.brevete_url || undefined,
          verificacionEstado: d.verificacion_estado || undefined,
        }));
        set(() => ({ users: mapped }));

        if (!sessionErr && sessionData?.session?.user) {
          const sessionUserId = sessionData.session.user.id;
          const profile = mapped.find((m) => m.id === sessionUserId);
          if (profile) {
            set(() => ({ usuarioActivo: profile } as any));
          }
        }
      }
    } catch (err) {
      console.error("Error loading initial data from Supabase:", err);
    }
  })();

  return store;
});
