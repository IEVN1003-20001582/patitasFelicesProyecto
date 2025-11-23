import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Usuario, LoginResponse } from '../interfaces/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:5000/api/login';
  private usuarioActual: Usuario | null = null;

  constructor(private http: HttpClient) {}

  login(credenciales: {email: string, password: string}): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, credenciales).pipe(
      tap(response => {
        if (response.success) {
          this.usuarioActual = response.usuario;
          localStorage.setItem('usuario', JSON.stringify(this.usuarioActual));
        }
      })
    );
  }

  logout() {
    this.usuarioActual = null;
    localStorage.removeItem('usuario');
  }

  getUsuario(): Usuario | null {
    if (!this.usuarioActual) {
      const savedUser = localStorage.getItem('usuario');
      if (savedUser) {
        this.usuarioActual = JSON.parse(savedUser);
      }
    }
    return this.usuarioActual;
  }
  
  // Método auxiliar para obtener el ID del perfil (cliente_id o veterinario_id)
  getPerfilId(): number {
      return this.getUsuario()?.perfil_id || 0;
  }
}