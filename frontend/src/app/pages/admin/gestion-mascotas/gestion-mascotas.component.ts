import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor
import { FormsModule } from '@angular/forms';   // Necesario para [(ngModel)]
import Swal from 'sweetalert2';

// --- INTERFACES ---
import { Mascota } from '../../../interfaces/mascota.interface';
import { Historial } from '../../../interfaces/historial.interface';
import { Vacuna } from '../../../interfaces/vacuna.interface';

// --- SERVICIOS ---
import { MascotasService } from '../../../service/mascotas.service';
import { ClientesService } from '../../../service/clientes.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ProductosService } from '../../../service/productos.service';
import { CitasService } from '../../../service/citas.service';

@Component({
  selector: 'app-gestion-mascotas',
  templateUrl: './gestion-mascotas.component.html',
  
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class GestionMascotasComponent implements OnInit {



  // --- VARIABLES DE DATOS GENERALES ---
  mascotas: any[] = [];
  mascotasFiltradas: any[] = [];
  veterinarios: any[] = [];
  productos: any[] = []; // Se usará para el dropdown de vacunas
  clientes: any[] = []; 

  // --- VARIABLES DE DATOS DETALLADOS (FASE 2) ---
  historialMascota: any[] = [];
  vacunasMascota: any[] = [];
  citasMascota: any[] = [];

  // --- ESTADÍSTICAS ---
  kpis = {
    total: 0,
    nuevas: 0,
    alergias: 0
  };

  // --- CONTROL DE MODALES ---
  mostrarModalAgregar = false;
  mostrarModalDetalle = false;
  mostrarModalTratamiento = false;
  mostrarModalVacuna = false;
  mostrarModalFiltros = false;
  mostrarModalArchivar = false;
  mostrarModalEditar = false;

  tabActiva: string = 'info'; // Pestaña activa en el detalle
  textoBusqueda: string = '';
  
  // --- OBJETOS PARA LOS FORMULARIOS ---
  nuevaMascota: Mascota = this.initMascota();
  nuevoHistorial: Historial = this.initHistorial();
  nuevaVacuna: Vacuna = this.initVacuna();

  mascotaEditando: Mascota = this.initMascota();
  mascotaSeleccionada: any = null; 

  constructor(
    private mascotasService: MascotasService,
    private clientesService: ClientesService,
    private veterinariosService: VeterinariosService,
    private productosService: ProductosService,
    private citasService: CitasService
  ) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  // ==========================================
  // 1. CARGA DE DATOS MAESTROS
  // ==========================================
  cargarDatosIniciales() {
    // Mascotas
    this.mascotasService.getMascotas().subscribe((data: any) => {
      // Manejo robusto: puede venir como {mascotas: []} o directamente []
      const lista = data.mascotas || (Array.isArray(data) ? data : []);
      this.mascotas = lista;
      this.mascotasFiltradas = [...this.mascotas];
      this.calcularKPIs();
    }, err => console.error('Error mascotas:', err));

    // Veterinarios
    this.veterinariosService.getVeterinarios().subscribe((data: any) => {
      this.veterinarios = data.veterinarios || (Array.isArray(data) ? data : []);
    });

    // Productos (Solo Vacunas)
    this.productosService.getProductos().subscribe((data: any) => {
      const lista = data.productos || (Array.isArray(data) ? data : []);
      this.productos = lista.filter((p: any) => p.nombre.toLowerCase().includes('vacuna'));
    });

    // Clientes
    this.clientesService.getClientes().subscribe((data: any) => {
      this.clientes = data.clientes || (Array.isArray(data) ? data : []);
    });
  }

  // ==========================================
  // 2. LÓGICA DEL DETALLE (FASE 2)
  // ==========================================
  abrirModalDetalle(mascota: any) {
    this.mascotaSeleccionada = mascota;
    this.tabActiva = 'info'; // Resetear a la primera pestaña
    this.mostrarModalDetalle = true;
    
    // Cargar datos específicos de esta mascota
    this.cargarDetalleMascota(mascota.id);
  }

  cargarDetalleMascota(id: number) {
    // Historial Médico
    this.mascotasService.getHistorial(id).subscribe((res: any) => {
        this.historialMascota = res.historial || [];
    });
    // Vacunas
    this.mascotasService.getVacunas(id).subscribe((res: any) => {
        this.vacunasMascota = res.vacunas || [];
    });
    // Próximas Citas
    this.citasService.getCitas(id).subscribe((res: any) => {
        this.citasMascota = res.citas || [];
    });
  }

  // ==========================================
  // 3. GUARDAR DATOS (CRUD)
  // ==========================================

  // --- GUARDAR TRATAMIENTO ---
guardarTratamiento() {
    this.nuevoHistorial.mascota_id = this.mascotaSeleccionada.id;
    
    // Validamos usando el nuevo nombre 'tratamiento_aplicado'
    if(!this.nuevoHistorial.veterinario_id || !this.nuevoHistorial.tratamiento_aplicado){
        Swal.fire('Faltan datos', 'El veterinario y las notas del tratamiento son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarHistorial(this.nuevoHistorial).subscribe(res => {
        if(res.exito) {
            Swal.fire('Guardado', 'Tratamiento registrado correctamente', 'success');
            this.cerrarModalTratamiento();
            this.cargarDetalleMascota(this.mascotaSeleccionada.id);
            this.nuevoHistorial = this.initHistorial(); 
        } else {
            Swal.fire('Error', 'No se pudo guardar: ' + res.mensaje, 'error');
        }
    });
  }

  // --- GUARDAR VACUNA ---
  guardarVacuna() {
    this.nuevaVacuna.mascota_id = this.mascotaSeleccionada.id;
    
    if(!this.nuevaVacuna.producto_id || !this.nuevaVacuna.fecha_aplicacion){
        Swal.fire('Faltan datos', 'El producto y la fecha son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarVacuna(this.nuevaVacuna).subscribe(res => {
        if(res.exito) {
            Swal.fire('Guardado', 'Vacuna registrada correctamente', 'success');
            this.cerrarModalVacuna();
            // Recargamos el detalle
            this.cargarDetalleMascota(this.mascotaSeleccionada.id);
            this.nuevaVacuna = this.initVacuna();
        } else {
            Swal.fire('Error', 'No se pudo guardar: ' + res.mensaje, 'error');
        }
    });
  }

  // --- GUARDAR MASCOTA NUEVA ---
  guardarMascota() {
    if (!this.nuevaMascota.nombre || !this.nuevaMascota.cliente_id) {
        Swal.fire('Atención', 'Nombre y Dueño son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarMascota(this.nuevaMascota).subscribe(res => {
      if (res.exito) {
        Swal.fire('Éxito', 'Mascota registrada en el sistema', 'success');
        this.cerrarModalAgregar();
        this.cargarDatosIniciales(); // Recargamos la lista principal
        this.nuevaMascota = this.initMascota(); 
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }


  abrirModalEditar() {
    this.mascotaEditando = { ...this.mascotaSeleccionada }; // Clonamos el objeto
    this.mostrarModalEditar = true;
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
    this.mascotaEditando = this.initMascota();
  }

  guardarEdicionMascota() {
    if (!this.mascotaEditando.nombre || !this.mascotaEditando.cliente_id) {
      Swal.fire('Atención', 'Nombre y Dueño son obligatorios', 'warning');
      return;
    }
  // Llamamos al servicio (asegúrate de que mascotaEditando tenga ID)
    if (this.mascotaEditando.id) {
        this.mascotasService.modificarMascota(this.mascotaEditando.id, this.mascotaEditando).subscribe(res => {
            if (res.exito) {
                Swal.fire('Actualizado', 'Información actualizada correctamente', 'success');
                
                
                // Actualizamos la vista local inmediatamente
                this.mascotaSeleccionada = { ...this.mascotaEditando }; 

                this.cerrarModalEditar();
                
                // Y recargamos la lista principal por si acaso
                this.cargarDatosIniciales();
                
            } else {
                Swal.fire('Error', 'No se pudo actualizar: ' + res.mensaje, 'error');
            }
        });
    }
  }

  // --- ARCHIVAR MASCOTA ---
  archivarMascotaConfirmado() {
    if (!this.mascotaSeleccionada) return;
    
    this.mascotasService.eliminarMascota(this.mascotaSeleccionada.id).subscribe(res => {
      if (res.exito) {
        Swal.fire('Archivada', 'La mascota ha sido archivada', 'success');
        this.cerrarModalArchivar();
        this.cerrarModalDetalle();
        this.cargarDatosIniciales();
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }

  // ==========================================
  // 4. UTILIDADES Y FILTROS
  // ==========================================
  calcularKPIs() {
    if (!this.mascotas) return;
    this.kpis.total = this.mascotas.length;
    // Filtra mascotas que tengan texto en alergias y que no sea "Ninguna" o vacío
    this.kpis.alergias = this.mascotas.filter(m => m.alergias && m.alergias.length > 2 && m.alergias.toLowerCase() !== 'ninguna').length;
    // Simulación de nuevas mascotas (en prod usar fecha de registro)
    this.kpis.nuevas = Math.floor(this.mascotas.length * 0.15); 
  }

  filtrarMascotas() {
    if (!this.mascotas) return;
    const texto = this.textoBusqueda.toLowerCase();
    this.mascotasFiltradas = this.mascotas.filter(m => 
      m.nombre.toLowerCase().includes(texto) || 
      (m.nombre_dueno && m.nombre_dueno.toLowerCase().includes(texto)) ||
      (m.raza && m.raza.toLowerCase().includes(texto))
    );
  }

  cambiarTab(tab: string) {
    this.tabActiva = tab;
  }

  // --- HELPERS PARA LIMPIAR FORMULARIOS ---
  initMascota(): Mascota {
    return { cliente_id: 0, nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0, alergias: '' };
  }

 initHistorial(): Historial {
    return { 
        mascota_id: 0, 
        veterinario_id: 0, 
        tratamiento_aplicado: '', // Ya no es 'notas'
        medicamentos_recetados: '', // Ya no es 'medicamentos'
        diagnostico: 'Consulta General'
    };
  }
  initVacuna(): Vacuna {
    return { mascota_id: 0, veterinario_id: 0, producto_id: 0, fecha_aplicacion: '' };
  }

  // ==========================================
  // 5. CONTROL DE VISIBILIDAD DE MODALES
  // ==========================================
  abrirModalAgregar() { this.mostrarModalAgregar = true; }
  cerrarModalAgregar() { this.mostrarModalAgregar = false; }

  cerrarModalDetalle() { 
    this.mostrarModalDetalle = false; 
    this.mascotaSeleccionada = null; 
  }
  
  abrirModalTratamiento() { this.mostrarModalTratamiento = true; }
  cerrarModalTratamiento() { this.mostrarModalTratamiento = false; }
  
  abrirModalVacuna() { this.mostrarModalVacuna = true; }
  cerrarModalVacuna() { this.mostrarModalVacuna = false; }

  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }
  
  abrirModalArchivar() { this.mostrarModalArchivar = true; }
  cerrarModalArchivar() { this.mostrarModalArchivar = false; }
}