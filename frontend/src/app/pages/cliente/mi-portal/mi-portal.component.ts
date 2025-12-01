import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { AuthService } from '../../../service/auth.service';
import { MascotasService } from '../../../service/mascotas.service';
import { CitasService } from '../../../service/citas.service';
import { FacturasService } from '../../../service/facturas.service';
import { ClientesService } from '../../../service/clientes.service';
import { VeterinariosService } from '../../../service/veterinarios.service';
import { ConfiguracionService } from '../../../service/configuracion.service';

@Component({
  selector: 'app-mi-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-portal.component.html',
 
})
export class MiPortalComponent implements OnInit {

  usuarioActual: any = null;
  clientePerfil: any = null;


  misMascotas: any[] = [];
  misCitasActivas: any[] = []; 
  misCitasHistorial: any[] = []; 
  misFacturas: any[] = [];
  
  todosVeterinarios: any[] = [];
  veterinariosDisponibles: any[] = [];
  tiposCita: any[] = []; 

  historialMascota: any[] = [];
  vacunasMascota: any[] = [];
  
  mostrarModalSolicitar = false;
  mostrarModalFacturas = false;
  mostrarModalPerfil = false;
  mostrarModalDetalleMascota = false;
  mostrarModalAgregarMascota = false;
  mostrarModalNotificaciones = false;

  solicitudCita = { 
      mascota_id: 0, 
      tipo_cita_id: 0,
      fecha: '', 
      hora: '', 
      comentarios: '', 
      veterinario_id: 0 
  };

    
  nuevaMascota = { 
      nombre: '', 
      especie: '', 
      raza: '', 
      fecha_nacimiento: '', 
      sexo: 'Macho', 
      peso: 0, 
      alergias: '',
      foto_url: '' 
  };
  


  passwordForm = { actual: '', nueva: '', confirmar: '' };
  

  mascotaSeleccionada: any = null;
  tabActivaMascota = 'info';

  constructor(
    private authService: AuthService,
    private mascotasService: MascotasService,
    private citasService: CitasService,
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private veterinariosService: VeterinariosService, 
    private configService: ConfiguracionService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActualValue();
    if (this.usuarioActual) {
        this.cargarPerfilCliente();
    }
    this.cargarVeterinarios();
    this.cargarTiposCita();
  }
  
  cargarVeterinarios() {
      this.veterinariosService.getVeterinarios().subscribe((res: any) => {
          this.todosVeterinarios = res.veterinarios || [];
          this.veterinariosDisponibles = []; 
      });
  }
  
  cargarTiposCita() {
      this.configService.getTiposCita().subscribe((res: any) => {
          this.tiposCita = res.tipos || [];
      });
  }

  cargarPerfilCliente() {
    this.clientesService.getClientes().subscribe((res: any) => {
        const todos = res.clientes || [];
        this.clientePerfil = todos.find((c: any) => c.user_id === this.usuarioActual.id);

        if (this.clientePerfil) {
            this.cargarMisDatos();
        }
    });
  }

