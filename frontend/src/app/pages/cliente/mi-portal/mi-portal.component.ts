import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mi-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-portal.component.html'
})
export class MiPortalComponent {
  pestanaActiva: string = 'mascotas'; // 'mascotas' o 'citas'

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
  }
  
  // Datos simulados del cliente logueado
  misMascotas = [
    { nombre: 'Max', especie: 'Perro', foto: '...' },
    { nombre: 'Mishi', especie: 'Gato', foto: '...' }
  ];
}



