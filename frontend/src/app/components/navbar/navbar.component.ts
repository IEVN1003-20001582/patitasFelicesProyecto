import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, Usuario } from '../../service/auth.service';
import { NotificacionesService } from '../../service/notificaciones.service';
import { Notificacion } from '../../interfaces/notificacion.interfaces';
import { ConfiguracionService } from '../../service/configuracion.service';
import { Router } from '@angular/router'; 



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
  
  nombreClinica = '';


  private intervalo: any;

  constructor(
    private authService: AuthService,
    private notifService: NotificacionesService,
    private configService: ConfiguracionService
    , private router: Router
  ) {}

  ngOnInit() {

    this.configService.infoClinica$.subscribe(info => {
      this.nombreClinica = info.nombre;
      });
      
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.cargarNotificaciones();
         this.intervalo = setInterval(() => {
        this.cargarNotificaciones();
      }, 60000); 
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
  if (!notif.leido) {
    this.notifService.marcarLeida(notif.id).subscribe();
  }

  this.mostrarDropdown = false;


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