import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ConfiguracionService } from '../../../service/configuracion.service';
import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
 
})
export class ConfiguracionComponent implements OnInit {

  tabActiva = 'perfil';
  
 
  usuarioActual: any = null;
  emailEditado: string = ''; 

  passwordForm = { actual: '', nueva: '', confirmar: '' };

  
  infoClinica: any = { nombre: '', telefono: '', direccion: '', iva: 16, moneda: '$' };

 
  tiposCita: any[] = [];
  categorias: any[] = [];
  
  nuevoTipoCita = { nombre: '', duracion: 30, precio: 0 };
  nuevaCategoria = { nombre: '' };

  constructor(
    private configService: ConfiguracionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActualValue(); // O getUsuarioActualValue()
    if (this.usuarioActual) {
        this.emailEditado = this.usuarioActual.email;
    }
    this.cargarConfiguraciones();
  }

  cargarConfiguraciones() {
    this.configService.getInfoClinica().subscribe((res: any) => this.infoClinica = res);
    this.cargarTiposCita();
    this.cargarCategorias();
  }
  
  cargarTiposCita() {
    this.configService.getTiposCita().subscribe((res: any) => this.tiposCita = res.tipos || []);
  }
  
  cargarCategorias() {
    this.configService.getCategorias().subscribe((res: any) => this.categorias = res.categorias || []);
  }



  guardarPerfil() {
      if (!this.usuarioActual) return;

      if (!this.emailEditado.endsWith('@admin.com')) {
          Swal.fire('Correo Inválido', 'El correo del administrador debe terminar en <b>@admin.com</b>', 'warning');
          return;
      }

      this.configService.actualizarPerfilUsuario(this.usuarioActual.id, { email: this.emailEditado }).subscribe(res => {
          if(res.exito) {
              Swal.fire('Actualizado', 'Tu perfil ha sido actualizado. Por favor inicia sesión de nuevo.', 'success')
              .then(() => {
                  this.authService.logout();
              });
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }

  cambiarPassword() {
      if (this.passwordForm.nueva !== this.passwordForm.confirmar) {
          Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
          return;
      }
      if (!this.usuarioActual) return;

      const payload = {
          user_id: this.usuarioActual.id,
          actual: this.passwordForm.actual,
          nueva: this.passwordForm.nueva
      };

      this.configService.cambiarPassword(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Éxito', 'Contraseña actualizada', 'success');
              this.passwordForm = { actual: '', nueva: '', confirmar: '' };
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }

 
  guardarInfoClinica() {
      this.configService.guardarInfoClinica(this.infoClinica).subscribe(res => {
          if(res.exito) Swal.fire('Guardado', 'Información actualizada', 'success');
      });
  }
  
  agregarTipoCita() {
      if(!this.nuevoTipoCita.nombre) return;
      this.configService.addTipoCita(this.nuevoTipoCita).subscribe(res => {
          if(res.exito) { this.cargarTiposCita(); this.nuevoTipoCita = { nombre: '', duracion: 30, precio: 0 }; }
      });
  }

  eliminarTipoCita(id: number) {
      this.configService.deleteTipoCita(id).subscribe(res => { if(res.exito) this.cargarTiposCita(); });
  }

  agregarCategoria() {
      if(!this.nuevaCategoria.nombre) return;
      this.configService.addCategoria(this.nuevaCategoria).subscribe(res => {
          if(res.exito) { this.cargarCategorias(); this.nuevaCategoria = { nombre: '' }; }
      });
  }
  
  eliminarCategoria(id: number) {
      this.configService.deleteCategoria(id).subscribe(res => { if(res.exito) this.cargarCategorias(); });
  }

  cambiarTab(tab: string) { this.tabActiva = tab; }
}