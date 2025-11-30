import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../service/auth.service';
import { NotificacionesService } from '../../service/notificaciones.service';
import { Notificacion } from '../../interfaces/notificacion.interfaces';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',

})
export class NavbarComponent implements OnInit, OnDestroy {
  
  usuario: Usuario | null = null;
  notificaciones: Notificacion[] = [];
  noLeidas = 0;
  mostrarDropdown = false;
  
  private intervalo: any;

  constructor(
    private authService: AuthService,
    private notifService: NotificacionesService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.cargarNotificaciones();
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
  }


  get primerNombre(): string {
    if (this.usuario && this.usuario.nombre) {
      return this.usuario.nombre.split(' ')[0];
    }
    return 'Usuario';
  }

  cargarNotificaciones() {
    if (!this.usuario) return;
    this.notifService.getNotificaciones(this.usuario.id).subscribe((res: any) => {
        this.notificaciones = res.notificaciones || [];
        this.noLeidas = this.notificaciones.filter(n => n.leido === 0).length;
    });
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
    if (this.mostrarDropdown) {
        this.cargarNotificaciones();
    }
  }

  marcarComoLeida(notif: Notificacion) {
    if (notif.leido) return;
    
    this.notifService.marcarLeida(notif.id).subscribe(res => {
        if (res.exito) {
            notif.leido = 1;
            this.noLeidas--;
        }
    });
  }

  getIconColor(tipo: string): string {
    switch(tipo) {
        case 'Stock': return 'text-red-500 bg-red-100';
        case 'Cita': return 'text-blue-500 bg-blue-100';
        case 'Vacuna': return 'text-purple-500 bg-purple-100';
        default: return 'text-gray-500 bg-gray-100';
    }
  }
}