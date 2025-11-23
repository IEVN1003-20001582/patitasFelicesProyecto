import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mascota } from '../interfaces/mascota.interface';

@Injectable({
  providedIn: 'root'
})
export class MascotasService {
  // La URL de tu backend (asegúrate de que Flask esté corriendo)
  private apiUrl = 'http://127.0.0.1:5000/api/mascotas';

  constructor(private http: HttpClient) { }

  // 1. Obtener todas las mascotas
  getMascotas(): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(this.apiUrl);
  }

  // 2. Crear una mascota
  crearMascota(mascota: Mascota): Observable<any> {
    return this.http.post(this.apiUrl, mascota);
  }

  // 3. Eliminar mascota (Solo Admin)
  eliminarMascota(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  
  // 4. Filtrar por cliente (Para el portal del cliente)
  getMascotasPorCliente(clienteId: number): Observable<Mascota[]> {
    return this.http.get<Mascota[]>(`${this.apiUrl}?cliente_id=${clienteId}`);
  }
}