import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  
})
export class LoginComponent {

  activeTab: 'login' | 'register' = 'login';

  isPersonal: boolean = false;

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const view = params['view'];
      
      if (view === 'personal') {
        this.isPersonal = true;
        this.activeTab = 'login';
      } else {
        this.isPersonal = false;
      }
    });
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log('Datos de Login:', this.loginForm.value);
      alert('Funcionalidad de Login simulada. Datos en consola.');
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      console.log('Datos de Registro:', this.registerForm.value);
      alert('Funcionalidad de Registro simulada. Datos en consola.');
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

}
