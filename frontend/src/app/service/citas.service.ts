import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private apiUrl = 'http://127.0.0.1:5000/api/citas';

  constructor(private http: HttpClient) { }

  // Acepta mascota_id opcional para filtrar
  getCitas(mascotaId?: number): Observable<any> {
    let url = this.apiUrl;
    if (mascotaId) url += `?mascota_id=${mascotaId}`;
    return this.http.get<any>(url);
  }
}