import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../service/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',

})
export class SidebarComponent implements OnInit {
  
  // ESTA ES LA VARIABLE QUE FALTABA:
  usuarioActual: Usuario | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Nos suscribimos para recibir los datos del usuario logueado
    this.authService.currentUser$.subscribe(user => {
      this.usuarioActual = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}