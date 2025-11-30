import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita } from '../interfaces/cita.interface'; // Asegúrate de tener esta interface
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private apiUrl = 'http://127.0.0.1:5000/api/citas';

  constructor(private http: HttpClient) { }


getCitas(filtros: any = {}): Observable<any> {
    let url = this.apiUrl;
    const params = [];
    
    if (filtros.mascota_id) params.push(`mascota_id=${filtros.mascota_id}`);
    if (filtros.veterinario_id) params.push(`veterinario_id=${filtros.veterinario_id}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<any>(url);
  }


  agendarCita(datos: any): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, datos);
  }


  actualizarCita(id: number, datos: any): Observable<RespuestaApi> {
     return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, datos);
  }




}