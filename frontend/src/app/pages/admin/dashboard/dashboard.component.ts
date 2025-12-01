import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';


import { ClientesService } from '../../../service/clientes.service';
import { MascotasService } from '../../../service/mascotas.service';
import { CitasService } from '../../../service/citas.service';
import { FacturasService } from '../../../service/facturas.service';
import { ProductosService } from '../../../service/productos.service';


import { Cliente } from '../../../interfaces/cliente.interface';
import { Mascota } from '../../../interfaces/mascota.interface';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  
})
export class DashboardComponent implements OnInit {

  // KPIs
  totalClientes = 0;
  totalMascotas = 0;
  citasHoyCount = 0;
  ingresosDia = 0;

 
  proximasCitas: any[] = [];
  alertasInventario: any[] = [];

  // Datos para Gráficos (Simulados visualmente con CSS en el HTML)

  ingresosMensuales = [4500, 5200, 4800, 6100, 5900, 7200]; // Ejemplo


  mostrarModalCita = false;
  mostrarModalCliente = false;
  mostrarModalMascota = false;


  nuevoCliente: Cliente = { nombre: '', email: '', telefono: '', direccion: '' };
  nuevaMascota: Mascota = { cliente_id: 0, nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0 };
  

  clientesList: any[] = [];

  constructor(
    private clientesService: ClientesService,
    private mascotasService: MascotasService,
    private citasService: CitasService,
    private facturasService: FacturasService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
 
    this.clientesService.getClientes().subscribe((res: any) => {
      const lista = res.clientes || [];
      this.totalClientes = lista.length;
      this.clientesList = lista; 
    });


    this.mascotasService.getMascotas().subscribe((res: any) => {
      const lista = res.mascotas || [];
      this.totalMascotas = lista.length;
    });

  
    this.citasService.getCitas().subscribe((res: any) => {
      const todas = res.citas || [];
      const hoyStr = new Date().toISOString().split('T')[0];
      
 
      const citasHoy = todas.filter((c: any) => c.fecha_hora.startsWith(hoyStr));
      this.citasHoyCount = citasHoy.length;

  
      this.proximasCitas = todas
        .filter((c: any) => c.fecha_hora >= hoyStr && (c.estado === 'pendiente' || c.estado === 'confirmada'))
        .sort((a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
        .slice(0, 5);
    });


    this.facturasService.getFacturas().subscribe((res: any) => {
      const todas = res.facturas || [];
      const hoyStr = new Date().toISOString().split('T')[0];
      
 
      this.ingresosDia = todas
        .filter((f: any) => f.fecha_emision.startsWith(hoyStr) && f.estado === 'pagada')
        .reduce((acc: number, f: any) => acc + parseFloat(f.total), 0);
    });


    this.productosService.getProductos().subscribe((res: any) => {
      const todos = res.productos || [];
      this.alertasInventario = todos.filter((p: any) => p.stock_actual <= p.stock_minimo);
    });
  }



  guardarClienteRapido() {
    if(!this.nuevoCliente.nombre || !this.nuevoCliente.email) return;
    this.clientesService.agregarCliente(this.nuevoCliente).subscribe(res => {
        if(res.exito) {
            Swal.fire('Éxito', 'Cliente registrado rápidamente', 'success');
            this.cerrarModalCliente();
            this.cargarDatosDashboard(); 
            this.nuevoCliente = { nombre: '', email: '', telefono: '', direccion: '' };
        }
    });
  }

  guardarMascotaRapida() {
    if(!this.nuevaMascota.nombre || !this.nuevaMascota.cliente_id) return;
    this.mascotasService.agregarMascota(this.nuevaMascota).subscribe(res => {
        if(res.exito) {
            Swal.fire('Éxito', 'Mascota registrada rápidamente', 'success');
            this.cerrarModalMascota();
            this.cargarDatosDashboard();
            this.nuevaMascota = { cliente_id: 0, nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0 };
        }
    });
  }


  abrirModalCita() { 
  }

  abrirModalCliente() { this.mostrarModalCliente = true; }
  cerrarModalCliente() { this.mostrarModalCliente = false; }
  
  abrirModalMascota() { this.mostrarModalMascota = true; }
  cerrarModalMascota() { this.mostrarModalMascota = false; }
}