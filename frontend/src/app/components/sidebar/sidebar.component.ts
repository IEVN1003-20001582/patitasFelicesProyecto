import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importante: RouterModule permite usar routerLink
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  // Recibimos el rol desde el padre (app.component)
  // Puede ser: 'admin' | 'veterinario' | 'cliente'
  @Input() rolUsuario: string = 'admin'; 

  constructor(private router: Router) {}

  logout() {
    // Aquí borras el token del localStorage
    // localStorage.removeItem('token');
    console.log('Cerrando sesión...');
    this.router.navigate(['/login']);
  }
}