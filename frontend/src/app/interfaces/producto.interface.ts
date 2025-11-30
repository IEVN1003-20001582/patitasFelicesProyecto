export interface Producto {
  id?: number;
  categoria_id: number;
  categoria_nombre?: string; // Viene del JOIN
  nombre: string;
  descripcion?: string;
  sku?: string;
  proveedor?: string;
  precio_costo?: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  imagen_url?: string;
  estado?: 'En Stock' | 'Stock Bajo' | 'Agotado';
}