import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion.component.html',
  
})
export class ConfiguracionComponent {
  activeTab: 'perfil' | 'clinica' | 'operaciones' = 'clinica'; 

  perfilForm: FormGroup;
  clinicaForm: FormGroup;

  tiposCita = [
    { id: 1, nombre: 'Consulta General', duracion: 30, precio: 500 },
    { id: 2, nombre: 'Vacunación', duracion: 15, precio: 350 },
    { id: 3, nombre: 'Cirugía', duracion: 120, precio: 2500 }
  ];

  categoriasProducto = [
    { id: 1, nombre: 'Medicamentos' },
    { id: 2, nombre: 'Alimentos' },
    { id: 3, nombre: 'Higiene' },
    { id: 4, nombre: 'Juguetes' }
  ];

  constructor(private fb: FormBuilder) {
    this.perfilForm = this.fb.group({
      nombre: ['Israel Gonzalez', Validators.required],
      email: ['admin@patitas.com', [Validators.required, Validators.email]],
      passwordActual: ['', Validators.required],
      passwordNueva: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.clinicaForm = this.fb.group({
      nombreClinica: ['Patitas Felices', Validators.required],
      telefono: ['477 123 4567', Validators.required],
      direccion: ['Av. Siempre Viva 123, Col. Centro', Validators.required],
      rfc: ['XAXX010101000', Validators.required],
      iva: [16, Validators.required]
    });
  }

  cambiarTab(tab: 'perfil' | 'clinica' | 'operaciones') {
    this.activeTab = tab;
  }

  guardarPerfil() {
    if (this.perfilForm.valid) {
      alert('Perfil actualizado correctamente (Simulado)');
    }
  }

  guardarClinica() {
    if (this.clinicaForm.valid) {
      alert('Datos de la clínica guardados (Simulado)');
    }
  }

  editarTipoCita(item: any) { alert(`Editar cita: ${item.nombre}`); }
  eliminarTipoCita(id: number) { alert(`Eliminar cita ID: ${id}`); }
  
  editarCategoria(item: any) { alert(`Editar categoría: ${item.nombre}`); }
  eliminarCategoria(id: number) { alert(`Eliminar categoría ID: ${id}`); }
}
