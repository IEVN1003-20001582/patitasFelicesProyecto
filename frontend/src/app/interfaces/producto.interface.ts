export interface Producto {
  id?: number;
  sku: string;
  nombre: string;
  categoria: string;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
}