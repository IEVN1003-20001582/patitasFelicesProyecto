import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VeterinariosService {
  private apiUrl = 'http://127.0.0.1:5000/api/veterinarios';

  constructor(private http: HttpClient) { }

  getVeterinarios(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  agregarVeterinario(vet: Veterinario): Observable<RespuestaApi> {
    return this.http.post<RespuestaApi>(this.apiUrl, vet);
  }

  actualizarVeterinario(id: number, vet: Veterinario): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}`, vet);
  }

  eliminarVeterinario(id: number): Observable<RespuestaApi> {
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/${id}`);
  }
}