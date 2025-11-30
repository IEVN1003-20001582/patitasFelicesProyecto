import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
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

  constructor(private router: Router) {}

  esRutaPublica(): boolean {
    const rutaActual = this.router.url;
    
  if (rutaActual === '/' || rutaActual.includes('/login') || rutaActual.includes('/bienvenida')) {
      return true;
    }

    return false;
  }

  getRolActual(): string {
    return 'veterinario';
  }
}