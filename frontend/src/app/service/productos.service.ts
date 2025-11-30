import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto } from '../interfaces/producto.interface';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private apiUrl = 'http://127.0.0.1:5000/api/productos';
   private notifUrl = 'http://127.0.0.1:5000/api/notificaciones';

  constructor(private http: HttpClient) { }

  getProductos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  agregarProducto(prod: Producto): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, prod);
  }

  actualizarProducto(id: number, prod: Producto): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, prod);
  }

  ajustarStock(id: number, nuevoStock: number): Observable<RespuestaApi> {
    return this.http.patch<RespuestaApi>(`${this.apiUrl}/${id}/stock`, { stock: nuevoStock });
  }

  eliminarProducto(id: number): Observable<RespuestaApi> {
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/${id}`);
  }


  solicitarResurtido(productoId: number, nombreProducto: string, usuarioId: number): Observable<RespuestaApi> {
    const payload = {
        usuario_id: 1, 
        titulo: 'Solicitud de Stock',
        mensaje: `El veterinario solicita resurtido urgente del producto: ${nombreProducto}`,
        tipo: 'Stock'
    };
    return this.http.post<RespuestaApi>(this.notifUrl, payload);
  }
}
