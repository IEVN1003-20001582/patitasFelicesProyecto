import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { CitasService } from '../../../service/citas.service';
import { AuthService } from '../../../service/auth.service';
import { MascotasService } from '../../../service/mascotas.service';
import { ConfiguracionService } from '../../../service/configuracion.service'; 
import { VeterinariosService } from '../../../service/veterinarios.service';

@Component({
  selector: 'app-agenda-veterinario',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agenda.component.html',

})
export class AgendaComponent implements OnInit {

  usuarioActual: any = null;
  perfilVeterinario: any = null; 

  todasCitas: any[] = [];
  
  // Listas Filtradas
  citasHoyFuturas: any[] = []; 
  salaEspera: any[] = [];      
  historialReciente: any[] = []; 

  pacientesPorVer: number = 0;
  
  fechaActual = new Date();
  nombreMes = '';
  anioActual = 0;
  diasCalendario: any[] = [];

  mascotas: any[] = [];
  tiposCita: any[] = []; 

  mostrarModalCita = false;
  mostrarModalDetalle = false;
  citaSeleccionada: any = null;
  
  nuevaCita = {
    mascota_id: 0,
    cliente_nombre: '',
    fecha: '',
    hora: '',
    tipo_cita_id: 0,
    veterinario_id: 0, 
    motivo: ''
  };

  constructor(
    private citasService: CitasService,
    private authService: AuthService,
    private mascotasService: MascotasService,
    private configService: ConfiguracionService, 
    private veterinariosService: VeterinariosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActualValue();
    const hoy = new Date().toISOString().split('T')[0];
    this.nuevaCita.fecha = hoy;
    this.cargarPerfilYDatos();
  }


  getFechaLocal(fecha: Date): string {
    const offset = fecha.getTimezoneOffset() * 60000;
    return (new Date(fecha.getTime() - offset)).toISOString().slice(0, 10);
  }

  esFuturo(fechaHoraStr: string): boolean {
      const fechaCita = new Date(fechaHoraStr);
      const ahora = new Date();
      return fechaCita > ahora;
  }

  cargarPerfilYDatos() {
    if (!this.usuarioActual) return;

    this.veterinariosService.getVeterinarios().subscribe((res: any) => {
        const lista = res.veterinarios || [];
        this.perfilVeterinario = lista.find((v: any) => v.user_id === this.usuarioActual.id);

        if (this.perfilVeterinario) {
            this.cargarCitas();
        } else {
            Swal.fire('Error', 'No tienes perfil de veterinario asignado.', 'error');
        }
    });

    this.mascotasService.getMascotas().subscribe((res: any) => this.mascotas = res.mascotas || []);
    this.configService.getTiposCita().subscribe((res: any) => {
        this.tiposCita = res.tipos || [];
        if (this.tiposCita.length > 0) this.nuevaCita.tipo_cita_id = this.tiposCita[0].id;
    });
  }

  cargarCitas() {
    if (!this.perfilVeterinario) return;
    this.citasService.getCitas({ veterinario_id: this.perfilVeterinario.id }).subscribe((res: any) => {
      this.todasCitas = res.citas || [];
      this.procesarCitas();
      this.generarCalendario();
    });
  }

