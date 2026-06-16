export type UserRole = "agricultor" | "comprador" | "transportista" | "anon";
export type AppRole = UserRole | "admin" | "demo_user";

export type ProductoStatus = "disponible" | "reservado" | "vendido";

export type OrderStatus =
  | "PAGO_EN_CUSTODIA"
  | "EN_CAMINO"
  | "ENTREGADO"
  | "COMPLETADO"
  | "pendiente_flete"
  | "flete_asignado"
  | "cargando_origen"
  | "en_transito"
  | "por_confirmar"
  | "entregado"
  | "completado";

export type FleteStatus = "disponible" | "aceptado" | "en_ruta" | "descargado" | "completado";

export type Distrito = "Aco" | "Concepción" | "Orcotuna" | "Mito" | "Sincos" | "Huancayo" | "Lima" | "Satipo" | "Chanchamayo";
export type Rubro = "Tubérculos" | "Cereales" | "Hortalizas" | "Frutas" | "Legumbres" | "Agroindustria" | "Granos Andinos" | "Otro";

export interface VehiculoConfig {
  marca: string;
  modelo: string;
  tipoCarroceria: "Baranda" | "Furgón" | "Plataforma" | "Volquete";
  capacidadToneladas: number;
  placa: string;
}

/**
 * Payload extra que puede venir del formulario de registro antes de ser
 * normalizado al perfil definitivo. Campos opcionales usados en authSignUp.
 */
export interface RegistroPayload {
  /** DNI (agricultor/transportista, 8 dígitos) o RUC (comprador, 11 dígitos). */
  documento?: string;
  /** Nombre del local comercial o razón social del comprador. */
  local?: string;
  /** Tipo de vehículo (string crudo del select antes de parsear). */
  vehiculoTipo?: string;
  /** Capacidad de carga en toneladas (string crudo). */
  capacidad?: string;
  /** Placa del vehículo (string crudo). */
  placa?: string;
  /** Cultivos seleccionados por el agricultor. */
  cultivos?: string[];
  /** Rutas que cubre el transportista. */
  rutas?: string[];
  /** Hectáreas declaradas por el agricultor. */
  hectareas?: string;
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
  documentoUrl?: string;
  breveteUrl?: string;
  hectareas?: string;
  verificacionEstado?: "pendiente" | "aprobado" | "rechazado" | "PENDIENTE_VERIFICACION";
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
  comprobanteUrl?: string;
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
