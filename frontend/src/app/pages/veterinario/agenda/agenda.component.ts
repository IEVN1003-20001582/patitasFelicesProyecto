import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { CitasService } from '../../../service/citas.service';
import { AuthService } from '../../../service/auth.service';
import { MascotasService } from '../../../service/mascotas.service';
import { ConfiguracionService } from '../../../service/configuracion.service'; 
import { VeterinariosService } from '../../../service/veterinarios.service'; // IMPORTANTE

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
  citasHoy: any[] = [];
  pacientesPorVer: number = 0;
  
  fechaActual = new Date();
  nombreMes = '';
  anioActual = 0;
  diasCalendario: any[] = [];

  mascotas: any[] = [];
  tiposCita: any[] = []; 


  todosVeterinarios: any[] = [];
  veterinariosDisponibles: any[] = [];

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

  cargarPerfilYDatos() {
    if (!this.usuarioActual) return;

   
    this.veterinariosService.getVeterinarios().subscribe((res: any) => {
        this.todosVeterinarios = res.veterinarios || [];
        
      
        this.perfilVeterinario = this.todosVeterinarios.find((v: any) => v.user_id === this.usuarioActual.id);

        if (this.perfilVeterinario) {
            console.log('Perfil Veterinario Encontrado:', this.perfilVeterinario);
      
            this.cargarCitas();
            
         
            this.nuevaCita.veterinario_id = this.perfilVeterinario.id;
        } else {
            console.error('No se encontró perfil veterinario para usuario', this.usuarioActual.id);
            Swal.fire('Error de Cuenta', 'Tu usuario no tiene un perfil de veterinario asociado. Contacta al administrador.', 'error');
        }
        
        
        this.veterinariosDisponibles = [...this.todosVeterinarios];
    });

    
    this.mascotasService.getMascotas().subscribe((res: any) => {
      this.mascotas = res.mascotas || [];
    });

    this.configService.getTiposCita().subscribe((res: any) => {
        this.tiposCita = res.tipos || [];
        if (this.tiposCita.length > 0) {
            this.nuevaCita.tipo_cita_id = this.tiposCita[0].id;
        }
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
    const hoyStr = new Date().toISOString().split('T')[0];
    this.citasHoy = this.todasCitas.filter(c => c.fecha_hora.startsWith(hoyStr));
    this.citasHoy.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
    this.pacientesPorVer = this.citasHoy.filter(c => c.estado === 'pendiente' || c.estado === 'confirmada').length;
  }

  
  filtrarVeterinariosPorHora() {
    if (!this.nuevaCita.hora) {
        this.veterinariosDisponibles = [...this.todosVeterinarios];
        return;
    }

    const hora = parseInt(this.nuevaCita.hora.split(':')[0]);

    this.veterinariosDisponibles = this.todosVeterinarios.filter(v => {
        if (v.turno === 'Completo') return true;
        if (v.turno === 'Matutino' && hora < 14) return true;
        if (v.turno === 'Vespertino' && hora >= 14) return true;
        return false;
    });
    
 
    
    const seleccionadoSigueDisponible = this.veterinariosDisponibles.find(v => v.id == this.nuevaCita.veterinario_id);
    
    if (!seleccionadoSigueDisponible && this.veterinariosDisponibles.length > 0) {
  
        this.nuevaCita.veterinario_id = this.veterinariosDisponibles[0].id;
    } else if (!seleccionadoSigueDisponible) {
        this.nuevaCita.veterinario_id = 0;
    }
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

    for (let i = 0; i < primerDiaMes; i++) {
      this.diasCalendario.push({ fecha: null, citas: [] });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaStr = `${year}-${(month + 1).toString().padStart(2,'0')}-${dia.toString().padStart(2,'0')}`;
      const citasDia = this.todasCitas.filter(c => c.fecha_hora.startsWith(fechaStr));
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
    if (mascota) {
        this.nuevaCita.cliente_nombre = mascota.nombre_dueno;
    } else {
        this.nuevaCita.cliente_nombre = '';
    }
  }

  guardarCita() {
      if (!this.nuevaCita.mascota_id || !this.nuevaCita.fecha || !this.nuevaCita.hora || !this.nuevaCita.veterinario_id) {
          Swal.fire('Atención', 'Completa los campos obligatorios', 'warning');
          return;
      }
 
      const fechaHora = `${this.nuevaCita.fecha} ${this.nuevaCita.hora}:00`;
      
      const payload = {
          mascota_id: this.nuevaCita.mascota_id,
          veterinario_id: this.nuevaCita.veterinario_id, 
          fecha_hora: fechaHora,
          motivo: this.nuevaCita.motivo,
          tipo_cita_id: this.nuevaCita.tipo_cita_id
      };

      this.citasService.agendarCita(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Agendada', 'Cita guardada correctamente', 'success');
              this.cerrarModalCita();
              this.cargarCitas(); 
              
              const hoy = new Date().toISOString().split('T')[0];
       
              this.nuevaCita = { 
                  mascota_id: 0, 
                  cliente_nombre: '', 
                  fecha: hoy, 
                  hora: '', 
                  tipo_cita_id: this.tiposCita.length > 0 ? this.tiposCita[0].id : 1, 
                  veterinario_id: this.perfilVeterinario ? this.perfilVeterinario.id : 0,
                  motivo: '' 
              };
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }

  irAlHistorial(mascotaId: number) {
      this.router.navigate(['/veterinario/pacientes'], { queryParams: { mascota_id: mascotaId } });
  }


  confirmarCita() {
      if (!this.citaSeleccionada) return;
      this.citasService.actualizarCita(this.citaSeleccionada.id, { estado: 'confirmada' }).subscribe(res => {
          if (res.exito) {
              Swal.fire('Confirmada', 'La cita ha sido confirmada.', 'success');
              this.cerrarModalDetalle();
              this.cargarCitas();
          }
      });
  }

  cancelarCita() {
      if (!this.citaSeleccionada) return;
      Swal.fire({
        title: '¿Cancelar?', text: 'No se puede deshacer', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, cancelar'
      }).then((r) => {
          if(r.isConfirmed) {
              this.citasService.actualizarCita(this.citaSeleccionada.id, { estado: 'cancelada' }).subscribe(res => {
                  if(res.exito) { Swal.fire('Cancelada', 'Cita cancelada.', 'success'); this.cerrarModalDetalle(); this.cargarCitas(); }
              });
          }
      });
  }


  abrirModalCita() { this.mostrarModalCita = true; }
  cerrarModalCita() { this.mostrarModalCita = false; }
  
  abrirModalDetalle(cita: any) {
    this.citaSeleccionada = cita;
    this.mostrarModalDetalle = true; 
  }
  cerrarModalDetalle() { this.mostrarModalDetalle = false; }
}