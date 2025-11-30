import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Factura } from '../interfaces/factura.interface';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class FacturasService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) { }

  getFacturas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/facturas`);
  }

  crearFactura(factura: Factura): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiUrl}/facturas`, factura);
  }

  marcarPagada(id: number): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/facturas/${id}/pagar`, {});
  }


  getCargosPendientes(clienteId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cargos-pendientes/${clienteId}`);
  }
}