import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gestion-mascotas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mis-mascotas.component.html'
})
export class MisMascotasComponent {
  
  // --- ESTADOS DE MODALES ---
  mostrarModalAgregar = false;
  mostrarModalDetalle = false;
  mostrarModalArchivar = false;

  // --- DATOS SIMULADOS (MOCKS) ---
  mascotas = [
    {
      id: 1,
      nombre: 'Max',
      especie: 'Perro',
      raza: 'Golden Retriever',
      dueno: 'Ana Gomez',
      foto: 'https://placehold.co/400x300/F4D03F/ffffff?text=Max',
      alerta: 'ALERGIAS',
      ultimoTratamiento: 'Vacuna (Dr. Salas)'
    },
    {
      id: 2,
      nombre: 'Mishi',
      especie: 'Gato',
      raza: 'Doméstico',
      dueno: 'Carlos Ruiz',
      foto: 'https://placehold.co/400x300/2C3E50/ffffff?text=Mishi',
      alerta: 'CRÓNICO',
      ultimoTratamiento: 'Consulta (Dr. Israel)'
    },
    {
      id: 3,
      nombre: 'Thor',
      especie: 'Perro',
      raza: 'Labrador',
      dueno: 'Maria Lopez',
      foto: 'https://placehold.co/400x300/48C9B0/ffffff?text=Thor',
      alerta: null,
      ultimoTratamiento: 'Consulta (Dr. Salas)'
    },
    {
      id: 4,
      nombre: 'Firulais',
      especie: 'Perro',
      raza: 'Mixto',
      dueno: 'Juan Perez',
      foto: 'https://tse1.mm.bing.net/th/id/OIP.WHhVzewbv9Q8V3F9oZSgFgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
      alerta: null,
      ultimoTratamiento: 'N/A',
      estado: 'memoria' // Estado especial
    }
  ];

  mascotaSeleccionada: any = null;

  // --- FUNCIONES ---

  abrirModalAgregar() {
    this.mostrarModalAgregar = true;
  }

  cerrarModalAgregar() {
    this.mostrarModalAgregar = false;
  }

  verDetalle(mascota: any) {
    this.mascotaSeleccionada = mascota;
    this.mostrarModalDetalle = true;
  }

  cerrarDetalle() {
    this.mostrarModalDetalle = false;
    this.mascotaSeleccionada = null;
  }


}