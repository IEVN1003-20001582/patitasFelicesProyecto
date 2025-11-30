import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { Producto } from '../../../interfaces/producto.interface';
import { ProductosService } from '../../../service/productos.service';
import { ConfiguracionService } from '../../../service/configuracion.service'; 

@Component({
  selector: 'app-gestion-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-inventario.component.html',
 
})
export class GestionInventarioComponent implements OnInit {

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  

  categorias: any[] = []; 

  kpis = { totalValor: 0, totalProductos: 0, alertas: 0 };
 
  mostrarModalAgregar = false;
  mostrarModalAjuste = false;
  mostrarModalFiltros = false;
  mostrarModalEliminar = false;
  mostrarModalVista = false;
  esEdicion = false;
  textoBusqueda = '';
  prodForm: Producto = this.initProd();
  prodSeleccionado: any = null;
  nuevoStockAjuste: number = 0;

  constructor(
    private productosService: ProductosService,
    private configService: ConfiguracionService 
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias(); 
  }


  cargarCategorias() {
    this.configService.getCategorias().subscribe((res: any) => {
        this.categorias = res.categorias || [];
    });
  }

  cargarProductos() {
    this.productosService.getProductos().subscribe((res: any) => {
      let lista = res.productos || (Array.isArray(res) ? res : []);
      this.productos = lista.map((p: any) => {
        let estado: 'En Stock' | 'Stock Bajo' | 'Agotado' = 'En Stock';
        if (p.stock_actual <= 0) estado = 'Agotado';
        else if (p.stock_actual <= p.stock_minimo) estado = 'Stock Bajo';
        return { ...p, estado: estado };
      });
      this.productosFiltrados = [...this.productos];
      this.calcularKPIs();
    });
  }

  
  calcularKPIs() {
    this.kpis.totalProductos = this.productos.length;
    this.kpis.totalValor = this.productos.reduce((acc, p) => acc + (p.precio_venta * p.stock_actual), 0);
    this.kpis.alertas = this.productos.filter(p => p.estado !== 'En Stock').length;
  }

  filtrar() {
    const txt = this.textoBusqueda.toLowerCase();
    this.productosFiltrados = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(txt) || 
      (p.sku && p.sku.toLowerCase().includes(txt))
    );
  }

  guardarProducto() {
    if (!this.prodForm.nombre || !this.prodForm.precio_venta) {
        Swal.fire('Faltan datos', 'Nombre y Precio son obligatorios', 'warning');
        return;
    }
    if (this.esEdicion && this.prodForm.id) {
        this.productosService.actualizarProducto(this.prodForm.id, this.prodForm).subscribe(res => {
            if(res.exito) this.exitoOperacion('Actualizado');
            else Swal.fire('Error', res.mensaje, 'error');
        });
    } else {
        this.productosService.agregarProducto(this.prodForm).subscribe(res => {
            if(res.exito) this.exitoOperacion('Registrado');
            else Swal.fire('Error', res.mensaje, 'error');
        });
    }
  }

  guardarAjusteStock() {
    if (!this.prodSeleccionado) return;
    this.productosService.ajustarStock(this.prodSeleccionado.id, this.nuevoStockAjuste).subscribe(res => {
        if(res.exito) {
            Swal.fire('Ajustado', 'Stock actualizado', 'success');
            this.cerrarModalAjuste();
            this.cargarProductos();
        }
    });
  }

  eliminarProductoConfirmado() {
    if (!this.prodSeleccionado) return;
    this.productosService.eliminarProducto(this.prodSeleccionado.id).subscribe(res => {
        if(res.exito) {
            Swal.fire('Eliminado', 'Producto borrado', 'success');
            this.cerrarModalEliminar();
            this.cargarProductos();
        } else {
            Swal.fire('Error', 'No se puede borrar (probablemente tiene historial)', 'error');
        }
    });
  }

  exitoOperacion(msg: string) {
    Swal.fire('Éxito', `Producto ${msg}`, 'success');
    this.cerrarModalAgregar();
    this.cargarProductos();
  }

  abrirModalAgregar() {
    this.esEdicion = false;
    this.prodForm = this.initProd();
    this.mostrarModalAgregar = true;
  }

  abrirModalEditar(prod: any) {
    this.esEdicion = true;
    this.prodForm = { ...prod };
    this.mostrarModalAgregar = true;
  }

  abrirModalAjuste(prod: any) {
    this.prodSeleccionado = prod;
    this.nuevoStockAjuste = prod.stock_actual;
    this.mostrarModalAjuste = true;
  }
  
  abrirModalEliminar(prod: any) {
    this.prodSeleccionado = prod;
    this.mostrarModalEliminar = true;
  }

  abrirVistaRapida(prod: any) {
    this.prodSeleccionado = prod;
    this.mostrarModalVista = true;
  }

  cerrarModalAgregar() { this.mostrarModalAgregar = false; }
  cerrarModalAjuste() { this.mostrarModalAjuste = false; }
  cerrarModalEliminar() { this.mostrarModalEliminar = false; }
  cerrarVistaRapida() { this.mostrarModalVista = false; }
  cerrarModalFiltros() { this.mostrarModalFiltros = false; }
  abrirModalFiltros() { this.mostrarModalFiltros = true; }

  initProd(): Producto {
    return { 
        categoria_id: 0, nombre: '', precio_venta: 0, stock_actual: 0, stock_minimo: 5, 
        sku: '', descripcion: '', proveedor: '', precio_costo: 0 
    };
  }
}