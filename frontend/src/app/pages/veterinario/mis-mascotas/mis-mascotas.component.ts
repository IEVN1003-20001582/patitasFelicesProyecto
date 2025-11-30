import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   
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
  selector: 'app-mis-mascotas',
  templateUrl: './mis-mascotas.component.html',
 
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MisMascotasComponent implements OnInit {


  mascotas: any[] = [];
  mascotasFiltradas: any[] = [];
  veterinarios: any[] = [];
  productos: any[] = []; 
  clientes: any[] = []; 


  historialMascota: any[] = [];
  vacunasMascota: any[] = [];
  citasMascota: any[] = [];


  kpis = {
    total: 0,
    nuevas: 0,
    alergias: 0
  };


  mostrarModalAgregar = false;
  mostrarModalDetalle = false;

  mostrarModalTratamiento = false;
  mostrarModalVacuna = false;
  mostrarModalFiltros = false;


  tabActiva: string = 'info'; 
  textoBusqueda: string = '';
  

  nuevaMascota: Mascota = this.initMascota();
  mascotaEditando: Mascota = this.initMascota(); 
  nuevoHistorial: Historial = this.initHistorial();
  nuevaVacuna: Vacuna = this.initVacuna();
  
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

  
  cargarDatosIniciales() {
    this.mascotasService.getMascotas().subscribe((data: any) => {
      const lista = data.mascotas || (Array.isArray(data) ? data : []);
      this.mascotas = lista;
      this.mascotasFiltradas = [...this.mascotas];
      this.calcularKPIs();
    }, err => console.error('Error mascotas:', err));

    this.veterinariosService.getVeterinarios().subscribe((data: any) => {
      this.veterinarios = data.veterinarios || (Array.isArray(data) ? data : []);
    });

    this.productosService.getProductos().subscribe((data: any) => {
      const lista = data.productos || (Array.isArray(data) ? data : []);
      this.productos = lista.filter((p: any) => p.nombre.toLowerCase().includes('vacuna'));
    });

    this.clientesService.getClientes().subscribe((data: any) => {
      this.clientes = data.clientes || (Array.isArray(data) ? data : []);
    });
  }

 
  abrirModalDetalle(mascota: any) {
    this.mascotaSeleccionada = mascota;
    this.tabActiva = 'info'; 
    this.mostrarModalDetalle = true;
    
 
    this.cargarDetalleMascota(mascota.id);
  }

  cargarDetalleMascota(id: number) {

    this.historialMascota = [];
    this.vacunasMascota = [];
    this.citasMascota = [];


    this.mascotasService.getHistorial(id).subscribe((res: any) => {
        this.historialMascota = res.historial || (Array.isArray(res) ? res : []);
    });

    this.mascotasService.getVacunas(id).subscribe((res: any) => {
        this.vacunasMascota = res.vacunas || (Array.isArray(res) ? res : []);
    });

    this.citasService.getCitas(id).subscribe((res: any) => {
        this.citasMascota = res.citas || (Array.isArray(res) ? res : []);
    });
  }

  


  guardarTratamiento() {
    this.nuevoHistorial.mascota_id = this.mascotaSeleccionada.id;
    
    if(!this.nuevoHistorial.veterinario_id || !this.nuevoHistorial.tratamiento_aplicado){
        Swal.fire('Faltan datos', 'Veterinario y Notas son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarHistorial(this.nuevoHistorial).subscribe(res => {
        if(res.exito) {
            Swal.fire('Guardado', 'Tratamiento registrado', 'success');
            this.cerrarModalTratamiento();
            this.cargarDetalleMascota(this.mascotaSeleccionada.id); 
            this.nuevoHistorial = this.initHistorial();
        } else {
            Swal.fire('Error', 'No se pudo guardar: ' + res.mensaje, 'error');
        }
    });
  }


  guardarVacuna() {
    this.nuevaVacuna.mascota_id = this.mascotaSeleccionada.id;
    
    if(!this.nuevaVacuna.producto_id || !this.nuevaVacuna.fecha_aplicacion){
        Swal.fire('Faltan datos', 'Producto y Fecha son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarVacuna(this.nuevaVacuna).subscribe(res => {
        if(res.exito) {
            Swal.fire('Guardado', 'Vacuna registrada', 'success');
            this.cerrarModalVacuna();
            this.cargarDetalleMascota(this.mascotaSeleccionada.id); 
            this.nuevaVacuna = this.initVacuna();
        } else {
            Swal.fire('Error', 'No se pudo guardar: ' + res.mensaje, 'error');
        }
    });
  }


  guardarMascota() {
    if (!this.nuevaMascota.nombre || !this.nuevaMascota.cliente_id) {
        Swal.fire('Atención', 'Nombre y Dueño son obligatorios', 'warning');
        return;
    }

    this.mascotasService.agregarMascota(this.nuevaMascota).subscribe(res => {
      if (res.exito) {
        Swal.fire('Éxito', 'Mascota registrada', 'success');
        this.cerrarModalAgregar();
        this.cargarDatosIniciales(); 
        this.nuevaMascota = this.initMascota(); 
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }




  calcularKPIs() {
    if (!this.mascotas) return;
    this.kpis.total = this.mascotas.length;
    this.kpis.alergias = this.mascotas.filter(m => m.alergias && m.alergias.length > 2 && m.alergias.toLowerCase() !== 'ninguna').length;
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

  cambiarTab(tab: string) { this.tabActiva = tab; }


  initMascota(): Mascota { return { cliente_id: 0, nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0, alergias: '' }; }
  

  initHistorial(): Historial { return { mascota_id: 0, veterinario_id: 0, tratamiento_aplicado: '', medicamentos_recetados: '' }; }
  initVacuna(): Vacuna { return { mascota_id: 0, veterinario_id: 0, producto_id: 0, fecha_aplicacion: '' }; }


  abrirModalAgregar() { this.mostrarModalAgregar = true; }
  cerrarModalAgregar() { this.mostrarModalAgregar = false; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; this.mascotaSeleccionada = null; }
  abrirModalTratamiento() { this.mostrarModalTratamiento = true; }
  cerrarModalTratamiento() { this.mostrarModalTratamiento = false; }
  abrirModalVacuna() { this.mostrarModalVacuna = true; }
  cerrarModalVacuna() { this.mostrarModalVacuna = false; }
  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }

}