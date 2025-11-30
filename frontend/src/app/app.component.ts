import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './app.component.html',

})
export class AppComponent {
  title = 'patitas-felices';

  constructor(private router: Router) {}

  esRutaPublica(): boolean {
    const urlCompleta = this.router.url;
    const rutaBase = urlCompleta.split('?')[0]; 
    const rutasPublicas = ['/login', '/bienvenida', '/'];
    return rutasPublicas.includes(rutaBase);
  }
}