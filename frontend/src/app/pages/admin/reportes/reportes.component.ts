import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../service/reportes.service';
import { DashboardData, DatoGrafico } from '../../../interfaces/reporte.interface';

import { FacturasService } from '../../../service/facturas.service';
import { CitasService } from '../../../service/citas.service';
import { ProductosService } from '../../../service/productos.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',

})
export class ReportesComponent implements OnInit {


  fechaInicio: string = '';
  fechaFin: string = '';
  vetSeleccionado: string = 'todos';


  data: DashboardData = {
    kpis: { ingresos: 0, citas: 0, nuevos_clientes: 0, ticket_promedio: 0 },
    graficos: { ingresos_mensuales: [], tipos_cita: [], top_productos: [] }
  };


  listaFacturas: any[] = [];
  listaCitas: any[] = [];
  listaInventario: any[] = [];


  tabActiva = 'facturacion';

  constructor(
    private reportesService: ReportesService,
    private facturasService: FacturasService,
    private citasService: CitasService,
    private productosService: ProductosService
  ) {
   
    const date = new Date();
    this.fechaFin = date.toISOString().split('T')[0];
    date.setMonth(date.getMonth() - 1);
    this.fechaInicio = date.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarTablasDetalle();
  }

  cargarDashboard() {
    this.reportesService.obtenerDashboard(this.fechaInicio, this.fechaFin).subscribe((res: any) => {
        if(res.exito) {
            this.data = res;
            this.procesarGraficos();
        }
    });
  }

  cargarTablasDetalle() {
      
      this.facturasService.getFacturas().subscribe((res:any) => this.listaFacturas = res.facturas || []);
      this.citasService.getCitas().subscribe((res:any) => this.listaCitas = res.citas || []);
      this.productosService.getProductos().subscribe((res:any) => this.listaInventario = res.productos || []);
  }


  procesarGraficos() {
    
    const maxIngreso = Math.max(...this.data.graficos.ingresos_mensuales.map(d => d.valor), 1);
    this.data.graficos.ingresos_mensuales.forEach(d => {
        d.porcentaje = (d.valor / maxIngreso) * 100;
    });

    
    const totalCitas = this.data.graficos.tipos_cita.reduce((acc, d) => acc + d.valor, 0);
    this.data.graficos.tipos_cita.forEach(d => {
        d.porcentaje = totalCitas > 0 ? (d.valor / totalCitas) * 100 : 0;
    });

 
    const maxProd = Math.max(...this.data.graficos.top_productos.map(d => d.valor), 1);
    this.data.graficos.top_productos.forEach(d => {
        d.porcentaje = (d.valor / maxProd) * 100;
    });
  }

  aplicarFiltros() {
      this.cargarDashboard();
      
  }

  cambiarTab(tab: string) { this.tabActiva = tab; }


  exportarExcel() {
      if(this.tabActiva === 'facturacion') this.reportesService.exportarCSV(this.listaFacturas, 'Reporte_Facturacion');
      if(this.tabActiva === 'citas') this.reportesService.exportarCSV(this.listaCitas, 'Reporte_Citas');
      if(this.tabActiva === 'inventario') this.reportesService.exportarCSV(this.listaInventario, 'Reporte_Inventario');
  }

  exportarPDF() {
      window.print(); 
  }
}