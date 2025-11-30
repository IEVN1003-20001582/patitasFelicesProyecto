export interface DetalleFactura {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
    tipo?: 'cita' | 'vacuna' | 'producto'; // Tipo de origen
    id_origen?: number; // ID en la tabla de origen
    selected?: boolean; // Para el checkbox en el frontend
}

export interface Factura {
    id?: number;
    cliente_id: number;
    nombre_cliente?: string;
    folio_factura?: string;
    fecha_emision?: string;
    subtotal: number;
    impuestos: number;
    total: number;
    estado: 'pendiente' | 'pagada' | 'cancelada';
    metodo_pago: string;
    items?: DetalleFactura[];
    detalles?: DetalleFactura[]; // A veces viene como detalles del backend
}