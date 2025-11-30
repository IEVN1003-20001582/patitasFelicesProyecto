import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { CitasService } from '../../../service/citas.service';
import { MascotasService } from '../../../service/mascotas.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ClientesService } from '../../../service/clientes.service'; // Para buscar dueño al seleccionar mascota
import { ConfiguracionService } from '../../../service/configuracion.service';

@Component({
  selector: 'app-gestion-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-citas.component.html',
  
})
export class GestionCitasComponent implements OnInit {

  todasLasCitas: any[] = [];
  citasPasadas: any[] = [];
  citasHoy: any[] = [];
  citasFuturas: any[] = [];
  
  mascotas: any[] = [];
  veterinarios: any[] = [];

  fechaActual = new Date();
  diasCalendario: any[] = [];
  nombreMes = '';
  anioActual = 0;

  mostrarModalAgregar = false;
  mostrarModalDetalle = false;

  nuevaCita = {
    mascota_id: 0,
    veterinario_id: 0,
    tipo_cita_id: 1,
    fecha: '',
    hora: '',
    motivo: '',
    nombre_duenio: '' 
  };

  tiposCita: any[] = [];


  citaSeleccionada: any = null;

  constructor(
    private citasService: CitasService,
    private mascotasService: MascotasService,
    private veterinariosService: VeterinariosService,
    private clientesService: ClientesService,
    private configService: ConfiguracionService,
    
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.generarCalendario();
  }


  cargarDatosIniciales() {

    this.citasService.getCitas().subscribe((res: any) => {
        this.todasLasCitas = res.citas || [];
        this.clasificarCitas();
        this.generarCalendario();
    });
    this.mascotasService.getMascotas().subscribe((res: any) => this.mascotas = res.mascotas || []);
    this.veterinariosService.getVeterinarios().subscribe((res: any) => this.veterinarios = res.veterinarios || []);

    this.configService.getTiposCita().subscribe((res: any) => {
        this.tiposCita = res.tipos || [];
    });
  }

  


  generarCalendario() {
    this.anioActual = this.fechaActual.getFullYear();
    this.nombreMes = this.fechaActual.toLocaleString('es-ES', { month: 'long' });
    this.nombreMes = this.nombreMes.charAt(0).toUpperCase() + this.nombreMes.slice(1);

    const year = this.anioActual;
    const month = this.fechaActual.getMonth();

    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);
    
    const diasEnMes = ultimoDiaMes.getDate();
    const diaSemanaInicio = primerDiaMes.getDay(); 

    this.diasCalendario = [];


    for (let i = 0; i < diaSemanaInicio; i++) {
      this.diasCalendario.push({ fecha: null, citas: [] });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaStr = `${year}-${(month + 1).toString().padStart(2,'0')}-${dia.toString().padStart(2,'0')}`;
      const citasDelDia = this.todasLasCitas.filter(c => c.fecha_hora && c.fecha_hora.startsWith(fechaStr));
      this.diasCalendario.push({ fecha: dia, citas: citasDelDia });
    }
  }

    cambiarMes(delta: number) {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + delta);
    this.generarCalendario();
  }

  clasificarCitas() {
    const hoy = new Date().toISOString().split('T')[0];
    this.citasPasadas = this.todasLasCitas.filter(c => c.fecha_hora.split('T')[0] < hoy).slice(0, 5);
    this.citasHoy = this.todasLasCitas.filter(c => c.fecha_hora.split('T')[0] === hoy);
    this.citasFuturas = this.todasLasCitas.filter(c => c.fecha_hora.split('T')[0] > hoy).slice(0, 5);
  }

  onMascotaChange() {
    const mascota = this.mascotas.find(m => m.id == this.nuevaCita.mascota_id);
    this.nuevaCita.nombre_duenio = mascota ? (mascota.nombre_dueno || '') : '';
  }

  guardarCita() {
    if(!this.nuevaCita.mascota_id || !this.nuevaCita.fecha || !this.nuevaCita.hora) {
      Swal.fire('Atención', 'Faltan datos obligatorios', 'warning');
      return;
    }
    const fechaHora = `${this.nuevaCita.fecha} ${this.nuevaCita.hora}:00`;
    const datos = {
      mascota_id: this.nuevaCita.mascota_id,
      veterinario_id: this.nuevaCita.veterinario_id,
      tipo_cita_id: this.nuevaCita.tipo_cita_id, 
      fecha_hora: fechaHora,
      motivo: this.nuevaCita.motivo || 'Consulta General'
    };

    this.citasService.agendarCita(datos).subscribe(res => {
      if(res.exito) {
        Swal.fire('Éxito', 'Cita programada correctamente', 'success');
        this.cerrarModalAgregar();
        this.cargarDatosIniciales();
        this.nuevaCita = { mascota_id: 0, veterinario_id: 0, tipo_cita_id: 1, fecha: '', hora: '', motivo: '', nombre_duenio: '' };
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }

  abrirModalAgregar() { this.mostrarModalAgregar = true; }
  cerrarModalAgregar() { this.mostrarModalAgregar = false; }
  abrirModalDetalle(cita: any) { this.citaSeleccionada = cita; this.mostrarModalDetalle = true; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; }
 
}