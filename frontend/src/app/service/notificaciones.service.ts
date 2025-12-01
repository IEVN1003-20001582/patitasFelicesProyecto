import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private api = 'http://127.0.0.1:5000/api/notificaciones';

  constructor(private http: HttpClient) {}

  getNotificaciones(userId: number) {
    return this.http.get(`${this.api}?user_id=${userId}`);
  }

  marcarLeida(id: number) {
    return this.http.put(`${this.api}/${id}/leer`, {});
  }
}
