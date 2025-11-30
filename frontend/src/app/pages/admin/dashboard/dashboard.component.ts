import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Importar Servicios Existentes
import { ClientesService } from '../../../service/clientes.service';
import { MascotasService } from '../../../service/mascotas.service';
import { CitasService } from '../../../service/citas.service';
import { FacturasService } from '../../../service/facturas.service';
import { ProductosService } from '../../../service/productos.service';

// Importar Interfaces necesarias para formularios rápidos
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

  // Listas para Widgets
  proximasCitas: any[] = [];
  alertasInventario: any[] = [];

  // Datos para Gráficos (Simulados visualmente con CSS en el HTML)
  // En un caso real, usarías una librería como Chart.js, pero aquí usaremos barras CSS simples
  ingresosMensuales = [4500, 5200, 4800, 6100, 5900, 7200]; // Ejemplo

  // Modales de Acciones Rápidas
  mostrarModalCita = false;
  mostrarModalCliente = false;
  mostrarModalMascota = false;

  // Formularios Rápidos (Reutilizamos lógica simplificada)
  nuevoCliente: Cliente = { nombre: '', email: '', telefono: '', direccion: '' };
  nuevaMascota: Mascota = { cliente_id: 0, nombre: '', especie: '', raza: '', fecha_nacimiento: '', sexo: 'Macho', peso: 0 };
  
  // Listas para selects de formularios rápidos
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
    // 1. Clientes
    this.clientesService.getClientes().subscribe((res: any) => {
      const lista = res.clientes || [];
      this.totalClientes = lista.length;
      this.clientesList = lista; // Para el select de mascota
    });

    // 2. Mascotas
    this.mascotasService.getMascotas().subscribe((res: any) => {
      const lista = res.mascotas || [];
      this.totalMascotas = lista.length;
    });

    // 3. Citas (Filtrar por HOY y Futuras)
    this.citasService.getCitas().subscribe((res: any) => {
      const todas = res.citas || [];
      const hoyStr = new Date().toISOString().split('T')[0];
      
      // Citas de HOY
      const citasHoy = todas.filter((c: any) => c.fecha_hora.startsWith(hoyStr));
      this.citasHoyCount = citasHoy.length;

      // Próximas 5 citas (pendientes o confirmadas, desde hoy)
      this.proximasCitas = todas
        .filter((c: any) => c.fecha_hora >= hoyStr && (c.estado === 'pendiente' || c.estado === 'confirmada'))
        .sort((a: any, b: any) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
        .slice(0, 5);
    });

    // 4. Finanzas (Ingresos del día)
    this.facturasService.getFacturas().subscribe((res: any) => {
      const todas = res.facturas || [];
      const hoyStr = new Date().toISOString().split('T')[0];
      
      // Sumar total de facturas PAGADAS con fecha de HOY
      this.ingresosDia = todas
        .filter((f: any) => f.fecha_emision.startsWith(hoyStr) && f.estado === 'pagada')
        .reduce((acc: number, f: any) => acc + parseFloat(f.total), 0);
    });

    // 5. Inventario (Alertas)
    this.productosService.getProductos().subscribe((res: any) => {
      const todos = res.productos || [];
      // Filtrar Stock Bajo o Agotado
      this.alertasInventario = todos.filter((p: any) => p.stock_actual <= p.stock_minimo);
    });
  }

  // --- ACCIONES RÁPIDAS (Lógica simplificada) ---

  guardarClienteRapido() {
    if(!this.nuevoCliente.nombre || !this.nuevoCliente.email) return;
    this.clientesService.agregarCliente(this.nuevoCliente).subscribe(res => {
        if(res.exito) {
            Swal.fire('Éxito', 'Cliente registrado rápidamente', 'success');
            this.cerrarModalCliente();
            this.cargarDatosDashboard(); // Recargar contadores
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

  // Modales
  abrirModalCita() { 
      // Aquí podríamos abrir el modal, pero como es complejo, mejor redirigimos
      // O reutilizamos el componente de citas. Para este dashboard, redirigir es UX aceptable.
      // Pero si quieres el modal, tendríamos que copiar la lógica del form de citas.
      // Por simplicidad en este ejemplo, redirigiremos.
  }

  abrirModalCliente() { this.mostrarModalCliente = true; }
  cerrarModalCliente() { this.mostrarModalCliente = false; }
  
  abrirModalMascota() { this.mostrarModalMascota = true; }
  cerrarModalMascota() { this.mostrarModalMascota = false; }
}