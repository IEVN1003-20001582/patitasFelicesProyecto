import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

// --- IMPORTANTE: Importar tus componentes aquí ---
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // --- Agregarlos a la lista de imports ---
  imports: [
    CommonModule, 
    RouterOutlet, 
    NavbarComponent, 
    SidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'patitas-felices';

  // Inyectamos el Router para saber en qué página estamos
  constructor(private router: Router) {}

  // Función para ocultar el menú en Login y Bienvenida
  esRutaPublica(): boolean {
    const rutaActual = this.router.url;
    
    // Lista de rutas donde NO queremos ver el menú lateral
    const rutasPublicas = ['/login', '/bienvenida', '/'];

    // Si la ruta actual está en la lista, devuelve true (es pública)
    return rutasPublicas.includes(rutaActual);
  }
  
  // Función auxiliar para saber el rol (Simulada por ahora)
  getRolActual(): string {
    // En el futuro, esto vendrá de tu AuthService
    // Por ahora, puedes cambiar esto manualmente a 'veterinario' o 'cliente' para probar
    return 'cliente'; // 'admin', 'veterinario', 'cliente'
  }
}