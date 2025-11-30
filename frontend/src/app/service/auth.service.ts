import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

export interface Usuario {
  id: number;
  email: string;
  role: 'admin' | 'veterinario' | 'cliente'; 
  nombre: string;
  perfil_id: number;
}

export interface LoginResponse {
  usuario: Usuario;
  mensaje: string;
  exito: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:5000/api';


  private currentUserSubject: BehaviorSubject<Usuario | null>;
  public currentUser$: Observable<Usuario | null>;

  constructor(private http: HttpClient, private router: Router) {

    const savedUser = localStorage.getItem('usuario');
    this.currentUserSubject = new BehaviorSubject<Usuario | null>(savedUser ? JSON.parse(savedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }


  login(credenciales: { email: string, password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(res => {
        if (res.exito) {
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
         
          this.currentUserSubject.next(res.usuario);
        }
      })
    );
  }


  logout() {
    localStorage.removeItem('usuario');
    this.currentUserSubject.next(null); 
    this.router.navigate(['/login']);
  }

  
  getUsuarioActualValue(): Usuario | null {
    return this.currentUserSubject.value;
  }
  
 
  registrarCliente(datos: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clientes`, datos);
  }
}