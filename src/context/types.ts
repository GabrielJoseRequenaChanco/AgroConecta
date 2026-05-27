export type UserRole = "agricultor" | "comprador" | "transportista";
export type ProductStatus = "disponible" | "reservado" | "vendido";
export type OrderStatus =
  | "pendiente_flete"
  | "flete_asignado"
  | "en_transito"
  | "entregado";
export type FleteStatus = "disponible" | "aceptado" | "completado";

export type Rubro = "Tubérculos" | "Hortalizas" | "Legumbres" | "Cereales";
export type Distrito = "Aco" | "Concepción" | "Orcotuna" | "Mito" | "Sincos";

export interface Producto {
  id: string;
  agricultorId: string;
  nombreAgricultor: string;
  reputacionAgricultor: number;
  titulo: string;
  rubro: Rubro;
  variedad: string;
  volumenDisponible: number; // kg
  precioPerKg: number; // S/.
  distritoOrigen: Distrito;
  imagenUrl: string;
  status: ProductStatus;
  fechaCosecha: string;
  descripcion?: string;
}

export interface Orden {
  id: string;
  productoId: string;
  tituloProducto: string;
  compradorId: string;
  nombreComprador: string;
  agricultorId: string;
  transportistaId?: string;
  nombreTransportista?: string;
  cantidadComprada: number;
  totalPagoProducto: number;
  totalPagoFlete: number;
  status: OrderStatus;
  distritoDestino: string;
  fechaCreacion: string;
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
}

export interface UsuarioActivo {
  rol: UserRole;
  id: string;
  nombre: string;
  telefono: string;
  ubicacion: string;
}
