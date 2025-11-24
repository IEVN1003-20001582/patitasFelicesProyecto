import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mascota } from '../interfaces/mascota.interface';
import { Historial } from '../interfaces/historial.interface';
import { Vacuna } from '../interfaces/vacuna.interface';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class MascotasService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) { }

  // --- MASCOTAS ---
  getMascotas(clienteId?: number): Observable<any> {
    let url = `${this.apiUrl}/mascotas`;
    if (clienteId) url += `?cliente_id=${clienteId}`;
    return this.http.get<any>(url);
  }

  agregarMascota(datos: Mascota): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiUrl}/mascotas`, datos);
  }

  eliminarMascota(id: number): Observable<RespuestaApi> {
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/mascotas/${id}`);
  }

  modificarMascota(id: number, datos: Mascota): Observable<RespuestaApi> {
  return this.http.put<RespuestaApi>(`${this.apiUrl}/mascotas/${id}`, datos);
}

  // --- HISTORIAL CLÍNICO ---
  getHistorial(mascotaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/historial?mascota_id=${mascotaId}`);
  }

  agregarHistorial(datos: Historial): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiUrl}/historial`, datos);
  }

  // --- VACUNAS ---
  getVacunas(mascotaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vacunas?mascota_id=${mascotaId}`);
  }

  agregarVacuna(datos: Vacuna): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(`${this.apiUrl}/vacunas`, datos);
  }
}