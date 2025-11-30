import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mi-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-portal.component.html'
})
export class MiPortalComponent {
  pestanaActiva: string = 'mascotas';

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
  }
  
  misMascotas = [
    { nombre: 'Max', especie: 'Perro', foto: '...' },
    { nombre: 'Mishi', especie: 'Gato', foto: '...' }
  ];
}



