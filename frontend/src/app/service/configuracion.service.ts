import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { RespuestaApi } from '../interfaces/respuesta-api.interface';

// Interfaz para los datos del JSON
export interface InfoClinica {
    nombre: string;
    telefono: string;
    direccion: string;
    iva: number;
    moneda: string;
    logo_url?: string;
    footer_factura?: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  
  private infoClinicaSubject = new BehaviorSubject<InfoClinica>({
      nombre: 'Cargando...',
      telefono: '',
      direccion: '',
      iva: 16,
      moneda: '$'
  });
  

  public infoClinica$ = this.infoClinicaSubject.asObservable();

  constructor(private http: HttpClient) { 
  
      this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
      this.http.get<any>(`${this.apiUrl}/config/clinica`).subscribe(data => {
       
          this.infoClinicaSubject.next(data);
      }, err => {
          console.error('Error cargando configuración clínica', err);
      });
  }


  getInfoClinicaValue(): InfoClinica {
      return this.infoClinicaSubject.value;
  }


  guardarInfoClinica(datos: any): Observable<RespuestaApi> { 
      return this.http.post<RespuestaApi>(`${this.apiUrl}/config/clinica`, datos).pipe(
          tap(() => {
            
              this.infoClinicaSubject.next(datos);
          })
      ); 
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