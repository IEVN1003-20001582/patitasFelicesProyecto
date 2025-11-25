import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private apiUrl = 'http://127.0.0.1:5000/api/clientes';

  constructor(private http: HttpClient) { }

  public getClientes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  public agregarCliente(cliente: Cliente): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, cliente);
  }

  public actualizarCliente(id: number, cliente: Cliente): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, cliente);
  }

  public eliminarCliente(id: number): Observable<RespuestaApi> {
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/${id}`);
  }
}