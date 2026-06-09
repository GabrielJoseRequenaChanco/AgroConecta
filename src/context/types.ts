export type UserRole = "agricultor" | "comprador" | "transportista" | "anon";
export type AppRole = UserRole | "admin" | "demo_user";

export type ProductoStatus = "disponible" | "reservado" | "vendido";

export type OrderStatus =
  | "pendiente_flete"
  | "flete_asignado"
  | "cargando_chacra"
  | "en_transito"
  | "por_confirmar"
  | "entregado";

export type FleteStatus = "disponible" | "aceptado" | "en_ruta" | "descargado" | "completado";

export type Distrito = "Aco" | "Concepción" | "Orcotuna" | "Mito" | "Sincos" | "Huancayo" | "Lima";
export type Rubro = "Tubérculos" | "Cereales" | "Hortalizas" | "Frutas" | "Legumbres";

export interface VehiculoConfig {
  marca: string;
  modelo: string;
  tipoCarroceria: "Baranda" | "Furgón" | "Plataforma" | "Volquete";
  capacidadToneladas: number;
  placa: string;
}

export interface UsuarioActivo {
  rol: AppRole;
  id: string;
  email?: string;
  nombre: string;
  telefono: string;
  ubicacion: string;
  isMidagriVerified?: boolean;
  vehiculo?: VehiculoConfig;
  ruc?: string;
  razonSocial?: string;
}

export interface Producto {
  id: string;
  agricultorId: string;
  nombreAgricultor: string;
  telefonoAgricultor: string;
  reputacionAgricultor: number;
  isMidagriVerified: boolean;
  titulo: string;
  rubro: Rubro;
  variedad: string;
  volumenDisponible: number;
  precioPerKg: number;
  distritoOrigen: Distrito;
  imagenUrl: string;
  status: ProductoStatus;
  fechaCosecha: string;
  descripcion: string;
}

export interface Orden {
  id: string;
  fechaCreacion: string;
  productoId: string;
  tituloProducto: string;
  cantidadComprada: number;
  precioUnitario: number;
  totalPagoProducto: number;
  totalPagoFlete: number;
  status: OrderStatus;
  distritoOrigen: Distrito;
  distritoDestino: string;
  agricultorId: string;
  nombreAgricultor: string;
  telefonoAgricultor: string;
  compradorId: string;
  nombreComprador: string;
  telefonoComprador: string;
  transportistaId?: string;
  nombreTransportista?: string;
  telefonoTransportista?: string;
  vehiculoPlaca?: string;
  vehiculoDescripcion?: string;
  fechaAsignacionFlete?: string;
  fechaInicioTransito?: string;
  fechaSolicitudEntrega?: string;
  fechaCierreEfectivo?: string;
}

export interface Flete {
  id: string;
  ordenId: string;
  origen: string;
  destino: string;
  pesoCarga: number;
  tarifaPropuesta: number;
  productoDescripcion: string;
  status: FleteStatus;
  transportistaId?: string;
  nombreTransportista?: string;
  telefonoTransportista?: string;
  vehiculoPlaca?: string;
}
