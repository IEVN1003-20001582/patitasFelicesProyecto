import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Cliente } from '../../../interfaces/cliente.interface';
import { ClientesService } from '../../../service/clientes.service';
import { MascotasService } from '../../../service/mascotas.service';

@Component({
  selector: 'app-gestion-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-clientes.component.html',
  
})
export class GestionClientesComponent implements OnInit {

  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  mascotasCliente: any[] = []; 
  
  kpis = { total: 0, nuevos: 0, activos: 0 };

  mostrarModalAgregar = false;
  mostrarModalEditar = false;
  mostrarModalEliminar = false; 
  mostrarModalFiltros = false;
  mostrarModalVistaRapida = false;

  textoBusqueda = '';
  nuevoCliente: Cliente = this.initCliente();
  clienteEditando: Cliente = this.initCliente();
  clienteSeleccionado: any = null;

  constructor(
    private clientesService: ClientesService,
    private mascotasService: MascotasService
  
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe((res: any) => {
      const listaRaw = res.clientes || (Array.isArray(res) ? res : []);
      
      this.clientes = listaRaw.map((c: any) => ({
        id: c.id,
        nombre: c.nombre_completo,
        email: c.email_contacto,
        telefono: c.telefono,
        direccion: c.direccion,
        num_mascotas: c.num_mascotas || 0,
        estado: c.estado || 'Activo' 
      }));

      this.clientesFiltrados = [...this.clientes];
      this.calcularKPIs();
    });
  }

  calcularKPIs() {
    this.kpis.total = this.clientes.length;
    this.kpis.activos = this.clientes.filter(c => c.estado === 'Activo').length;
    this.kpis.nuevos = Math.floor(this.clientes.length * 0.1); 
  }

  filtrarClientes() {
    const texto = this.textoBusqueda.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c => 
      c.nombre.toLowerCase().includes(texto) || 
      c.email.toLowerCase().includes(texto)
    );
  }


  guardarCliente() {
    if (!this.nuevoCliente.nombre || !this.nuevoCliente.email) {
      Swal.fire('Error', 'Nombre y Email son obligatorios', 'warning');
      return;
    }
    
    this.clientesService.agregarCliente(this.nuevoCliente).subscribe(res => {
      if (res.exito) {
        Swal.fire('Guardado', 'Cliente registrado', 'success');
        this.cerrarModalAgregar();
        this.cargarClientes();
        this.nuevoCliente = this.initCliente();
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }

  guardarEdicion() {
    if (!this.clienteEditando.nombre || !this.clienteEditando.id) return;

    this.clientesService.actualizarCliente(this.clienteEditando.id, this.clienteEditando).subscribe(res => {
      if (res.exito) {
        Swal.fire('Actualizado', 'Datos actualizados', 'success');
        this.cerrarModalEditar();
        this.cargarClientes();
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }

  confirmarEliminar() {
    if (!this.clienteSeleccionado) return;

    this.clientesService.eliminarCliente(this.clienteSeleccionado.id).subscribe(res => {
      if (res.exito) {
        Swal.fire('Archivado', 'Cliente marcado como inactivo', 'success');
        this.cerrarModalEliminar();
        this.cargarClientes(); 
      } else {
        Swal.fire('Error', res.mensaje, 'error');
      }
    });
  }

  abrirVistaRapida(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.mascotasCliente = [];
    this.mostrarModalVistaRapida = true;

    this.mascotasService.getMascotas(cliente.id).subscribe((res: any) => {
        const lista = res.mascotas || (Array.isArray(res) ? res : []);
        this.mascotasCliente = lista;
    });
  }

  cerrarVistaRapida() { 
    this.mostrarModalVistaRapida = false; 
    this.clienteSeleccionado = null;
  }

  abrirModalAgregar() { this.mostrarModalAgregar = true; }
  cerrarModalAgregar() { this.mostrarModalAgregar = false; }

  abrirModalEditar(cliente: any) {
    this.clienteEditando = { ...cliente };
    this.mostrarModalEditar = true;
  }
  cerrarModalEditar() { this.mostrarModalEditar = false; }

  abrirModalEliminar(cliente: any) {
    this.clienteSeleccionado = cliente;
    this.mostrarModalEliminar = true;
  }
  cerrarModalEliminar() { this.mostrarModalEliminar = false; }


  
  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }

  initCliente(): Cliente { return { nombre: '', email: '', telefono: '', direccion: '' }; }
}