  cargarMisDatos() {
    if (!this.clientePerfil) return;
    const clienteId = this.clientePerfil.id;

    this.mascotasService.getMascotas(clienteId).subscribe((res: any) => {
        this.misMascotas = res.mascotas || [];
    });


    this.citasService.getCitas().subscribe((res: any) => {
        const todas = res.citas || [];
        const ahora = new Date();
        
       
        const citasCliente = todas.filter((c: any) => c.nombre_cliente === this.clientePerfil.nombre_completo);


        this.misCitasActivas = citasCliente.filter((c: any) => {
            const fechaCita = new Date(c.fecha_hora);
            const esFuturo = fechaCita >= ahora;
            const esEstadoActivo = c.estado === 'pendiente' || c.estado === 'confirmada';
            return esFuturo && esEstadoActivo;
        });
        this.misCitasActivas.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));


        this.misCitasHistorial = citasCliente.filter((c: any) => !this.misCitasActivas.includes(c));
    });

    this.facturasService.getFacturas().subscribe((res: any) => {
        const todas = res.facturas || [];
        this.misFacturas = todas.filter((f: any) => f.cliente_id === clienteId);
    });
  }

  filtrarVeterinarios() {
      if (!this.solicitudCita.hora) {
          this.veterinariosDisponibles = [];
          return;
      }
      const hora = parseInt(this.solicitudCita.hora.split(':')[0]);
      this.veterinariosDisponibles = this.todosVeterinarios.filter(v => {
          if (v.turno === 'Completo') return true;
          if (v.turno === 'Matutino' && hora < 14) return true;
          if (v.turno === 'Vespertino' && hora >= 14) return true;
          return false;
      });
      this.solicitudCita.veterinario_id = 0;
  }

  solicitarCita() {
      if (!this.solicitudCita.mascota_id || !this.solicitudCita.fecha || !this.solicitudCita.hora || !this.solicitudCita.tipo_cita_id) {
          Swal.fire('Atención', 'Completa los campos obligatorios', 'warning');
          return;
      }
      if (!this.solicitudCita.veterinario_id) {
          Swal.fire('Atención', 'Selecciona un veterinario', 'warning');
          return;
      }
      

      const fechaHoraStr = `${this.solicitudCita.fecha}T${this.solicitudCita.hora}:00`;
      const fechaCita = new Date(fechaHoraStr);
      const ahoraMas30 = new Date();
      ahoraMas30.setMinutes(ahoraMas30.getMinutes() + 29);

      if (fechaCita < ahoraMas30) {
          Swal.fire('Hora no disponible', 'Debes solicitar con 30 minutos de anticipación.', 'error');
          return;
      }
      
      const fechaHoraSQL = `${this.solicitudCita.fecha} ${this.solicitudCita.hora}:00`;
      const tipoObj = this.tiposCita.find(t => t.id == this.solicitudCita.tipo_cita_id);
      const nombreTipo = tipoObj ? tipoObj.nombre : 'Cita';

      const payload = {
          mascota_id: this.solicitudCita.mascota_id,
          veterinario_id: this.solicitudCita.veterinario_id,
          fecha_hora: fechaHoraSQL,
          motivo: `${nombreTipo}${this.solicitudCita.comentarios ? ': ' + this.solicitudCita.comentarios : ''}`,
          tipo_cita_id: this.solicitudCita.tipo_cita_id,
          estado: 'pendiente' 
      };

      this.citasService.agendarCita(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire({
                  title: 'Solicitud Enviada',
                  text: 'Tu cita está pendiente de confirmación.',
                  icon: 'success',
                  confirmButtonColor: '#48C9B0'
              });
              this.cerrarModalSolicitar();
              this.cargarMisDatos();
              this.solicitudCita = { mascota_id: 0, tipo_cita_id: 0, fecha: '', hora: '', comentarios: '', veterinario_id: 0 };
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }

  registrarMascota() {
      if(!this.nuevaMascota.nombre) {
          Swal.fire('Atención', 'El nombre es obligatorio', 'warning');
          return;
      }
      
      const payload = { 
          ...this.nuevaMascota, 
          cliente_id: this.clientePerfil.id 
      };
      
      this.mascotasService.agregarMascota(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Registrado', 'Tu mascota ha sido agregada', 'success');
              this.cerrarModalAgregarMascota();
              this.cargarMisDatos();
              // Reset completo
              this.nuevaMascota = { nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0, alergias: '', foto_url: '' };
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }

 guardarPerfil() {
      if (!this.clientePerfil.id) return;

    
      const payload = {
          nombre: this.clientePerfil.nombre_completo,
          email: this.clientePerfil.email_contacto,   
          telefono: this.clientePerfil.telefono,
          direccion: this.clientePerfil.direccion
      };

      this.clientesService.actualizarCliente(this.clientePerfil.id, payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Guardado', 'Tu información ha sido actualizada. Si cambiaste tu correo, úsalo para iniciar sesión la próxima vez.', 'success');
              this.cerrarModalPerfil();
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }


  cambiarPassword() {
      if (this.passwordForm.nueva !== this.passwordForm.confirmar) {
          Swal.fire('Error', 'Las contraseñas nuevas no coinciden', 'warning');
          return;
      }
      
      const payload = {
          user_id: this.usuarioActual.id,
          actual: this.passwordForm.actual,
          nueva: this.passwordForm.nueva
      };

      this.configService.cambiarPassword(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
              this.passwordForm = { actual: '', nueva: '', confirmar: '' };
          } else {
              Swal.fire('Error', res.mensaje, 'error');
          }
      });
  }
  
  abrirModalDetalle(mascota: any) {
      this.mascotaSeleccionada = mascota;
      this.tabActivaMascota = 'info';
      this.mostrarModalDetalleMascota = true;
      this.mascotasService.getHistorial(mascota.id).subscribe((res:any) => this.historialMascota = res.historial || []);
      this.mascotasService.getVacunas(mascota.id).subscribe((res:any) => this.vacunasMascota = res.vacunas || []);
  }

  abrirModalSolicitar() { this.mostrarModalSolicitar = true; }
  cerrarModalSolicitar() { this.mostrarModalSolicitar = false; }
  abrirModalFacturas() { this.mostrarModalFacturas = true; }
  cerrarModalFacturas() { this.mostrarModalFacturas = false; }
  abrirModalPerfil() { this.mostrarModalPerfil = true; }
  cerrarModalPerfil() { this.mostrarModalPerfil = false; }
  abrirModalAgregarMascota() { this.mostrarModalAgregarMascota = true; }
  cerrarModalAgregarMascota() { this.mostrarModalAgregarMascota = false; }
  cerrarModalDetalle() { this.mostrarModalDetalleMascota = false; }
  abrirNotificaciones() { this.mostrarModalNotificaciones = true; }
  cerrarNotificaciones() { this.mostrarModalNotificaciones = false; }
  cambiarTabMascota(tab: string) { this.tabActivaMascota = tab; }
}