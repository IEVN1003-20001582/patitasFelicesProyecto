import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, Usuario } from '../../service/auth.service';
import { ConfiguracionService } from '../../service/configuracion.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',

})
export class SidebarComponent implements OnInit {
  
  // ESTA ES LA VARIABLE QUE FALTABA:
  usuarioActual: Usuario | null = null;

  nombreClinica = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private configService: ConfiguracionService
  ) {}

  ngOnInit() {
    this.configService.infoClinica$.subscribe(info => {
      this.nombreClinica = info.nombre;
    });


    // Nos suscribimos para recibir los datos del usuario logueado
    this.authService.currentUser$.subscribe(user => {
      this.usuarioActual = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}