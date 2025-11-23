import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cita } from '../interfaces/cita.interface';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  private apiUrl = 'http://127.0.0.1:5000/api/citas';

  constructor(private http: HttpClient) { }

  // Obtener todas (Admin)
  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.apiUrl);
  }

  // Obtener por Veterinario (Agenda Vet)
  getCitasPorVeterinario(vetId: number): Observable<Cita[]> {
    return this.http.get<Cita[]>(`${this.apiUrl}?veterinario_id=${vetId}`);
  }
  
  // Obtener por Cliente (Portal Cliente)
  // Nota: Asumiendo que el backend filtra por mascota, pero idealmente por cliente
  // Esta es una implementación simplificada
  getCitasPorMascota(mascotaId: number): Observable<Cita[]> {
      return this.http.get<Cita[]>(`${this.apiUrl}?mascota_id=${mascotaId}`);
  }

  crearCita(cita: Cita): Observable<any> {
    return this.http.post(this.apiUrl, cita);
  }
  
  actualizarEstado(id: number, estado: string): Observable<any> {
      return this.http.put(`${this.apiUrl}/${id}/estado`, { estado });
  }
}