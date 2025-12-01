import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../service/reportes.service';
import { DashboardData, DatoGrafico } from '../../../interfaces/reporte.interface';
import Swal from 'sweetalert2';

import { FacturasService } from '../../../service/facturas.service';
import { CitasService } from '../../../service/citas.service';
import { ProductosService } from '../../../service/productos.service';
import { ConfiguracionService } from '../../../service/configuracion.service';

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

  nombreClinica = '';


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
    private productosService: ProductosService,
    private configService: ConfiguracionService
  ) {
   
    const date = new Date();
    this.fechaFin = date.toISOString().split('T')[0];
    date.setMonth(date.getMonth() - 1);
    this.fechaInicio = date.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.configService.infoClinica$.subscribe(info => {
      this.nombreClinica = info.nombre;
    });

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


  // --- EXPORTAR A EXCEL (CSV) ---
  exportarExcel() {
      let datosAExportar: any[] = [];
      let nombreArchivo = '';

      if(this.tabActiva === 'facturacion') {
          datosAExportar = this.listaFacturas;
          nombreArchivo = 'Reporte_Facturacion';
      } else if(this.tabActiva === 'citas') {
          datosAExportar = this.listaCitas;
          nombreArchivo = 'Reporte_Citas';
      } else if(this.tabActiva === 'inventario') {
          datosAExportar = this.listaInventario;
          nombreArchivo = 'Reporte_Inventario';
      }

      if (datosAExportar.length === 0) {
          Swal.fire('Atención', 'No hay datos para exportar en esta tabla.', 'info');
          return;
      }

      this.reportesService.exportarCSV(datosAExportar, nombreArchivo);
      Swal.fire('Descarga Iniciada', 'Tu archivo Excel se está descargando.', 'success');
  }

  exportarPDF() {
      let tituloReporte = '';
      let contenidoTabla = '';
      
      // 1. Preparar Datos de la Tabla Detallada según la pestaña activa
      if (this.tabActiva === 'facturacion') {
          tituloReporte = 'Reporte Financiero y Facturación';
          contenidoTabla = this.generarTablaHTML(this.listaFacturas, ['Folio', 'Cliente', 'Fecha', 'Total', 'Estado'], ['folio_factura', 'nombre_cliente', 'fecha_emision', 'total', 'estado']);
      } else if (this.tabActiva === 'citas') {
          tituloReporte = 'Reporte Operativo de Citas';
          contenidoTabla = this.generarTablaHTML(this.listaCitas, ['Fecha', 'Paciente', 'Motivo', 'Estado'], ['fecha_hora', 'nombre_mascota', 'motivo', 'estado']);
      } else {
          tituloReporte = 'Reporte de Inventario y Stock';
          contenidoTabla = this.generarTablaHTML(this.listaInventario, ['Producto', 'SKU', 'Stock', 'Precio'], ['nombre', 'sku', 'stock_actual', 'precio_venta']);
      }

      // --- GENERACIÓN DE GRÁFICOS Y TOPS PARA EL PDF ---

      // A. Gráfico de Ingresos Mensuales (Barras Verticales)
      let barrasIngresosHTML = '';
      const maxIngreso = Math.max(...this.data.graficos.ingresos_mensuales.map(d => d.valor), 1);
      
      this.data.graficos.ingresos_mensuales.forEach(d => {
          const altura = (d.valor / maxIngreso) * 100; // Altura relativa (max 100px)
          barrasIngresosHTML += `
            <div style="display: flex; flex-direction: column; align-items: center; width: 14%; margin: 0 2px;">
                <div style="font-size: 9px; color: #555; margin-bottom: 2px;">$${d.valor}</div>
                <div style="width: 100%; height: ${altura}px; background-color: #48C9B0 !important; -webkit-print-color-adjust: exact; border-radius: 3px 3px 0 0;"></div>
                <div style="font-size: 9px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.etiqueta}</div>
            </div>
          `;
      });

      // B. Top Productos (Barras Horizontales)
      let filasTopProductos = '';
      this.data.graficos.top_productos.forEach((d, i) => {
           filasTopProductos += `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                    <span>${i + 1}. ${d.etiqueta}</span>
                    <span style="font-weight: bold;">${d.valor} un.</span>
                </div>
                <div style="width: 100%; background-color: #eee !important; height: 6px; border-radius: 3px; -webkit-print-color-adjust: exact;">
                    <div style="width: ${d.porcentaje}%; background-color: #F4D03F !important; height: 100%; border-radius: 3px; -webkit-print-color-adjust: exact;"></div>
                </div>
            </div>
           `;
      });

      // C. Distribución de Citas (Lista con Porcentajes)
      let filasTiposCita = '';
      this.data.graficos.tipos_cita.forEach(d => {
          filasTiposCita += `
            <div style="margin-bottom: 8px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span style="color: #333;">${d.etiqueta}</span>
                    <span>${d.valor} citas</span>
                </div>
                <div style="font-size: 9px; color: #888; text-align: right;">${d.porcentaje ? d.porcentaje.toFixed(1) : 0}% del total</div>
            </div>
          `;
      });

      // D. Estructura del Dashboard Resumido
      const dashboardHTML = `
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
            <!-- Sección Ingresos -->
            <div style="flex: 2; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
                <h3 style="font-size: 14px; color: #2C3E50; border-bottom: 2px solid #48C9B0; padding-bottom: 5px; margin-bottom: 15px; margin-top: 0;">Tendencia de Ingresos</h3>
                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 130px; padding-top: 10px;">
                    ${barrasIngresosHTML}
                </div>
            </div>

            <!-- Sección Top Productos -->
            <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; page-break-inside: avoid; min-width: 200px;">
                <h3 style="font-size: 14px; color: #2C3E50; border-bottom: 2px solid #F4D03F; padding-bottom: 5px; margin-bottom: 15px; margin-top: 0;">Top Productos</h3>
                ${filasTopProductos}
            </div>

            <!-- Sección Tipos de Cita -->
            <div style="flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; page-break-inside: avoid; min-width: 200px;">
                <h3 style="font-size: 14px; color: #2C3E50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 15px; margin-top: 0;">Tipos de Cita</h3>
                ${filasTiposCita}
            </div>
        </div>
      `;

      // 3. Generar Resumen de KPIs (Encabezado de números)
      const kpisHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; background-color: #f8f9fa !important; padding: 15px; border-radius: 8px; -webkit-print-color-adjust: exact;">
            <div style="text-align: center; flex: 1; border-right: 1px solid #ddd;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Ingresos Totales</div>
                <div style="font-size: 20px; font-weight: bold; color: #2C3E50; margin-top: 5px;">$${this.data.kpis.ingresos.toLocaleString()}</div>
            </div>
            <div style="text-align: center; flex: 1; border-right: 1px solid #ddd;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Citas Completadas</div>
                <div style="font-size: 20px; font-weight: bold; color: #2C3E50; margin-top: 5px;">${this.data.kpis.citas}</div>
            </div>
            <div style="text-align: center; flex: 1; border-right: 1px solid #ddd;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Clientes Nuevos</div>
                <div style="font-size: 20px; font-weight: bold; color: #2C3E50; margin-top: 5px;">${this.data.kpis.nuevos_clientes}</div>
            </div>
            <div style="text-align: center; flex: 1;">
                <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Ticket Promedio</div>
                <div style="font-size: 20px; font-weight: bold; color: #2C3E50; margin-top: 5px;">$${this.data.kpis.ticket_promedio.toFixed(2)}</div>
            </div>
        </div>
      `;

      // 4. Abrir Ventana de Impresión
      const ventana = window.open('', '', 'height=900,width=1100');
      if (ventana) {
          ventana.document.write('<html><head><title>' + tituloReporte + '</title>');
          
          // Estilos CSS para impresión
          ventana.document.write(`
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                th { background-color: #2C3E50 !important; color: white !important; -webkit-print-color-adjust: exact; text-transform: uppercase; font-size: 11px; }
                tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
                
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #48C9B0; padding-bottom: 20px; }
                .logo-text { font-size: 26px; font-weight: bold; color: #2C3E50; }
                .meta { text-align: right; font-size: 12px; color: #6b7280; }
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 15px; }
                
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
          `);
          ventana.document.write('</head><body>');
          
          // Encabezado
          const fechaHoy = new Date().toLocaleDateString();
          ventana.document.write(`
            <div class="header">
                <div>
                    <div class="logo-text">${this.nombreClinica}</div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">Sistema Integral de Gestión Veterinaria</div>
                </div>
                <div class="meta">
                    <p><strong>Reporte Generado:</strong> ${fechaHoy}</p>
                    <p><strong>Solicitado por:</strong> Administrador</p>
                    <p><strong>Periodo:</strong> ${this.fechaInicio} al ${this.fechaFin}</p>
                </div>
            </div>
            
            <h1 style="text-align: center; margin-bottom: 10px; color: #2C3E50; font-size: 24px;">${tituloReporte}</h1>
            <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 30px;">Resumen ejecutivo y detalle de operaciones</p>
          `);

          // Insertar KPIs Generales
          ventana.document.write(kpisHTML);
          
          // Insertar Dashboard Gráfico (Se incluye siempre para dar contexto, o puedes condicionarlo)
          ventana.document.write(dashboardHTML);

          // Insertar Tabla Detallada
          ventana.document.write(`<h3 style="color: #2C3E50; font-size: 16px; margin-bottom: 10px; border-left: 4px solid #48C9B0; padding-left: 10px;">Detalle de Registros: ${this.tabActiva.toUpperCase()}</h3>`);
          ventana.document.write(contenidoTabla);

          // Pie de página
          ventana.document.write(`
            <div class="footer">
                Este documento es confidencial y para uso interno exclusivo de la clínica veterinaria Patitas Felices. <br>
                Generado automáticamente el ${new Date().toLocaleString()}.
            </div>
          `);
          
          ventana.document.write('</body></html>');
          ventana.document.close();
          ventana.focus();

          setTimeout(() => {
              ventana.print();
              ventana.close();
          }, 1000); 
      }
  }

  // Helper para construir la tabla HTML
  generarTablaHTML(datos: any[], headers: string[], keys: string[]): string {
      if (!datos || datos.length === 0) return '<p class="text-center text-gray-500 py-4">No hay datos para mostrar en este periodo.</p>';

      let html = '<table><thead><tr>';
      headers.forEach(h => html += `<th>${h}</th>`);
      html += '</tr></thead><tbody>';
      
      datos.forEach(row => {
          html += '<tr>';
          keys.forEach(k => {
              let val = row[k];
              // Formateo básico
              if (k.includes('fecha')) val = new Date(val).toLocaleDateString();
              if (k === 'total' || k.includes('precio')) val = `$${val}`;
              html += `<td>${val || '-'}</td>`;
          });
          html += '</tr>';
      });
      
      html += '</tbody></table>';
      return html;
  }
}
