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
  misCitas: any[] = [];
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

  nuevaMascota = { nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0, foto_url: '' };
  
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
        this.misCitas = todas.filter((c: any) => c.nombre_cliente === this.clientePerfil.nombre_completo);
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
          Swal.fire('Atención', 'Por favor completa todos los campos obligatorios', 'warning');
          return;
      }
      
      if (!this.solicitudCita.veterinario_id) {
          Swal.fire('Atención', 'Selecciona un veterinario disponible', 'warning');
          return;
      }
      
      const fechaHora = `${this.solicitudCita.fecha} ${this.solicitudCita.hora}:00`;
      
      
      const tipoObj = this.tiposCita.find(t => t.id == this.solicitudCita.tipo_cita_id);
      const nombreTipo = tipoObj ? tipoObj.nombre : 'Cita';

      const payload = {
          mascota_id: this.solicitudCita.mascota_id,
          veterinario_id: this.solicitudCita.veterinario_id,
          fecha_hora: fechaHora,

          motivo: `${nombreTipo}${this.solicitudCita.comentarios ? ': ' + this.solicitudCita.comentarios : ''}`,
          tipo_cita_id: this.solicitudCita.tipo_cita_id 
      };

      this.citasService.agendarCita(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire({
                  title: 'Solicitud Enviada',
                  text: 'Tu cita está pendiente. El veterinario la confirmará pronto.',
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
      if(!this.nuevaMascota.nombre) return;
      const payload = { ...this.nuevaMascota, cliente_id: this.clientePerfil.id };
      this.mascotasService.agregarMascota(payload).subscribe(res => {
          if(res.exito) {
              Swal.fire('Registrado', 'Tu mascota ha sido agregada', 'success');
              this.cerrarModalAgregarMascota();
              this.cargarMisDatos();
              this.nuevaMascota = { nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0, foto_url: '' };
          }
      });
  }

  guardarPerfil() {
      this.clientesService.actualizarCliente(this.clientePerfil.id, this.clientePerfil).subscribe(res => {
          if(res.exito) Swal.fire('Guardado', 'Tus datos se actualizaron', 'success');
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