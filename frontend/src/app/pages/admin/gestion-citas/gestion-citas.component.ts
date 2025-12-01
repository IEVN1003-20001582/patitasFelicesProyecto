import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { CitasService } from '../../../service/citas.service';
import { MascotasService } from '../../../service/mascotas.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ClientesService } from '../../../service/clientes.service';
import { ConfiguracionService } from '../../../service/configuracion.service';

@Component({
  selector: 'app-gestion-citas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-citas.component.html',
 
  providers: [DatePipe]
})
export class GestionCitasComponent implements OnInit {

  todasLasCitas: any[] = [];
  citasPasadas: any[] = [];
  citasHoy: any[] = [];
  citasFuturas: any[] = [];
  
  mascotas: any[] = [];
  veterinarios: any[] = [];
  tiposCita: any[] = []; 
  
  fechaActual = new Date();
  nombreMes = '';
  anioActual = 0;
  diasCalendario: any[] = [];

  mostrarModalAgregar = false;
  mostrarModalDetalle = false;
  
  nuevaCita = {
    mascota_id: 0,
    veterinario_id: 0,
    tipo_cita_id: 0, 
    fecha: '',
    hora: '',
    motivo: '',
    nombre_duenio: '' 
  };

  citaSeleccionada: any = null;

  constructor(
    private citasService: CitasService,
    private mascotasService: MascotasService,
    private veterinariosService: VeterinariosService,
    private clientesService: ClientesService,
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.nuevaCita.fecha = hoy;
    this.cargarDatosIniciales();
    this.generarCalendario();
  }

 
  getFechaLocal(fecha: Date): string {
    const offset = fecha.getTimezoneOffset() * 60000;
    return (new Date(fecha.getTime() - offset)).toISOString().slice(0, 10);
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
        if(this.tiposCita.length > 0) this.nuevaCita.tipo_cita_id = this.tiposCita[0].id;
    });
  }

  clasificarCitas() {
    const hoyStr = this.getFechaLocal(new Date());
    
 
    this.citasPasadas = this.todasLasCitas.filter(c => {
        const fechaCita = c.fecha_hora.split('T')[0];
        return fechaCita < hoyStr || c.estado === 'completada' || c.estado === 'cancelada';
    }).slice(0, 5);


    this.citasHoy = this.todasLasCitas.filter(c => c.fecha_hora.startsWith(hoyStr));
    this.citasHoy.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));


    this.citasFuturas = this.todasLasCitas.filter(c => {
        const fechaCita = c.fecha_hora.split('T')[0];
        return fechaCita > hoyStr && c.estado !== 'cancelada' && c.estado !== 'completada';
    }).slice(0, 5);
  }



  generarCalendario() {
    this.anioActual = this.fechaActual.getFullYear();
    this.nombreMes = this.fechaActual.toLocaleString('es-ES', { month: 'long' });
    this.nombreMes = this.nombreMes.charAt(0).toUpperCase() + this.nombreMes.slice(1);
    const year = this.anioActual;
    const month = this.fechaActual.getMonth();
    const primerDiaMes = new Date(year, month, 1).getDay(); 
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    this.diasCalendario = [];
    for (let i = 0; i < primerDiaMes; i++) this.diasCalendario.push({ fecha: null, citas: [] });
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const mesStr = (month + 1).toString().padStart(2, '0');
      const diaStr = dia.toString().padStart(2, '0');
      const fechaStr = `${year}-${mesStr}-${diaStr}`;
      const citasDia = this.todasLasCitas.filter(c => c.fecha_hora.startsWith(fechaStr));
      this.diasCalendario.push({ fecha: dia, citas: citasDia });
    }
  }

  cambiarMes(delta: number) {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + delta);
    this.generarCalendario();
  }

  onMascotaChange() {
    const id = Number(this.nuevaCita.mascota_id);
    const mascota = this.mascotas.find(m => m.id === id);
    this.nuevaCita.nombre_duenio = mascota ? (mascota.nombre_dueno || 'Sin dueño') : '';
  }


  guardarCita() {
    if (!this.nuevaCita.mascota_id || !this.nuevaCita.fecha || !this.nuevaCita.hora) {
        Swal.fire('Faltan datos', 'Todos los campos son obligatorios', 'warning');
        return;
    }


    const fechaHoraStr = `${this.nuevaCita.fecha}T${this.nuevaCita.hora}:00`;
    const fechaCita = new Date(fechaHoraStr);
    const ahoraMas30 = new Date();
    ahoraMas30.setMinutes(ahoraMas30.getMinutes() + 29);

    if (fechaCita < ahoraMas30) {
        Swal.fire('Hora inválida', 'La cita debe ser al menos 30 minutos en el futuro.', 'warning');
        return;
    }

    const fechaHoraSQL = `${this.nuevaCita.fecha} ${this.nuevaCita.hora}:00`;
    
    const payload = {
        mascota_id: this.nuevaCita.mascota_id,
        veterinario_id: this.nuevaCita.veterinario_id || null,
        tipo_cita_id: this.nuevaCita.tipo_cita_id,
        fecha_hora: fechaHoraSQL,
        motivo: this.nuevaCita.motivo,
        estado: 'confirmada'
    };

    this.citasService.agendarCita(payload).subscribe(res => {
        if (res.exito) {
            Swal.fire('Guardado', 'Cita programada y confirmada', 'success');
            this.cerrarModalAgregar();
            this.cargarDatosIniciales(); 
            
            const hoy = new Date().toISOString().split('T')[0];
            this.nuevaCita = { mascota_id: 0, veterinario_id: 0, tipo_cita_id: this.tiposCita[0]?.id||1, fecha: hoy, hora: '', motivo: '', nombre_duenio: '' };
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