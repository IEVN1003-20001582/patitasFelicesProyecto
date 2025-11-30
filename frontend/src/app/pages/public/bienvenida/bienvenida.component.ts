import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bienvenida.component.html',
  
})
export class BienvenidaComponent {

  constructor(private router: Router) {}

  navegar(tipoUsuario: 'cliente' | 'personal') {
    this.router.navigate(['/login'], { queryParams: { view: tipoUsuario } });
  }
}
