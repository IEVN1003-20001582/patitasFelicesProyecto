import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // Para llamadas rápidas adicionales

// Servicios
import { MascotasService } from '../../../service/mascotas.service';
import { ClientesService } from '../../../service/clientes.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ProductosService } from '../../../service/productos.service';

// Interfaces
import { Mascota } from '../../../interfaces/mascota.interface';
import { Cliente } from '../../../interfaces/cliente.interface';
import { Veterinario } from '../../../interfaces/veterinario.interface';
import { Producto } from '../../../interfaces/producto.interface';

@Component({
  selector: 'app-gestion-mascotas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-mascotas.component.html'
})
export class GestionMascotasComponent implements OnInit {
  
  // --- DATOS ---
  mascotas: Mascota[] = [];
  clientes: Cliente[] = [];
  veterinarios: Veterinario[] = [];
  productosVacunas: Producto[] = []; // Solo productos categoría 'Vacunas'
  
  loading = true;
  pestanaActiva: string = 'info';

  // --- FORMULARIOS ---
  nuevaMascota: Mascota = {
    cliente_id: 0, nombre: '', especie: '', raza: '', 
    sexo: 'Macho', esterilizado: 'No', alergias: ''
  };

  nuevoTratamiento: any = {
    veterinario_id: "",
    diagnostico: "",
    tratamiento: ""
  };

  nuevaVacuna: any = {
    producto_id: "", // ID de la vacuna en inventario
    veterinario_id: "",
    fecha_aplicacion: "",
    fecha_proxima: ""
  };

  motivoArchivar: string = 'Archivado';
  mascotaSeleccionada: Mascota | null = null;

  // --- MODALES ---
  modalAgregarAbierto = false;
  modalDetalleAbierto = false;
  modalTratamientoAbierto = false;
  modalVacunaAbierto = false;
  modalArchivarAbierto = false;
  modalFiltrosAbierto = false;

  constructor(
    private mascotasService: MascotasService,
    private clientesService: ClientesService,
    private vetService: VeterinariosService,
    private prodService: ProductosService,
    private http: HttpClient // Usamos http directo para endpoints específicos como historial/vacunas
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  // --- CARGA DE DATOS ---
  cargarDatosIniciales() {
    this.loading = true;
    
    // 1. Cargar Mascotas
    this.mascotasService.getMascotas().subscribe(data => {
      this.mascotas = data;
      this.loading = false;
    });

    // 2. Cargar Clientes (Para el select de "Nuevo Dueño")
    this.clientesService.getClientes().subscribe(data => this.clientes = data);

    // 3. Cargar Veterinarios (Para tratamientos y vacunas)
    this.vetService.getVeterinarios().subscribe(data => this.veterinarios = data);

    // 4. Cargar Productos (Solo vacunas)
    this.prodService.getProductos().subscribe(data => {
      this.productosVacunas = data.filter(p => p.categoria === 'Vacunas');
    });
  }

  // --- ACCIONES CRUD ---

  guardarMascota() {
    if (!this.nuevaMascota.nombre || !this.nuevaMascota.cliente_id) {
      alert("Por favor completa el nombre y el dueño.");
      return;
    }
    this.mascotasService.crearMascota(this.nuevaMascota).subscribe(() => {
      alert("¡Mascota registrada con éxito!");
      this.modalAgregarAbierto = false;
      this.cargarDatosIniciales(); // Recargar lista
      this.nuevaMascota = { cliente_id: 0, nombre: '', especie: '', raza: '' }; // Limpiar
    });
  }

  guardarTratamiento() {
    if (!this.mascotaSeleccionada) return;
    
    const payload = {
      mascota_id: this.mascotaSeleccionada.id,
      veterinario_id: this.nuevoTratamiento.veterinario_id,
      diagnostico: this.nuevoTratamiento.diagnostico,
      tratamiento: this.nuevoTratamiento.tratamiento,
      cita_id: null // Es un registro directo
    };

    this.http.post('http://127.0.0.1:5000/api/historial', payload).subscribe(() => {
      alert("Tratamiento registrado en el historial.");
      this.modalTratamientoAbierto = false;
    });
  }

  guardarVacuna() {
    if (!this.mascotaSeleccionada) return;

    // Buscamos el nombre de la vacuna seleccionada para guardarlo
    const vacunaSeleccionada = this.productosVacunas.find(p => p.id == this.nuevaVacuna.producto_id);

    const payload = {
      mascota_id: this.mascotaSeleccionada.id,
      producto_id: this.nuevaVacuna.producto_id,
      nombre: vacunaSeleccionada ? vacunaSeleccionada.nombre : 'Vacuna',
      vet_id: this.nuevaVacuna.veterinario_id,
      fecha: this.nuevaVacuna.fecha_aplicacion,
      proxima: this.nuevaVacuna.fecha_proxima
    };

    this.http.post('http://127.0.0.1:5000/api/vacunas', payload).subscribe(() => {
      alert("Vacuna registrada y stock descontado.");
      this.modalVacunaAbierto = false;
    });
  }

  confirmarArchivar() {
    // Aquí podrías llamar a un endpoint para actualizar el estado
    // Por ahora simulamos la actualización local
    if(this.mascotaSeleccionada) {
        // this.mascotaService.actualizarEstado(this.mascotaSeleccionada.id, this.motivoArchivar)...
        alert(`Mascota marcada como: ${this.motivoArchivar}`);
        this.modalArchivarAbierto = false;
        this.modalDetalleAbierto = false;
    }
  }

  // --- HELPERS VISUALES ---
  verDetalle(mascota: Mascota) {
    this.mascotaSeleccionada = mascota;
    this.pestanaActiva = 'info';
    this.modalDetalleAbierto = true;
  }

  cambiarPestana(tab: string) { this.pestanaActiva = tab; }

  // Apertura/Cierre de Modales
  abrirModalAgregar() { this.modalAgregarAbierto = true; }
  cerrarModalAgregar() { this.modalAgregarAbierto = false; }
  cerrarDetalle() { this.modalDetalleAbierto = false; this.mascotaSeleccionada = null; }
  
  abrirModalTratamiento() { this.modalTratamientoAbierto = true; }
  cerrarModalTratamiento() { this.modalTratamientoAbierto = false; }
  
  abrirModalVacuna() { this.modalVacunaAbierto = true; }
  cerrarModalVacuna() { this.modalVacunaAbierto = false; }

  abrirModalArchivar() { this.modalArchivarAbierto = true; }
  cerrarModalArchivar() { this.modalArchivarAbierto = false; }
  
  abrirModalFiltros() { this.modalFiltrosAbierto = true; }
  cerrarModalFiltros() { this.modalFiltrosAbierto = false; }
}