  procesarCitas() {
    const hoyStr = this.getFechaLocal(new Date());
    const ahora = new Date();


    this.citasHoyFuturas = this.todasCitas.filter(c => {
        const esHoy = c.fecha_hora.startsWith(hoyStr);
        const esFutura = new Date(c.fecha_hora) > ahora;
        const esActiva = c.estado === 'pendiente' || c.estado === 'confirmada';
        return esHoy && esFutura && esActiva;
    });
    this.citasHoyFuturas.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

 
    this.salaEspera = this.todasCitas.filter(c => {
        const esHoy = c.fecha_hora.startsWith(hoyStr);
        return esHoy && c.estado === 'confirmada';
    });


    this.historialReciente = this.todasCitas.filter(c => 
        c.estado === 'completada' || c.estado === 'cancelada' || 
        (new Date(c.fecha_hora) < ahora && c.estado !== 'confirmada' && c.estado !== 'pendiente') // Incluir pasadas no procesadas
    );
  
    this.historialReciente.sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));

   
    this.pacientesPorVer = this.citasHoyFuturas.length;
  }

  guardarCita() {
      if (!this.nuevaCita.mascota_id || !this.nuevaCita.fecha || !this.nuevaCita.hora) {
          Swal.fire('Atención', 'Completa los campos obligatorios', 'warning');
          return;
      }
      

      const fechaHoraStr = `${this.nuevaCita.fecha}T${this.nuevaCita.hora}:00`;
      const fechaCita = new Date(fechaHoraStr);
      const ahoraMas30 = new Date();
      ahoraMas30.setMinutes(ahoraMas30.getMinutes() + 30);

      if (fechaCita < ahoraMas30) {
          Swal.fire('Hora inválida', 'Debes programar la cita con al menos 30 minutos de antelación.', 'warning');
          return;
      }

      if (!this.perfilVeterinario) {
          Swal.fire('Error', 'No se identificó tu perfil médico.', 'error');
          return;
      }

      const fechaHoraSQL = `${this.nuevaCita.fecha} ${this.nuevaCita.hora}:00`;
      
      const payload = {
          mascota_id: this.nuevaCita.mascota_id,
          veterinario_id: this.perfilVeterinario.id, 
          fecha_hora: fechaHoraSQL,
          motivo: this.nuevaCita.motivo,
          tipo_cita_id: this.nuevaCita.tipo_cita_id,
          estado: 'confirmada' 
      };

      this.citasService.agendarCita(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Agendada', 'Cita guardada y confirmada', 'success');
              this.cerrarModalCita();
              this.cargarCitas(); 
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
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
      const citasDia = this.todasCitas.filter(c => c.fecha_hora.startsWith(fechaStr));
      this.diasCalendario.push({ fecha: dia, citas: citasDia });
    }
  }
  cambiarMes(delta: number) { this.fechaActual.setMonth(this.fechaActual.getMonth() + delta); this.generarCalendario(); }
  onMascotaChange() { const id = Number(this.nuevaCita.mascota_id); const mascota = this.mascotas.find(m => m.id === id); this.nuevaCita.cliente_nombre = mascota ? mascota.nombre_dueno : ''; }
  confirmarCita() { if (!this.citaSeleccionada) return; this.citasService.actualizarCita(this.citaSeleccionada.id, { estado: 'confirmada' }).subscribe(res => { if (res.exito) { Swal.fire('Confirmada', 'La cita ha sido confirmada.', 'success'); this.cerrarModalDetalle(); this.cargarCitas(); } }); }
  finalizarCita() { if (!this.citaSeleccionada) return; Swal.fire({ title: '¿Finalizar?', icon: 'question', showCancelButton: true, confirmButtonColor: '#48C9B0', confirmButtonText: 'Sí' }).then((r) => { if (r.isConfirmed) { this.citasService.actualizarCita(this.citaSeleccionada.id, { estado: 'completada' }).subscribe(res => { if (res.exito) { Swal.fire('Completada', 'Cita finalizada.', 'success'); this.cerrarModalDetalle(); this.cargarCitas(); } }); } }); }
  cancelarCita() { if (!this.citaSeleccionada) return; Swal.fire({ title: '¿Cancelar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí' }).then((r) => { if (r.isConfirmed) { this.citasService.actualizarCita(this.citaSeleccionada.id, { estado: 'cancelada' }).subscribe(res => { if (res.exito) { Swal.fire('Cancelada', 'Cita cancelada.', 'success'); this.cerrarModalDetalle(); this.cargarCitas(); } }); } }); }
  irAlHistorial(mascotaId: number) { this.router.navigate(['/veterinario/pacientes'], { queryParams: { mascota_id: mascotaId } }); }
  abrirModalCita() { this.mostrarModalCita = true; }
  cerrarModalCita() { this.mostrarModalCita = false; }
  abrirModalDetalle(cita: any) { this.citaSeleccionada = cita; this.mostrarModalDetalle = true; }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; }
}