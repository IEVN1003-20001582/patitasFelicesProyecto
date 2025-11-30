import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private apiUrl = 'http://127.0.0.1:5000/api/notificaciones';

  constructor(private http: HttpClient) { }

  getNotificaciones(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?user_id=${userId}`);
  }

  marcarLeida(id: number): Observable<RespuestaApi> {
    return this.http.put<RespuestaApi>(`${this.apiUrl}/${id}/leer`, {});
  }
}