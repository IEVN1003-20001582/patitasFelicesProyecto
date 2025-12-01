import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
 
})
export class LoginComponent implements OnInit {

  activeTab: 'login' | 'register' = 'login';
  viewMode: 'cliente' | 'personal' = 'cliente';

  loginData = { email: '', password: '' };
  

  registerData = { nombre: '', email: '', password: '', telefono: '', direccion: '' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.viewMode = params['view'] || 'cliente';
      if (this.viewMode === 'personal') {
        this.activeTab = 'login';
      }
      // Si viene con ?form=register, abrimos esa pestaña
      if (params['form'] === 'register') {
        this.activeTab = 'register';
      }
    });
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  onLogin() {
    if (!this.loginData.email || !this.loginData.password) {
      Swal.fire('Campos vacíos', 'Por favor completa todos los datos.', 'warning');
      return;
    }

    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        if (res.exito) {
          const role = res.usuario.role;
          
          Swal.fire({
            title: `¡Bienvenido!`,
            text: `Ingresando como ${role}...`,
            icon: 'success',
            timer: 1000,
            showConfirmButton: false
          }).then(() => {
        
            switch (role) {
              case 'admin':
                this.router.navigate(['/admin/dashboard']);
                break;
              case 'veterinario':
                this.router.navigate(['/veterinario/agenda']);
                break;
              case 'cliente':
                this.router.navigate(['/cliente/portal']);
                break;
              default:
                this.router.navigate(['/bienvenida']);
            }
          });

        } else {
          Swal.fire('Error', res.mensaje, 'error');
        }
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo conectar con el servidor.', 'error');
      }
    });
  }

  onRegister() {
    if (!this.registerData.nombre || !this.registerData.email || !this.registerData.password) {
        Swal.fire('Faltan datos', 'Nombre, Email y Contraseña son obligatorios', 'warning');
        return;
    }

    this.authService.registrarCliente(this.registerData).subscribe({
        next: (res) => {
            if(res.exito) {
                Swal.fire('¡Cuenta Creada!', 'Tu registro fue exitoso. Ahora puedes iniciar sesión.', 'success');
           
                this.switchTab('login');
              
                this.loginData.email = this.registerData.email;
             
                this.registerData = { nombre: '', email: '', password: '', telefono: '', direccion: '' };
            } else {
                Swal.fire('Error', res.mensaje, 'error');
            }
        },
        error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo registrar el usuario.', 'error');
        }
    });
  }
}