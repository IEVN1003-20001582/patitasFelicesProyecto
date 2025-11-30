import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Veterinario } from '../../../interfaces/veterinario.interface';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { CitasService } from '../../../service/citas.service'; 

@Component({
  selector: 'app-gestion-veterinarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-veterinarios.component.html',
 
  providers: [DatePipe] 
})
export class GestionVeterinariosComponent implements OnInit {

  veterinarios: any[] = [];
  veterinariosFiltrados: any[] = [];
  citasVeterinario: any[] = []; 
  
  kpis = { total: 0, disponibles: 0, principal: 'General' };

  mostrarModalAgregar = false; 
  mostrarModalDetalle = false;
  esEdicion = false;

  textoBusqueda = '';
  vetForm: Veterinario = this.initVet();
  vetSeleccionado: any = null;

  tabActiva = 'info';

 
  especialidades = [
    'Medicina General',
    'Cirugía General',
    'Cardiología',
    'Dermatología',
    'Ortopedia',
    'Oftalmología',
    'Odontología',
    'Medicina Interna',
    'Neurología',
    'Oncología',
    'Etología'
  ];

  constructor(
    private veterinariosService: VeterinariosService,
    private citasService: CitasService
  ) {}

  ngOnInit(): void {
    this.cargarVeterinarios();
  }


  
  cargarVeterinarios() {
    this.veterinariosService.getVeterinarios().subscribe((res: any) => {
      const listaRaw = res.veterinarios || (Array.isArray(res) ? res : []);
      this.veterinarios = listaRaw.map((v: any) => ({
        id: v.id,
        usuario_id: v.usuario_id,
        nombre_completo: v.nombre_completo,
        email: v.email,
        cedula: v.cedula_profesional,
        especialidad: v.especialidad,
        turno: v.turno,
        foto_url: v.foto_url,
        is_active: v.is_active
      }));
      this.veterinariosFiltrados = [...this.veterinarios];
      this.calcularKPIs();
    });
  }

  cargarAgenda(vetId: number) {
    this.citasVeterinario = []; 
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const dia = hoy.getDate().toString().padStart(2, '0');
    const fechaHoy = `${año}-${mes}-${dia}`;

    this.citasService.getCitas({ veterinario_id: vetId, fecha: fechaHoy }).subscribe((res: any) => {
        this.citasVeterinario = res.citas || [];
    });
  }

  calcularKPIs() {
    this.kpis.total = this.veterinarios.length;
    this.kpis.disponibles = this.veterinarios.filter(v => v.is_active === 1).length;
    if (this.veterinarios.length > 0) {
        const counts: {[key: string]: number} = {};
        this.veterinarios.forEach(v => counts[v.especialidad] = (counts[v.especialidad] || 0) + 1);
        this.kpis.principal = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }
  }

  filtrar() {
    const txt = this.textoBusqueda.toLowerCase();
    this.veterinariosFiltrados = this.veterinarios.filter(v => 
      v.nombre_completo.toLowerCase().includes(txt) || 
      v.especialidad.toLowerCase().includes(txt)
    );
  }

  guardarVeterinario() {
    if (!this.vetForm.nombre_completo || !this.vetForm.email || !this.vetForm.cedula) {
        Swal.fire('Faltan datos', 'Nombre, Email y Cédula son obligatorios', 'warning');
        return;
    }
    if (this.esEdicion && this.vetForm.id) {
        this.veterinariosService.actualizarVeterinario(this.vetForm.id, this.vetForm).subscribe(res => {
            if(res.exito) this.exitoOperacion('Actualizado');
            else Swal.fire('Error', res.mensaje, 'error');
        });
    } else {
        this.veterinariosService.agregarVeterinario(this.vetForm).subscribe(res => {
            if(res.exito) this.exitoOperacion('Registrado');
            else Swal.fire('Error', res.mensaje, 'error');
        });
    }
  }

  desactivarAcceso() {
    if (!this.vetSeleccionado) return;
    Swal.fire({
        title: '¿Desactivar acceso?',
        text: "El veterinario no podrá iniciar sesión.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, desactivar'
    }).then((result) => {
        if (result.isConfirmed) {
            this.veterinariosService.eliminarVeterinario(this.vetSeleccionado.id).subscribe(res => {
                if(res.exito) {
                    Swal.fire('Desactivado', 'Acceso revocado', 'success');
                    this.cerrarModalDetalle();
                    this.cargarVeterinarios();
                }
            });
        }
    });
  }

  exitoOperacion(msg: string) {
    Swal.fire('Éxito', `Veterinario ${msg} correctamente`, 'success');
    this.cerrarModalAgregar();
    this.cargarVeterinarios();
  }

  abrirModalAgregar() {
    this.esEdicion = false;
    this.vetForm = this.initVet();
    this.mostrarModalAgregar = true;
  }

  abrirModalEditarDesdeDetalle() {
    this.esEdicion = true;
    this.vetForm = { ...this.vetSeleccionado };
    this.cerrarModalDetalle();
    this.mostrarModalAgregar = true;
  }

  abrirModalDetalle(vet: any) {
    this.vetSeleccionado = vet;
    this.tabActiva = 'info';
    this.mostrarModalDetalle = true;
    if (vet.id) this.cargarAgenda(vet.id);
  }

  cerrarModalAgregar() { this.mostrarModalAgregar = false; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; }
  cambiarTab(tab: string) { this.tabActiva = tab; }

  initVet(): Veterinario {
    return { nombre_completo: '', email: '', cedula: '', especialidad: '', turno: 'Matutino' };
  }
}