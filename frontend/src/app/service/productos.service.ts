import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../interfaces/producto.interface';

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private apiUrl = 'http://127.0.0.1:5000/api/productos';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  getProductosBajosStock(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/bajo-stock`);
  }

  crearProducto(producto: Producto): Observable<any> {
    return this.http.post(this.apiUrl, producto);
  }
  
  actualizarStock(id: number, nuevoStock: number): Observable<any> {
      return this.http.put(`${this.apiUrl}/${id}`, { stock_actual: nuevoStock });
  }
}