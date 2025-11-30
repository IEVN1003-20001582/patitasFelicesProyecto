import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  constructor(private http: HttpClient) { }


  getInfoClinica(): Observable<any> { 
    return this.http.get<any>(`${this.apiUrl}/config/clinica`); 
  }


  guardarInfoClinica(datos: any): Observable<RespuestaApi> { 
    return this.http.post<RespuestaApi>(`${this.apiUrl}/config/clinica`, datos); 
  }


  cambiarPassword(datos: any): Observable<RespuestaApi> {
      return this.http.post<RespuestaApi>(`${this.apiUrl}/cambiar-password`, datos);
  }

  actualizarPerfilUsuario(id: number, datos: { email: string }): Observable<RespuestaApi> {
      return this.http.put<RespuestaApi>(`${this.apiUrl}/usuario/${id}`, datos);
  }


  getTiposCita(): Observable<any> { 
    return this.http.get<any>(`${this.apiUrl}/config/tipos-cita`); 
  }




  addTipoCita(datos: any): Observable<RespuestaApi> 
  { 
    return this.http.post<RespuestaApi>(`${this.apiUrl}/config/tipos-cita`, datos); 
  }



  deleteTipoCita(id: number): Observable<RespuestaApi> 
  { 
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/config/tipos-cita/${id}`); 
  }


  getCategorias(): Observable<any> 
  { 
    return this.http.get<any>(`${this.apiUrl}/config/categorias`); 
  }

  
  addCategoria(datos: any): Observable<RespuestaApi> 
  { 
    return this.http.post<RespuestaApi>(`${this.apiUrl}/config/categorias`, datos); 
  }


  deleteCategoria(id: number): Observable<RespuestaApi> 
  { 
    return this.http.delete<RespuestaApi>(`${this.apiUrl}/config/categorias/${id}`); 
  }
}