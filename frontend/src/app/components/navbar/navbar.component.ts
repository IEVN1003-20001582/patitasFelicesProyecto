import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit {
  
  // --- ESTADO DE LA BARRA DE NAVEGACIÓN ---
  
  // Contador de notificaciones (Simulado: Vendría de una API)
  notificacionesCount: number = 3; 
  
  // Datos del usuario logueado (Simulado: Vendría de localStorage o AuthService)
  usuarioNombre: string = 'Israel Gonzalez';
  usuarioFoto: string = 'https://placehold.co/40x40/F4D03F/2C3E50?text=IG';

  // --- CICLO DE VIDA ---
  ngOnInit(): void {
    // Aquí podrías llamar a un servicio para cargar las notificaciones reales
    // this.notificacionesService.obtenerConteo().subscribe(count => this.notificacionesCount = count);
  }

  // --- FUNCIONES ---
  
  // Método para limpiar notificaciones al hacer clic (Opcional)
  limpiarNotificaciones() {
    this.notificacionesCount = 0;
  }
}