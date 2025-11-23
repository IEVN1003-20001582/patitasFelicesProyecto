export interface DetalleFactura {
  producto_id?: number;
  concepto: string;
  cantidad: number;
  precio: number;
}

export interface Factura {
  id?: number;
  cliente_id: number;
  fecha?: string;
  total: number;
  estado: 'Pagada' | 'Pendiente';
  items?: DetalleFactura[]; // Lista de cosas compradas
  cliente_nombre?: string; // Para mostrar en la tabla
}