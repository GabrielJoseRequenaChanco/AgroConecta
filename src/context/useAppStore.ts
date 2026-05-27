import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Producto,
  Orden,
  Flete,
  UsuarioActivo,
  UserRole,
} from "./types";

import papaImg from "../assets/papa-nativa.jpg";
import maizImg from "../assets/maiz-blanco.jpg";
import alcachofaImg from "../assets/alcachofa.jpg";

const seedProductos: Producto[] = [
  {
    id: "p-001",
    agricultorId: "u-agr-tomas",
    nombreAgricultor: "Don Tomás Requena",
    reputacionAgricultor: 5,
    titulo: "Papa Nativa Camotillo - Cosecha Fresca",
    rubro: "Tubérculos",
    variedad: "Camotillo",
    volumenDisponible: 2500,
    precioPerKg: 1.5,
    distritoOrigen: "Aco",
    imagenUrl: papaImg,
    status: "disponible",
    fechaCosecha: "2026-05-10",
    descripcion:
      "Papa nativa variedad Camotillo, cultivada de forma tradicional a más de 3,200 m s. n. m. en el distrito de Aco, Concepción. Libre de pesticidas agresivos. Excelente tamaño y calidad para restaurantes, pollerías o minimarkets. Se vende por sacos de 50 kg o por toneladas. Contamos con acceso vehicular directo a la chacra para la carga.",
  },
  {
    id: "p-002",
    agricultorId: "u-agr-eulogio",
    nombreAgricultor: "Don Eulogio Chanco",
    reputacionAgricultor: 4.8,
    titulo: "Maíz Blanco Urubamba seleccionado",
    rubro: "Cereales",
    variedad: "Blanco Urubamba",
    volumenDisponible: 4000,
    precioPerKg: 2.2,
    distritoOrigen: "Mito",
    imagenUrl: maizImg,
    status: "disponible",
    fechaCosecha: "2026-05-05",
    descripcion:
      "Maíz blanco gigante variedad Urubamba, cosechado a mano en chacras del distrito de Mito. Grano grande, sano y bien seleccionado. Ideal para abastos, mayoristas y exportación regional. Empacado en sacos de 50 kg, listo para carga inmediata.",
  },
  {
    id: "p-003",
    agricultorId: "u-agr-sincos",
    nombreAgricultor: "Asociación Agrícola Sincos",
    reputacionAgricultor: 5,
    titulo: "Alcachofa Suprema sin espinas",
    rubro: "Hortalizas",
    variedad: "Suprema",
    volumenDisponible: 1800,
    precioPerKg: 3.0,
    distritoOrigen: "Sincos",
    imagenUrl: alcachofaImg,
    status: "disponible",
    fechaCosecha: "2026-05-15",
    descripcion:
      "Alcachofa Suprema sin espinas, cultivada por la Asociación Agrícola Sincos. Producto fresco, calibre uniforme, ideal para restaurantes y agroindustria. Disponible para entrega en Huancayo, Concepción y Jauja con transportista certificado AgroConecta.",
  },
];

const usuariosDemo: Record<UserRole, UsuarioActivo> = {
  agricultor: {
    rol: "agricultor",
    id: "u-agr-tomas",
    nombre: "Don Tomás Requena",
    telefono: "+51 964 123 456",
    ubicacion: "Aco, Concepción - Junín",
  },
  comprador: {
    rol: "comprador",
    id: "u-com-valeria",
    nombre: "Minimarket Valeria",
    telefono: "+51 984 555 121",
    ubicacion: "Huancayo - Junín",
  },
  transportista: {
    rol: "transportista",
    id: "u-tra-lucho",
    nombre: "Lucho Chanco",
    telefono: "+51 974 887 990",
    ubicacion: "Concepción - Junín",
  },
};

interface AppState {
  productos: Producto[];
  ordenes: Orden[];
  fletes: Flete[];
  usuarioActivo: UsuarioActivo;

  setRolActivo: (rol: UserRole) => void;

  addProducto: (p: Omit<Producto, "id" | "status">) => void;
  createOrden: (
    o: Omit<Orden, "id" | "status" | "transportistaId" | "nombreTransportista">,
    fleteInfo: { origen: string; destino: string; tarifa: number; descripcion: string }
  ) => string;
  aceptarFlete: (fleteId: string, transportistaId: string, nombre: string) => void;
  marcarEnTransito: (ordenId: string) => void;
  completarEntrega: (ordenId: string) => void;
  resetSeed: () => void;
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      productos: seedProductos,
      ordenes: [],
      fletes: [],
      usuarioActivo: usuariosDemo.comprador,

      setRolActivo: (rol) => set({ usuarioActivo: usuariosDemo[rol] }),

      addProducto: (p) =>
        set((s) => ({
          productos: [
            { ...p, id: uid("p"), status: "disponible" },
            ...s.productos,
          ],
        })),

      createOrden: (o, fleteInfo) => {
        const ordenId = uid("o");
        const fleteId = uid("f");
        set((s) => ({
          ordenes: [
            ...s.ordenes,
            { ...o, id: ordenId, status: "pendiente_flete" },
          ],
          productos: s.productos.map((p) =>
            p.id === o.productoId ? { ...p, status: "reservado" } : p
          ),
          fletes: [
            ...s.fletes,
            {
              id: fleteId,
              ordenId,
              origen: fleteInfo.origen,
              destino: fleteInfo.destino,
              pesoCarga: o.cantidadComprada,
              tarifaPropuesta: fleteInfo.tarifa,
              productoDescripcion: fleteInfo.descripcion,
              status: "disponible",
            },
          ],
        }));
        return ordenId;
      },

      aceptarFlete: (fleteId, transportistaId, nombre) => {
        const flete = get().fletes.find((f) => f.id === fleteId);
        if (!flete) return;
        set((s) => ({
          fletes: s.fletes.map((f) =>
            f.id === fleteId ? { ...f, status: "aceptado" } : f
          ),
          ordenes: s.ordenes.map((o) =>
            o.id === flete.ordenId
              ? {
                  ...o,
                  status: "en_transito",
                  transportistaId,
                  nombreTransportista: nombre,
                }
              : o
          ),
        }));
      },

      marcarEnTransito: (ordenId) =>
        set((s) => ({
          ordenes: s.ordenes.map((o) =>
            o.id === ordenId ? { ...o, status: "en_transito" } : o
          ),
        })),

      completarEntrega: (ordenId) => {
        const orden = get().ordenes.find((o) => o.id === ordenId);
        if (!orden) return;
        set((s) => ({
          ordenes: s.ordenes.map((o) =>
            o.id === ordenId ? { ...o, status: "entregado" } : o
          ),
          productos: s.productos.map((p) =>
            p.id === orden.productoId ? { ...p, status: "vendido" } : p
          ),
          fletes: s.fletes.map((f) =>
            f.ordenId === ordenId ? { ...f, status: "completado" } : f
          ),
        }));
      },

      resetSeed: () =>
        set({
          productos: seedProductos,
          ordenes: [],
          fletes: [],
          usuarioActivo: usuariosDemo.comprador,
        }),
    }),
    { name: "agroconecta-store" }
  )
);

export const usuariosDemoMap = usuariosDemo;
