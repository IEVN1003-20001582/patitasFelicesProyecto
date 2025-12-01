import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Factura, DetalleFactura } from '../../../interfaces/factura.interface';
import { FacturasService } from '../../../service/facturas.service';
import { ClientesService } from '../../../service/clientes.service';
import { ConfiguracionService, InfoClinica } from '../../../service/configuracion.service'; 

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
  cargosPendientes: DetalleFactura[] = []; 
  kpis = { totalFacturado: 0, pendiente: 0, vencidas: 0 };


  infoClinica: InfoClinica | null = null;


  mostrarModalGenerar = false;
  mostrarModalVer = false;
  mostrarModalFiltros = false;
  pasoActual = 1;
  clienteSeleccionadoId: number = 0;
  nombreClienteSeleccionado = '';
  totalCalculado = 0;
  facturaSeleccionada: any = null;
  textoBusqueda = '';
  filtroEstado = 'todos'; 

  constructor(
    private facturasService: FacturasService,
    private clientesService: ClientesService,
    private configService: ConfiguracionService 
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    
   
    this.configService.infoClinica$.subscribe(info => {
        this.infoClinica = info;
    });
  }

  
  cargarDatos() {
    this.facturasService.getFacturas().subscribe((res: any) => {
      this.facturas = res.facturas || [];
      this.facturasFiltradas = [...this.facturas];
      this.filtrar(); 
      this.calcularKPIs();
    });
    this.clientesService.getClientes().subscribe((res: any) => this.clientes = res.clientes || []);
  }
  calcularKPIs() {
    this.kpis.totalFacturado = this.facturas.reduce((acc, f) => acc + parseFloat(f.total), 0);
    this.kpis.pendiente = this.facturas.filter(f => f.estado === 'pendiente').reduce((acc, f) => acc + parseFloat(f.total), 0);
    this.kpis.vencidas = 0; 
  }
  filtrar() {
     const txt = this.textoBusqueda.toLowerCase();
     this.facturasFiltradas = this.facturas.filter(f => {
        const matchTexto = (f.folio_factura && f.folio_factura.toLowerCase().includes(txt)) || (f.nombre_cliente && f.nombre_cliente.toLowerCase().includes(txt));
        let matchEstado = true;
        if (this.filtroEstado !== 'todos') matchEstado = f.estado === this.filtroEstado;
        return matchTexto && matchEstado;
     });
  }
  aplicarFiltros() { this.filtrar(); this.cerrarModalFiltros(); }
  onClienteChange() {
    if (this.clienteSeleccionadoId) {
        const cliente = this.clientes.find(c => c.id == this.clienteSeleccionadoId);
        this.nombreClienteSeleccionado = cliente ? (cliente.nombre_completo || cliente.nombre) : '';
        this.facturasService.getCargosPendientes(this.clienteSeleccionadoId).subscribe((res: any) => {
            this.cargosPendientes = res.cargos || [];
            this.cargosPendientes.forEach(c => c.selected = true);
            this.calcularTotalSeleccionado();
            this.pasoActual = 2;
        });
    }
  }
  calcularTotalSeleccionado() {
    this.totalCalculado = this.cargosPendientes.filter(c => c.selected).reduce((acc, c) => acc + parseFloat(c.importe.toString()), 0);
  }

  generarFactura() {
    const itemsAFacturar = this.cargosPendientes.filter(c => c.selected);
    if (itemsAFacturar.length === 0) { Swal.fire('Vacío', 'Debes seleccionar al menos un concepto', 'warning'); return; }


    const tasaIVA = this.infoClinica ? (this.infoClinica.iva / 100) : 0.16;


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
        if (res.exito) { Swal.fire('Pagado', 'Factura marcada como pagada', 'success'); this.cerrarModalVer(); this.cargarDatos(); }
    });
  }

 
  imprimirFactura() {
    const contenido = document.getElementById('factura-imprimible')?.innerHTML;
    if (contenido) {
        const ventanaImpresion = window.open('', '', 'height=600,width=800');
        if (ventanaImpresion) {
          
            const titulo = `Factura - ${this.infoClinica?.nombre || 'Veterinaria'}`;
            
            ventanaImpresion.document.write(`<html><head><title>${titulo}</title>`);
            ventanaImpresion.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            ventanaImpresion.document.write('</head><body class="p-8">');
            ventanaImpresion.document.write(contenido);
            ventanaImpresion.document.write('</body></html>');
            
            ventanaImpresion.document.close(); 
            ventanaImpresion.focus();
            setTimeout(() => {
                ventanaImpresion.print();
                ventanaImpresion.close();
            }, 500);
        }
    }
  }


  abrirModalGenerar() { this.pasoActual = 1; this.clienteSeleccionadoId = 0; this.totalCalculado = 0; this.mostrarModalGenerar = true; }
  abrirModalVer(factura: any) { this.facturaSeleccionada = factura; this.mostrarModalVer = true; }
  cerrarModalGenerar() { this.mostrarModalGenerar = false; }
  cerrarModalVer() { this.mostrarModalVer = false; }
  abrirModalFiltros() { this.mostrarModalFiltros = true; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }
}