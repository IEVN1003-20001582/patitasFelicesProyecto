import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Factura, DetalleFactura } from '../../../interfaces/factura.interface';
import { FacturasService } from '../../../service/facturas.service';
import { ClientesService } from '../../../service/clientes.service';

@Component({
  selector: 'app-gestion-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-facturacion.component.html',
 
})
export class GestionFacturacionComponent implements OnInit {

  facturas: any[] = [];
  facturasFiltradas: any[] = [];
  
  clientes: any[] = [];
  cargosPendientes: DetalleFactura[] = []; // Lista de cosas por cobrar

  kpis = { totalFacturado: 0, pendiente: 0, vencidas: 0 };

  // Modales
  mostrarModalGenerar = false;
  mostrarModalVer = false;
  mostrarModalFiltros = false;

  // Formulario Generar
  pasoActual = 1;
  clienteSeleccionadoId: number = 0;
  nombreClienteSeleccionado = '';
  
  totalCalculado = 0;

  // Detalle Factura (Ver)
  facturaSeleccionada: any = null;
  textoBusqueda = '';

  constructor(
    private facturasService: FacturasService,
    private clientesService: ClientesService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    // 1. Facturas
    this.facturasService.getFacturas().subscribe((res: any) => {
      this.facturas = res.facturas || [];
      this.facturasFiltradas = [...this.facturas];
      this.calcularKPIs();
    });

    // 2. Clientes (para el select)
    this.clientesService.getClientes().subscribe((res: any) => {
      this.clientes = res.clientes || (Array.isArray(res) ? res : []);
    });
  }

  calcularKPIs() {
    this.kpis.totalFacturado = this.facturas.reduce((acc, f) => acc + parseFloat(f.total), 0);
    this.kpis.pendiente = this.facturas
        .filter(f => f.estado === 'pendiente')
        .reduce((acc, f) => acc + parseFloat(f.total), 0);
    this.kpis.vencidas = 0; 
  }
  
  filtrar() {
     const txt = this.textoBusqueda.toLowerCase();
     this.facturasFiltradas = this.facturas.filter(f => 
        f.folio_factura.toLowerCase().includes(txt) || 
        (f.nombre_cliente && f.nombre_cliente.toLowerCase().includes(txt))
     );
  }

  // --- PASO 1: SELECCIONAR CLIENTE ---
  onClienteChange() {
    if (this.clienteSeleccionadoId) {
        const cliente = this.clientes.find(c => c.id == this.clienteSeleccionadoId);
        this.nombreClienteSeleccionado = cliente ? (cliente.nombre_completo || cliente.nombre) : '';
        
        // Buscar cargos pendientes de este cliente
        this.facturasService.getCargosPendientes(this.clienteSeleccionadoId).subscribe((res: any) => {
            this.cargosPendientes = res.cargos || [];
            // Marcar todos por defecto
            this.cargosPendientes.forEach(c => c.selected = true);
            this.calcularTotalSeleccionado();
            this.pasoActual = 2;
        });
    }
  }

  // --- PASO 2: CALCULAR TOTAL ---
  calcularTotalSeleccionado() {
    this.totalCalculado = this.cargosPendientes
        .filter(c => c.selected)
        .reduce((acc, c) => acc + parseFloat(c.importe.toString()), 0);
  }

  // --- GUARDAR ---
  generarFactura() {
    const itemsAFacturar = this.cargosPendientes.filter(c => c.selected);
    
    if (itemsAFacturar.length === 0) {
        Swal.fire('Vacío', 'Debes seleccionar al menos un concepto', 'warning');
        return;
    }

    const nuevaFactura: Factura = {
        cliente_id: this.clienteSeleccionadoId,
        subtotal: this.totalCalculado,
        impuestos: 0, 
        total: this.totalCalculado,
        estado: 'pendiente',
        metodo_pago: 'Efectivo',
        items: itemsAFacturar
    };

    this.facturasService.crearFactura(nuevaFactura).subscribe(res => {
        if (res.exito) {
            Swal.fire('Generada', 'La factura se ha creado correctamente', 'success');
            this.cerrarModalGenerar();
            this.cargarDatos();
        } else {
            Swal.fire('Error', res.mensaje, 'error');
        }
    });
  }

  marcarPagada() {
    if (!this.facturaSeleccionada) return;
    this.facturasService.marcarPagada(this.facturaSeleccionada.id).subscribe(res => {
        if (res.exito) {
            Swal.fire('Pagado', 'Factura marcada como pagada', 'success');
            this.cerrarModalVer();
            this.cargarDatos();
        }
    });
  }

  imprimirFactura() {
    // Opción A: Imprimir toda la ventana (simple pero imprime el fondo gris también)
    // window.print(); 

    // Opción B: Imprimir solo el contenido de la factura (Profesional)
    const contenido = document.getElementById('factura-imprimible')?.innerHTML;
    
    if (contenido) {
        // Creamos un iframe oculto o una ventana nueva
        const ventanaImpresion = window.open('', '', 'height=600,width=800');
        
        if (ventanaImpresion) {
            ventanaImpresion.document.write('<html><head><title>Factura</title>');
            // Importante: Incluir estilos básicos o Tailwind CDN para que se vea bonito
            ventanaImpresion.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            ventanaImpresion.document.write('</head><body class="p-8">');
            ventanaImpresion.document.write(contenido);
            ventanaImpresion.document.write('</body></html>');
            
            ventanaImpresion.document.close(); // Necesario para terminar la carga
            ventanaImpresion.focus();
            
            // Esperar un poco a que carguen los estilos antes de imprimir
            setTimeout(() => {
                ventanaImpresion.print();
                ventanaImpresion.close();
            }, 500);
        }
    }
  }

  // --- MODALES ---
  abrirModalGenerar() {
    this.pasoActual = 1;
    this.clienteSeleccionadoId = 0;
    this.totalCalculado = 0;
    this.mostrarModalGenerar = true;
  }

  abrirModalVer(factura: any) {
    this.facturaSeleccionada = factura;
    this.mostrarModalVer = true;
  }

  cerrarModalGenerar() { this.mostrarModalGenerar = false; }
  cerrarModalVer() { this.mostrarModalVer = false; }
  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }
}