export interface DetalleFactura {
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    importe: number;
    tipo?: 'cita' | 'vacuna' | 'producto';
    id_origen?: number; 
    selected?: boolean; 
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
    detalles?: DetalleFactura[]; 
}